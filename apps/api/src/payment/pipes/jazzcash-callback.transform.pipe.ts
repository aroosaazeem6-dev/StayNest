import { PipeTransform, Injectable, ArgumentMetadata, BadRequestException } from '@nestjs/common';
import { JazzCashCallbackResponse } from '../gateways/jazzcash/jazzcash.types';

/**
 * Known JazzCash callback fields that map directly to the interface.
 */
const KNOWN_CALLBACK_FIELDS: readonly string[] = [
  'pp_ResponseCode',
  'pp_ResponseMessage',
  'pp_TxnRefNo',
  'pp_SecureHash',
  'pp_Amount',
  'pp_TxnCurrency',
  'pp_MerchantID',
  'pp_TxnDateTime',
  'pp_TxnExpiryDateTime',
  'pp_BillReference',
  'pp_Description',
];

/**
 * Transform pipe for the JazzCash callback endpoint.
 *
 * The global ValidationPipe runs with `forbidNonWhitelisted: true`, which
 * would reject any pp_* field not declared on the DTO. This pipe:
 *   - extracts the known callback fields,
 *   - captures any additional pp_* fields into `extraFields` so the
 *     secure-hash verification covers the complete set,
 *   - rejects non-pp_* fields that are not part of the known set.
 */
@Injectable()
export class JazzCashCallbackTransformPipe implements PipeTransform {
  transform(value: any, _metadata: ArgumentMetadata): JazzCashCallbackResponse {
    if (!value || typeof value !== 'object') {
      throw new BadRequestException('Invalid JazzCash callback payload');
    }

    const response: JazzCashCallbackResponse = {
      pp_ResponseCode: value.pp_ResponseCode,
      pp_ResponseMessage: value.pp_ResponseMessage,
      pp_TxnRefNo: value.pp_TxnRefNo,
      pp_SecureHash: value.pp_SecureHash,
      pp_Amount: value.pp_Amount,
      pp_TxnCurrency: value.pp_TxnCurrency,
      pp_MerchantID: value.pp_MerchantID,
      pp_TxnDateTime: value.pp_TxnDateTime,
      pp_TxnExpiryDateTime: value.pp_TxnExpiryDateTime,
      pp_BillReference: value.pp_BillReference,
      pp_Description: value.pp_Description,
      extraFields: {},
    };

    for (const [key, val] of Object.entries(value)) {
      if (typeof key !== 'string') {
        continue;
      }

      if (KNOWN_CALLBACK_FIELDS.includes(key)) {
        continue;
      }

      if (!key.startsWith('pp_')) {
        // Reject non-pp_ fields that are not part of the known callback set.
        throw new BadRequestException(`Unexpected field in JazzCash callback: ${key}`);
      }

      if (key === 'pp_SecureHash') {
        continue;
      }

      response.extraFields[key] = String(val);
    }

    return response;
  }
}