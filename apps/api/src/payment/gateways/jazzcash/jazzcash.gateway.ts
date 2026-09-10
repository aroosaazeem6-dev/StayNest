import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import {
  JazzCashConfig,
  JazzCashPaymentRequest,
  JazzCashPreparedPayment,
  JazzCashGatewayOptions,
} from './jazzcash.types';

@Injectable()
export class JazzCashGateway {
  private readonly config: JazzCashConfig;

  constructor(private readonly configService: ConfigService) {
    this.config = {
      merchantId: this.configService.get<string>('JAZZCASH_MERCHANT_ID') ?? '',
      password: this.configService.get<string>('JAZZCASH_PASSWORD') ?? '',
      integritySalt: this.configService.get<string>('JAZZCASH_INTEGRITY_SALT') ?? '',
      returnUrl: this.configService.get<string>('JAZZCASH_RETURN_URL') ?? '',
      sandbox: this.configService.get<string>('JAZZCASH_SANDBOX') === 'true',
    };
  }

  preparePayment(options: JazzCashGatewayOptions): JazzCashPreparedPayment {
    const { bookingId, amount, description } = options;

    const transactionRef = this.generateTransactionRef(bookingId);
    const amountString = this.convertAmountToJazzCashFormat(amount);
    const currency = 'PKR';
    const now = new Date();
    const txnDateTime = this.formatDateTime(now);
    const txnExpiryDateTime = this.formatDateTime(new Date(now.getTime() + 30 * 60 * 1000));
    const billReference = bookingId.slice(0, 20);
    const desc = description ?? `Payment for booking ${bookingId}`;

    const requestFields = this.buildRequestFields({
      transactionRef,
      amount: amountString,
      currency,
      txnDateTime,
      txnExpiryDateTime,
      billReference,
      description: desc,
    });

    const endpointUrl = this.getEndpointUrl();

    return {
      transactionRef,
      amount: amountString,
      currency,
      requestFields,
      endpointUrl,
    };
  }

  private generateTransactionRef(bookingId: string): string {
    const timestamp = Date.now().toString(36);
    const randomPart = Math.random().toString(36).substring(2, 8);
    const bookingPart = bookingId.replace(/[^a-zA-Z0-9]/g, '').slice(0, 8);
    return `TNX${bookingPart}${timestamp}${randomPart}`.toUpperCase();
  }

  private convertAmountToJazzCashFormat(amount: number): string {
    const amountInPaisa = Math.round(amount * 100);
    return amountInPaisa.toString();
  }

  private formatDateTime(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${year}${month}${day}${hours}${minutes}${seconds}`;
  }

  private buildRequestFields(params: {
    transactionRef: string;
    amount: string;
    currency: string;
    txnDateTime: string;
    txnExpiryDateTime: string;
    billReference: string;
    description: string;
  }): JazzCashPaymentRequest {
    const fields: JazzCashPaymentRequest = {
      pp_Version: '1.0',
      pp_TxnType: 'MWALLET',
      pp_MerchantID: this.config.merchantId,
      pp_Password: this.config.password,
      pp_TxnRefNo: params.transactionRef,
      pp_Amount: params.amount,
      pp_TxnCurrency: params.currency,
      pp_TxnDateTime: params.txnDateTime,
      pp_TxnExpiryDateTime: params.txnExpiryDateTime,
      pp_BillReference: params.billReference,
      pp_Description: params.description,
      pp_ReturnURL: this.config.returnUrl,
      pp_SecureHash: '',
    };

    fields.pp_SecureHash = this.generateSecureHash(fields);

    return fields;
  }

  private generateSecureHash(fields: JazzCashPaymentRequest): string {
    const hashString = this.buildHashString(fields);
    const hmac = crypto.createHmac('sha256', this.config.integritySalt);
    hmac.update(hashString);
    return hmac.digest('hex').toUpperCase();
  }

  private buildHashString(fields: JazzCashPaymentRequest): string {
    const hashFields = [
      'pp_Version',
      'pp_TxnType',
      'pp_MerchantID',
      'pp_Password',
      'pp_TxnRefNo',
      'pp_Amount',
      'pp_TxnCurrency',
      'pp_TxnDateTime',
      'pp_TxnExpiryDateTime',
      'pp_BillReference',
      'pp_Description',
      'pp_ReturnURL',
    ];

    return hashFields
      .map((key) => fields[key as keyof JazzCashPaymentRequest])
      .join('&');
  }

  private getEndpointUrl(): string {
    return this.config.sandbox
      ? 'https://sandbox.jazzcash.com.pk/CustomerPortal/transactionpayments.aspx'
      : 'https://payments.jazzcash.com.pk/CustomerPortal/transactionpayments.aspx';
  }

  isConfigured(): boolean {
    return !!(
      this.config.merchantId &&
      this.config.password &&
      this.config.integritySalt &&
      this.config.returnUrl
    );
  }
}