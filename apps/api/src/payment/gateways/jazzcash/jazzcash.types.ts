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