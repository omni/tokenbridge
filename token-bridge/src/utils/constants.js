module.exports = {
  EXTRA_GAS_PERCENTAGE: 1,
  MAX_CONCURRENT_EVENTS: 50,
  RETRY_CONFIG: {
    retries: 20,
    factor: 1.4,
    maxTimeout: 360000,
    randomize: true
  },
  DEFAULT_UPDATE_INTERVAL: 600000,
  EXIT_CODES: {
    GENERAL_ERROR: 1,
    INCOMPATIBILITY: 10,
    MAX_TIME_REACHED: 11
  },
  GAS_PRICE_BOUNDARIES: {
    MIN: 1,
    MAX: 250
  },
  ERC_TYPES: {
    ERC20: 'ERC20',
    ERC677: 'ERC677'
  }
}
