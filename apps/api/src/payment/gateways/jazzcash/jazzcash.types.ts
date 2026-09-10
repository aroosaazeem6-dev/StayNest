export interface JazzCashConfig {
  merchantId: string;
  password: string;
  integritySalt: string;
  returnUrl: string;
  sandbox: boolean;
}

export interface JazzCashPaymentRequest {
  pp_Version: string;
  pp_TxnType: string;
  pp_MerchantID: string;
  pp_Password: string;
  pp_TxnRefNo: string;
  pp_Amount: string;
  pp_TxnCurrency: string;
  pp_TxnDateTime: string;
  pp_TxnExpiryDateTime: string;
  pp_BillReference: string;
  pp_Description: string;
  pp_ReturnURL: string;
  pp_SecureHash: string;
}

export interface JazzCashPreparedPayment {
  transactionRef: string;
  amount: string;
  currency: string;
  requestFields: JazzCashPaymentRequest;
  endpointUrl: string;
}

export interface JazzCashGatewayOptions {
  bookingId: string;
  amount: number;
  description?: string;
}

/**
 * JazzCash callback (return URL) response payload.
 *
 * JazzCash posts transaction results to the configured pp_ReturnURL.
 * The callback includes all pp_* fields returned by the gateway plus
 * pp_ResponseCode / pp_ResponseMessage.
 *
 * Additional pp_* fields not listed explicitly are stored in `extraFields`
 * so the secure-hash can be recomputed over the complete set.
 */
export interface JazzCashCallbackResponse {
  pp_ResponseCode: string;
  pp_ResponseMessage: string;
  pp_TxnRefNo: string;
  pp_SecureHash: string;
  pp_Amount: string;
  pp_TxnCurrency: string;
  pp_MerchantID: string;
  pp_TxnDateTime: string;
  pp_TxnExpiryDateTime: string;
  pp_BillReference: string;
  pp_Description: string;
  /** Any additional pp_* fields returned by JazzCash. */
  extraFields: Record<string, string>;
}