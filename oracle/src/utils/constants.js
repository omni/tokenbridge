module.exports = {
  EXTRA_GAS_PERCENTAGE: 4,
  EXTRA_GAS_ABSOLUTE: 200000,
  AMB_AFFIRMATION_REQUEST_EXTRA_GAS_ESTIMATOR: len => Math.floor(0.0035 * len ** 2 + 40 * len),
  MIN_AMB_HEADER_LENGTH: 32 + 20 + 20 + 4 + 2 + 1 + 2,
  MAX_GAS_LIMIT: 10000000,
  MAX_CONCURRENT_EVENTS: 50,
  RETRY_CONFIG: {
    retries: 20,
    factor: 1.4,
    maxTimeout: 360000,
    randomize: true
  },
  DEFAULT_UPDATE_INTERVAL: 600000,
  DEFAULT_GAS_PRICE_FACTOR: 1,
  EXIT_CODES: {
    GENERAL_ERROR: 1,
    WATCHER_NOT_REQUIRED: 0,
    INCOMPATIBILITY: 10,
    MAX_TIME_REACHED: 11
  },
  GAS_PRICE_BOUNDARIES: {
    MIN: 1,
    MAX: 1000
  },
  FALLBACK_GAS_ESTIMATE: 600000,
  TRANSACTION_RESEND_TIMEOUT: 20 * 60 * 1000,
  FALLBACK_RPC_URL_SWITCH_TIMEOUT: 60 * 60 * 1000,
  SENDER_QUEUE_MAX_PRIORITY: 10,
  SENDER_QUEUE_SEND_PRIORITY: 5,
  SENDER_QUEUE_CHECK_STATUS_PRIORITY: 1
}
