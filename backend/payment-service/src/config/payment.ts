// Payment Gateway Configurations
export const PAYMENT_CONFIG = {
  // Apple Pay Configuration
  APPLE_PAY: {
    MERCHANT_ID: process.env.APPLE_PAY_MERCHANT_ID || 'merchant.com.uthoop.fooddelivery',
    MERCHANT_DOMAIN: process.env.APPLE_PAY_MERCHANT_DOMAIN || 'uth-oop-project.com',
    SUPPORTED_NETWORKS: ['visa', 'masterCard', 'amex'],
    MERCHANT_CAPABILITIES: ['supports3DS'],
    COUNTRY_CODE: 'VN',
    CURRENCY_CODE: 'VND'
  },

  // PayOS Configuration
  PAYOS: {
    CLIENT_ID: process.env.PAYOS_CLIENT_ID || 'test_client_id',
    API_KEY: process.env.PAYOS_API_KEY || 'test_api_key',
    CHECKSUM_KEY: process.env.PAYOS_CHECKSUM_KEY || 'test_checksum_key',
    BASE_URL: process.env.PAYOS_BASE_URL || 'https://api-merchant.payos.vn',
    PARTNER_CODE: process.env.PAYOS_PARTNER_CODE || 'PAYOS_PARTNER',
    WEBHOOK_URL: process.env.PAYOS_WEBHOOK_URL || 'http://localhost:3005/api/payments/webhook/payos'
  },

  // Mock Gateway Configuration (for testing)
  MOCK_GATEWAY: {
    BASE_URL: 'http://localhost:3005/api/payments/mock',
    SUCCESS_RATE: 0.9, // 90% success rate for testing
    PROCESSING_DELAY: 2000, // 2 seconds delay
    WEBHOOK_URL: 'http://localhost:3005/api/payments/webhook/mock'
  },

  // General Configuration
  GENERAL: {
    DEFAULT_CURRENCY: 'VND',
    PAYMENT_TIMEOUT: 15 * 60 * 1000, // 15 minutes
    REFUND_TIMEOUT: 7 * 24 * 60 * 60 * 1000, // 7 days
    FEE_PERCENTAGE: 0.029, // 2.9% transaction fee
    MIN_AMOUNT: 1000, // 1,000 VND minimum
    MAX_AMOUNT: 500000000, // 500,000,000 VND maximum
    SUPPORTED_CURRENCIES: ['VND', 'USD'],
    EXCHANGE_RATES: {
      'USD_TO_VND': 24000,
      'VND_TO_USD': 1/24000
    }
  }
};

// Payment Gateway URLs
export const GATEWAY_URLS = {
  APPLE_PAY: {
    PAYMENT_SESSION: 'https://apple-pay-gateway.com/paymentSession',
    VALIDATE_MERCHANT: 'https://apple-pay-gateway.com/validateMerchant'
  },
  PAYOS: {
    CREATE_PAYMENT: `${PAYMENT_CONFIG.PAYOS.BASE_URL}/v2/payment-requests`,
    GET_PAYMENT: `${PAYMENT_CONFIG.PAYOS.BASE_URL}/v2/payment-requests`,
    CANCEL_PAYMENT: `${PAYMENT_CONFIG.PAYOS.BASE_URL}/v2/payment-requests`,
    CREATE_REFUND: `${PAYMENT_CONFIG.PAYOS.BASE_URL}/v2/payment-requests/refunds`
  }
};

// Error Messages
export const PAYMENT_ERRORS = {
  INVALID_AMOUNT: 'Payment amount is invalid',
  AMOUNT_TOO_LOW: `Amount must be at least ${PAYMENT_CONFIG.GENERAL.MIN_AMOUNT} VND`,
  AMOUNT_TOO_HIGH: `Amount cannot exceed ${PAYMENT_CONFIG.GENERAL.MAX_AMOUNT} VND`,
  UNSUPPORTED_CURRENCY: 'Currency not supported',
  PAYMENT_EXPIRED: 'Payment session has expired',
  GATEWAY_ERROR: 'Payment gateway error',
  INSUFFICIENT_FUNDS: 'Insufficient funds',
  CARD_DECLINED: 'Card was declined',
  INVALID_CARD: 'Invalid card information',
  REFUND_NOT_ALLOWED: 'Refund not allowed',
  REFUND_AMOUNT_EXCEEDED: 'Refund amount exceeds original payment',
  APPLE_PAY_NOT_SUPPORTED: 'Apple Pay not supported on this device',
  PAYOS_ERROR: 'PayOS processing error'
};

// Success Messages
export const PAYMENT_MESSAGES = {
  PAYMENT_CREATED: 'Payment created successfully',
  PAYMENT_COMPLETED: 'Payment completed successfully',
  PAYMENT_CANCELLED: 'Payment cancelled successfully',
  REFUND_INITIATED: 'Refund initiated successfully',
  REFUND_COMPLETED: 'Refund completed successfully',
  WEBHOOK_PROCESSED: 'Webhook processed successfully'
};

export default {
  PAYMENT_CONFIG,
  GATEWAY_URLS,
  PAYMENT_ERRORS,
  PAYMENT_MESSAGES
};