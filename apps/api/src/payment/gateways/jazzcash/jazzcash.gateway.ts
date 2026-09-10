import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import {
  JazzCashConfig,
  JazzCashPaymentRequest,
  JazzCashPreparedPayment,
  JazzCashGatewayOptions,
  JazzCashCallbackResponse,
} from './jazzcash.types';

/**
 * The official JazzCash HMAC-SHA256 secure-hash convention:
 *
 * 1. Collect every pp_* field present in the payload.
 * 2. Exclude pp_SecureHash itself from the hash input.
 * 3. Sort the remaining field names in ascending ASCII order.
 * 4. Concatenate their values with '&' between each value.
 * 5. Prepend the Integrity Salt (Shared Secret) to the front of that
 *    concatenated string.
 * 6. HMAC-SHA256 the resulting string using the Integrity Salt as the key.
 * 7. Compare the computed hex digest (uppercased) against the received
 *    pp_SecureHash using a constant-time comparison.
 *
 * This is the response-side verification and is independent of the
 * request-side hash ordering used in `buildHashString`.
 */
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

  convertAmountToJazzCashFormat(amount: number): string {
    const amountInPaisa = Math.round(amount * 100);
    return amountInPaisa.toString();
  }

  /**
   * Public accessor for the configured merchant ID, used by PaymentService
   * to validate callback merchant ID without exposing the full config.
   */
  get merchantId(): string {
    return this.config.merchantId;
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

  /**
   * Verifies the secure hash of a JazzCash callback response.
   *
   * This is the ONLY trust gate before any payment/booking state is mutated.
   * Returns false when:
   * - the integrity salt is not configured
   * - the response is missing a pp_SecureHash
   * - the received hash does not match the recomputed HMAC-SHA256
   *
   * The Integrity Salt is never exposed to callers.
   */
  verifyResponseHash(response: JazzCashCallbackResponse): boolean {
    if (!this.config.integritySalt) {
      return false;
    }

    const receivedHash = response.pp_SecureHash;
    if (!receivedHash || typeof receivedHash !== 'string') {
      return false;
    }

    const computedHash = this.computeResponseHash(response);
    if (!computedHash) {
      return false;
    }

    return this.constantTimeEquals(receivedHash.toUpperCase(), computedHash);
  }

  /**
   * Computes the expected secure hash for a JazzCash response payload
   * following the official JazzCash v4.2 HMAC-SHA256 convention:
   *
   *   1. Collect every pp_* field present in the payload.
   *   2. Exclude pp_SecureHash itself from the hash input.
   *   3. Sort the remaining field names in ascending ASCII order.
   *   4. Concatenate their VALUES with NO separators.
   *   5. Prepend the Integrity Salt directly to the concatenated value
   *      string, also with NO separator.
   *   6. HMAC-SHA256 the resulting string using the Integrity Salt as the key.
   *   7. Hex encode the result.
   *
   * This is the response-side verification and is independent of the
   * request-side hash ordering used in `buildHashString`.
   */
  private computeResponseHash(response: JazzCashCallbackResponse): string {
    const fieldEntries = this.collectResponseHashFields(response);
    if (fieldEntries.length === 0) {
      return '';
    }

    // Sort field names in ascending ASCII order.
    fieldEntries.sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));

    // Concatenate field VALUES with NO separators, then prepend the
    // Integrity Salt directly with NO separator.
    const valueString = fieldEntries.map((entry) => entry.value).join('');
    const message = `${this.config.integritySalt}${valueString}`;

    const hmac = crypto.createHmac('sha256', this.config.integritySalt);
    hmac.update(message);
    return hmac.digest('hex').toUpperCase();
  }

  /**
   * Collects every pp_* field from the response payload, excluding
   * pp_SecureHash itself, so the hash input covers the complete set of
   * transaction fields returned by JazzCash.
   */
  private collectResponseHashFields(
    response: JazzCashCallbackResponse,
  ): { name: string; value: string }[] {
    const fields: { name: string; value: string }[] = [];

    const known: Record<string, string> = {
      pp_ResponseCode: response.pp_ResponseCode,
      pp_ResponseMessage: response.pp_ResponseMessage,
      pp_TxnRefNo: response.pp_TxnRefNo,
      pp_Amount: response.pp_Amount,
      pp_TxnCurrency: response.pp_TxnCurrency,
      pp_MerchantID: response.pp_MerchantID,
      pp_TxnDateTime: response.pp_TxnDateTime,
      pp_TxnExpiryDateTime: response.pp_TxnExpiryDateTime,
      pp_BillReference: response.pp_BillReference,
      pp_Description: response.pp_Description,
    };

    for (const [name, value] of Object.entries(known)) {
      if (value === undefined || value === null) {
        continue;
      }
      fields.push({ name, value: String(value) });
    }

    for (const [name, value] of Object.entries(response.extraFields ?? {})) {
      if (!name.startsWith('pp_') || name === 'pp_SecureHash') {
        continue;
      }
      if (value === undefined || value === null) {
        continue;
      }
      fields.push({ name, value: String(value) });
    }

    return fields;
  }

  /**
   * Constant-time string comparison to prevent timing attacks when
   * comparing the computed hash against the received hash.
   */
  private constantTimeEquals(a: string, b: string): boolean {
    const bufA = Buffer.from(a, 'utf-8');
    const bufB = Buffer.from(b, 'utf-8');

    if (bufA.length !== bufB.length) {
      return false;
    }

    return crypto.timingSafeEqual(bufA, bufB);
  }
}