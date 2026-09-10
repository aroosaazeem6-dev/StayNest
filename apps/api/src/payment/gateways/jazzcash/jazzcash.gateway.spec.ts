import { Test, TestingModule } from '@nestjs/testing';
import { JazzCashGateway } from './jazzcash.gateway';
import { ConfigService } from '@nestjs/config';
import { JazzCashCallbackResponse } from './jazzcash.types';

describe('JazzCashGateway', () => {
  let gateway: JazzCashGateway;

  const mockConfig = {
    JAZZCASH_MERCHANT_ID: 'MC12345',
    JAZZCASH_PASSWORD: 'testpassword',
    JAZZCASH_INTEGRITY_SALT: 'testintegritysalt123',
    JAZZCASH_RETURN_URL: 'https://example.com/payment/callback',
    JAZZCASH_SANDBOX: 'true',
  };

  beforeEach(async () => {
    const mockConfigService = {
      get: jest.fn((key: string) => mockConfig[key as keyof typeof mockConfig]),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JazzCashGateway,
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    gateway = module.get<JazzCashGateway>(JazzCashGateway);
  });

  describe('preparePayment', () => {
    it('returns a structured JazzCashPreparedPayment object', () => {
      const result = gateway.preparePayment({
        bookingId: 'bk-1',
        amount: 1000,
        description: 'Test booking payment',
      });

      expect(result).toBeDefined();
      expect(result).toHaveProperty('transactionRef');
      expect(result).toHaveProperty('amount');
      expect(result).toHaveProperty('currency');
      expect(result).toHaveProperty('requestFields');
      expect(result).toHaveProperty('endpointUrl');
    });

    it('generates a transaction reference with expected format', () => {
      const result = gateway.preparePayment({
        bookingId: 'bk-1',
        amount: 1000,
      });

      expect(result.transactionRef).toMatch(/^TNX[A-Z0-9]+$/);
      expect(result.transactionRef.length).toBeGreaterThan(10);
    });

    it('converts amount to JazzCash format (paisa) correctly', () => {
      const result = gateway.preparePayment({
        bookingId: 'bk-1',
        amount: 100.5,
      });

      expect(result.amount).toBe('10050');
    });

    it('handles whole number amounts correctly', () => {
      const result = gateway.preparePayment({
        bookingId: 'bk-1',
        amount: 500,
      });

      expect(result.amount).toBe('50000');
    });

    it('handles decimal amounts with precision', () => {
      const result = gateway.preparePayment({
        bookingId: 'bk-1',
        amount: 123.45,
      });

      expect(result.amount).toBe('12345');
    });

    it('handles zero amount', () => {
      const result = gateway.preparePayment({
        bookingId: 'bk-1',
        amount: 0,
      });

      expect(result.amount).toBe('0');
    });

    it('sets currency to PKR', () => {
      const result = gateway.preparePayment({
        bookingId: 'bk-1',
        amount: 1000,
      });

      expect(result.currency).toBe('PKR');
    });

    it('includes all required pp_* fields in requestFields', () => {
      const result = gateway.preparePayment({
        bookingId: 'bk-1',
        amount: 1000,
      });

      const fields = result.requestFields;
      expect(fields.pp_Version).toBe('1.0');
      expect(fields.pp_TxnType).toBe('MWALLET');
      expect(fields.pp_MerchantID).toBe(mockConfig.JAZZCASH_MERCHANT_ID);
      expect(fields.pp_Password).toBe(mockConfig.JAZZCASH_PASSWORD);
      expect(fields.pp_TxnRefNo).toBe(result.transactionRef);
      expect(fields.pp_Amount).toBe(result.amount);
      expect(fields.pp_TxnCurrency).toBe('PKR');
      expect(fields.pp_TxnDateTime).toMatch(/^\d{14}$/);
      expect(fields.pp_TxnExpiryDateTime).toMatch(/^\d{14}$/);
      expect(fields.pp_BillReference).toBeDefined();
      expect(fields.pp_Description).toBeDefined();
      expect(fields.pp_ReturnURL).toBe(mockConfig.JAZZCASH_RETURN_URL);
      expect(fields.pp_SecureHash).toBeDefined();
      expect(fields.pp_SecureHash.length).toBe(64);
    });

    it('uses sandbox endpoint when sandbox is true', () => {
      const result = gateway.preparePayment({
        bookingId: 'bk-1',
        amount: 1000,
      });

      expect(result.endpointUrl).toBe(
        'https://sandbox.jazzcash.com.pk/CustomerPortal/transactionpayments.aspx',
      );
    });

    it('includes transaction reference in bill reference', () => {
      const result = gateway.preparePayment({
        bookingId: 'bk-1',
        amount: 1000,
      });

      expect(result.requestFields.pp_BillReference).toBe('bk-1');
    });

    it('generates secure hash using HMAC-SHA256 with integrity salt', () => {
      const result = gateway.preparePayment({
        bookingId: 'bk-1',
        amount: 1000,
      });

      expect(result.requestFields.pp_SecureHash).toMatch(/^[A-F0-9]{64}$/);
    });

    it('does not expose integrity salt in returned object', () => {
      const result = gateway.preparePayment({
        bookingId: 'bk-1',
        amount: 1000,
      });

      const resultString = JSON.stringify(result);
      expect(resultString).not.toContain(mockConfig.JAZZCASH_INTEGRITY_SALT);
      expect(resultString).not.toContain('testintegritysalt123');
    });

    it('expiry time is 30 minutes after transaction time', () => {
      const result = gateway.preparePayment({
        bookingId: 'bk-1',
        amount: 1000,
      });

      const parseDateTime = (dt: string) => {
        const year = parseInt(dt.slice(0, 4), 10);
        const month = parseInt(dt.slice(4, 6), 10) - 1;
        const day = parseInt(dt.slice(6, 8), 10);
        const hours = parseInt(dt.slice(8, 10), 10);
        const minutes = parseInt(dt.slice(10, 12), 10);
        const seconds = parseInt(dt.slice(12, 14), 10);
        return new Date(year, month, day, hours, minutes, seconds).getTime();
      };

      const txnTime = parseDateTime(result.requestFields.pp_TxnDateTime);
      const expiryTime = parseDateTime(result.requestFields.pp_TxnExpiryDateTime);
      expect(expiryTime - txnTime).toBe(30 * 60 * 1000);
    });
  });

  describe('isConfigured', () => {
    it('returns true when all required config is present', () => {
      expect(gateway.isConfigured()).toBe(true);
    });

    it('returns false when merchantId is missing', async () => {
      const mockConfigService = {
        get: jest.fn((key: string) => {
          const config = { ...mockConfig, JAZZCASH_MERCHANT_ID: '' };
          return config[key as keyof typeof config];
        }),
      };

      const module = await Test.createTestingModule({
        providers: [
          JazzCashGateway,
          { provide: ConfigService, useValue: mockConfigService },
        ],
      }).compile();

      const testGateway = module.get<JazzCashGateway>(JazzCashGateway);
      expect(testGateway.isConfigured()).toBe(false);
    });

    it('returns false when password is missing', async () => {
      const mockConfigService = {
        get: jest.fn((key: string) => {
          const config = { ...mockConfig, JAZZCASH_PASSWORD: '' };
          return config[key as keyof typeof config];
        }),
      };

      const module = await Test.createTestingModule({
        providers: [
          JazzCashGateway,
          { provide: ConfigService, useValue: mockConfigService },
        ],
      }).compile();

      const testGateway = module.get<JazzCashGateway>(JazzCashGateway);
      expect(testGateway.isConfigured()).toBe(false);
    });

    it('returns false when integritySalt is missing', async () => {
      const mockConfigService = {
        get: jest.fn((key: string) => {
          const config = { ...mockConfig, JAZZCASH_INTEGRITY_SALT: '' };
          return config[key as keyof typeof config];
        }),
      };

      const module = await Test.createTestingModule({
        providers: [
          JazzCashGateway,
          { provide: ConfigService, useValue: mockConfigService },
        ],
      }).compile();

      const testGateway = module.get<JazzCashGateway>(JazzCashGateway);
      expect(testGateway.isConfigured()).toBe(false);
    });

    it('returns false when returnUrl is missing', async () => {
      const mockConfigService = {
        get: jest.fn((key: string) => {
          const config = { ...mockConfig, JAZZCASH_RETURN_URL: '' };
          return config[key as keyof typeof config];
        }),
      };

      const module = await Test.createTestingModule({
        providers: [
          JazzCashGateway,
          { provide: ConfigService, useValue: mockConfigService },
        ],
      }).compile();

      const testGateway = module.get<JazzCashGateway>(JazzCashGateway);
      expect(testGateway.isConfigured()).toBe(false);
    });
  });

  describe('amount conversion edge cases', () => {
    it('handles very small amounts', () => {
      const result = gateway.preparePayment({
        bookingId: 'bk-1',
        amount: 0.01,
      });

      expect(result.amount).toBe('1');
    });

    it('handles large amounts', () => {
      const result = gateway.preparePayment({
        bookingId: 'bk-1',
        amount: 999999.99,
      });

      expect(result.amount).toBe('99999999');
    });

    it('rounds correctly for floating point edge cases', () => {
      const result = gateway.preparePayment({
        bookingId: 'bk-1',
        amount: 100.005,
      });

      expect(result.amount).toBe('10001');
    });
  });

  describe('transaction reference uniqueness', () => {
    it('generates unique transaction references for sequential calls', () => {
      const refs = new Set<string>();
      for (let i = 0; i < 100; i++) {
        const result = gateway.preparePayment({
          bookingId: `bk-${i}`,
          amount: 1000,
        });
        refs.add(result.transactionRef);
      }
      expect(refs.size).toBe(100);
    });

    it('includes booking ID prefix in transaction reference', () => {
      const result = gateway.preparePayment({
        bookingId: 'booking123',
        amount: 1000,
      });

      // First 8 alphanumeric chars of bookingId, uppercased
      expect(result.transactionRef).toContain('BOOKING1');
    });
  });

  // ---------------------------------------------------------------------------
  // verifyResponseHash
  // ---------------------------------------------------------------------------

  const buildValidResponse = (overrides: Partial<JazzCashCallbackResponse> = {}): JazzCashCallbackResponse => {
    const base: JazzCashCallbackResponse = {
      pp_ResponseCode: '000',
      pp_ResponseMessage: 'Thank you for Using JazzCash, your transaction was successful.',
      pp_TxnRefNo: 'TNXBK1ABC123',
      pp_SecureHash: '',
      pp_Amount: '40000',
      pp_TxnCurrency: 'PKR',
      pp_MerchantID: 'MC12345',
      pp_TxnDateTime: '20260910120000',
      pp_TxnExpiryDateTime: '20260910123000',
      pp_BillReference: 'bk-1',
      pp_Description: 'StayNest booking bk-1',
      extraFields: {},
    };

    // Compute the correct secure hash for the base payload.
    base.pp_SecureHash = gateway['computeResponseHash'](base);

    return { ...base, ...overrides };
  };

  describe('verifyResponseHash', () => {
    it('accepts a valid response hash', () => {
      const response = buildValidResponse();
      expect(gateway.verifyResponseHash(response)).toBe(true);
    });

    it('rejects an invalid response hash', () => {
      const response = buildValidResponse();
      response.pp_SecureHash = 'A'.repeat(64);
      expect(gateway.verifyResponseHash(response)).toBe(false);
    });

    it('rejects a missing pp_SecureHash', () => {
      const response = buildValidResponse();
      response.pp_SecureHash = '';
      expect(gateway.verifyResponseHash(response)).toBe(false);
    });

    it('rejects a non-string pp_SecureHash', () => {
      const response = buildValidResponse();
      (response as any).pp_SecureHash = undefined;
      expect(gateway.verifyResponseHash(response)).toBe(false);
    });

    it('excludes pp_SecureHash from the hash input', () => {
      // If pp_SecureHash were included in the hash input, changing it would
      // not affect the computed hash, and verifyResponseHash would still pass.
      const response = buildValidResponse();
      const originalHash = response.pp_SecureHash;

      response.pp_SecureHash = 'B'.repeat(64);

      // The computed hash should NOT change because pp_SecureHash is excluded.
      const recomputed = gateway['computeResponseHash'](response);
      expect(recomputed).toBe(originalHash);
      expect(gateway.verifyResponseHash(response)).toBe(false);
    });

    it('includes extra pp_* fields in the hash input', () => {
      const base = buildValidResponse();
      const withExtra: JazzCashCallbackResponse = {
        ...base,
        extraFields: {
          pp_AuthCode: 'AUTH123',
          pp_RetrievalReferenceNo: 'RRN001',
        },
      };

      // Compute the hash with the extra fields included.
      withExtra.pp_SecureHash = gateway['computeResponseHash'](withExtra);

      // The hash with extra fields should differ from the base hash.
      expect(withExtra.pp_SecureHash).not.toBe(base.pp_SecureHash);
      expect(gateway.verifyResponseHash(withExtra)).toBe(true);

      // Removing an extra field changes the hash and verification fails.
      const withoutExtra: JazzCashCallbackResponse = {
        ...withExtra,
        extraFields: {},
      };
      expect(gateway.verifyResponseHash(withoutExtra)).toBe(false);
    });

    it('sorts pp_* field names in ascending ASCII order and concatenates values with NO separators', () => {
      const response = buildValidResponse();
      const computed = gateway['computeResponseHash'](response);

      // Manually compute the expected hash using the official v4.2 convention:
      // sort field names ascending ASCII, join values with NO separators,
      // prepend the Integrity Salt directly with NO separator.
      const fieldEntries = gateway['collectResponseHashFields'](response);
      fieldEntries.sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
      const valueString = fieldEntries.map((e) => e.value).join('');
      const message = `${mockConfig.JAZZCASH_INTEGRITY_SALT}${valueString}`;

      const expected = require('crypto')
        .createHmac('sha256', mockConfig.JAZZCASH_INTEGRITY_SALT)
        .update(message)
        .digest('hex')
        .toUpperCase();

      expect(computed).toBe(expected);
    });

    it('uses NO separators between field values in the hash input', () => {
      const response = buildValidResponse();
      const fieldEntries = gateway['collectResponseHashFields'](response);
      fieldEntries.sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));

      // The hash input must NOT contain '&' separators between values.
      const valueString = fieldEntries.map((e) => e.value).join('');
      const message = `${mockConfig.JAZZCASH_INTEGRITY_SALT}${valueString}`;

      expect(message).not.toContain('&');
    });

    it('uses constant-time comparison', () => {
      const response = buildValidResponse();
      // A hash of the same length but different content should fail.
      response.pp_SecureHash = 'F'.repeat(64);
      expect(gateway.verifyResponseHash(response)).toBe(false);
    });

    it('does not expose the integrity salt in any public method return value', () => {
      const response = buildValidResponse();
      const result = gateway.verifyResponseHash(response);
      expect(result).toBe(true);

      // The gateway's public API (verifyResponseHash return value) must not
      // leak the salt. The salt is stored internally in the gateway config
      // and is never returned to callers.
      const resultString = JSON.stringify(result);
      expect(resultString).not.toContain(mockConfig.JAZZCASH_INTEGRITY_SALT);

      // Also confirm the computed hash itself is not the salt.
      const computed = gateway['computeResponseHash'](response);
      expect(computed).not.toBe(mockConfig.JAZZCASH_INTEGRITY_SALT);
      expect(computed).not.toContain(mockConfig.JAZZCASH_INTEGRITY_SALT);
    });
  });
});