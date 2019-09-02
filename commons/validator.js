require('console.table')
// const path = require('path')
// require('dotenv').config({
//   path: path.join(__dirname, contractsPath, '/deploy/.env')
// })

const commonParameters = [
  {
    name: 'COMMON_HOME_RPC_URL',
    description: 'The home rpc url',
    valuesDescription: 'URL e.g. https://kovan.infura.io/mew',
    valuesCheck: p => typeof p === 'string'
  },
  {
    name: 'COMMON_FOREIGN_RPC_URL',
    description: '',
    valuesDescription: '',
    valuesCheck: p => typeof p === 'string'
  },
  {
    name: 'COMMON_HOME_BRIDGE_ADDRESS',
    description: '',
    valuesDescription: '',
    valuesCheck: p => typeof p === 'string'
  },
  {
    name: 'COMMON_FOREIGN_BRIDGE_ADDRESS',
    description: '',
    valuesDescription: '',
    valuesCheck: p => typeof p === 'string'
  },
  {
    name: 'COMMON_HOME_GAS_PRICE_ORACLE_URL',
    description: '',
    valuesDescription: '',
    valuesCheck: p => typeof p === 'string'
  },
  {
    name: 'COMMON_HOME_GAS_PRICE_SPEED_TYPE',
    description: '',
    valuesDescription: '',
    valuesCheck: p => typeof p === 'string'
  },
  {
    name: 'COMMON_HOME_GAS_PRICE_FALLBACK',
    description: '',
    valuesDescription: '',
    valuesCheck: p => typeof p === 'string'
  },
  {
    name: 'COMMON_HOME_GAS_PRICE_FACTOR',
    description: '',
    valuesDescription: '',
    valuesCheck: p => typeof p === 'string'
  },
  {
    name: 'COMMON_FOREIGN_GAS_PRICE_ORACLE_URL',
    description: '',
    valuesDescription: '',
    valuesCheck: p => typeof p === 'string'
  },
  {
    name: 'COMMON_FOREIGN_GAS_PRICE_SPEED_TYPE',
    description: '',
    valuesDescription: '',
    valuesCheck: p => typeof p === 'string'
  },
  {
    name: 'COMMON_FOREIGN_GAS_PRICE_FALLBACK',
    description: '',
    valuesDescription: '',
    valuesCheck: p => typeof p === 'string'
  },
  {
    name: 'COMMON_FOREIGN_GAS_PRICE_FACTOR',
    description: '',
    valuesDescription: '',
    valuesCheck: p => typeof p === 'string'
  }
]

const oracleParameters = [
  {
    name: 'ORACLE_BRIDGE_MODE',
    description: 'The bridge mode',
    valuesDescription: 'NATIVE_TO_ERC / ERC_TO_ERC / ERC_TO_NATIVE',
    valuesCheck: p => p === 'NATIVE_TO_ERC' || p === 'NATIVE_TO_ERC' || p === 'NATIVE_TO_ERC'
  },
  {
    name: 'ORACLE_ALLOW_HTTP_FOR_RPC',
    description: '',
    valuesDescription: '',
    valuesCheck: p => typeof p === 'string'
  },
  {
    name: 'ORACLE_HOME_RPC_POLLING_INTERVAL',
    description: '',
    valuesDescription: '',
    valuesCheck: p => typeof p === 'string'
  },
  {
    name: 'ORACLE_FOREIGN_RPC_POLLING_INTERVAL',
    description: '',
    valuesDescription: '',
    valuesCheck: p => typeof p === 'string'
  },
  {
    name: 'ORACLE_HOME_GAS_PRICE_UPDATE_INTERVAL',
    description: '',
    valuesDescription: '',
    valuesCheck: p => typeof p === 'string'
  },
  {
    name: 'ORACLE_FOREIGN_GAS_PRICE_UPDATE_INTERVAL',
    description: '',
    valuesDescription: '',
    valuesCheck: p => typeof p === 'string'
  },
  {
    name: 'ORACLE_QUEUE_URL',
    description: '',
    valuesDescription: '',
    valuesCheck: p => typeof p === 'string'
  },
  {
    name: 'ORACLE_REDIS_URL',
    description: '',
    valuesDescription: '',
    valuesCheck: p => typeof p === 'string'
  },
  {
    name: 'ORACLE_HOME_START_BLOCK',
    description: '',
    valuesDescription: '',
    valuesCheck: p => typeof p === 'string'
  },
  {
    name: 'ORACLE_FOREIGN_START_BLOCK',
    description: '',
    valuesDescription: '',
    valuesCheck: p => typeof p === 'string'
  },
  {
    name: 'ORACLE_LOG_LEVEL',
    description: '',
    valuesDescription: '',
    valuesCheck: p => typeof p === 'string'
  },
  {
    name: 'ORACLE_MAX_PROCESSING_TIME',
    description: '',
    valuesDescription: '',
    valuesCheck: p => typeof p === 'string'
  }
]

const uiParameters = [
  {
    name: 'UI_APP_TITLE',
    description: '',
    valuesDescription: '',
    valuesCheck: p => typeof p === 'string'
  },
  {
    name: 'UI_APP_DESCRIPTION',
    description: '',
    valuesDescription: '',
    valuesCheck: p => typeof p === 'string'
  },
  {
    name: 'UI_NATIVE_TOKEN_DISPLAY_NAME',
    description: '',
    valuesDescription: '',
    valuesCheck: p => typeof p === 'string'
  },
  {
    name: 'UI_HOME_NETWORK_DISPLAY_NAME',
    description: '',
    valuesDescription: '',
    valuesCheck: p => typeof p === 'string'
  },
  {
    name: 'UI_FOREIGN_NETWORK_DISPLAY_NAME',
    description: '',
    valuesDescription: '',
    valuesCheck: p => typeof p === 'string'
  },
  {
    name: 'UI_HOME_WITHOUT_EVENTS',
    description: '',
    valuesDescription: '',
    valuesCheck: p => typeof p === 'string'
  },
  {
    name: 'UI_FOREIGN_WITHOUT_EVENTS',
    description: '',
    valuesDescription: '',
    valuesCheck: p => typeof p === 'string'
  },
  {
    name: 'UI_HOME_EXPLORER_TX_TEMPLATE',
    description: '',
    valuesDescription: '',
    valuesCheck: p => typeof p === 'string'
  },
  {
    name: 'UI_FOREIGN_EXPLORER_TX_TEMPLATE',
    description: '',
    valuesDescription: '',
    valuesCheck: p => typeof p === 'string'
  },
  {
    name: 'UI_HOME_EXPLORER_ADDRESS_TEMPLATE',
    description: '',
    valuesDescription: '',
    valuesCheck: p => typeof p === 'string'
  },
  {
    name: 'UI_FOREIGN_EXPLORER_ADDRESS_TEMPLATE',
    description: '',
    valuesDescription: '',
    valuesCheck: p => typeof p === 'string'
  },
  {
    name: 'UI_HOME_GAS_PRICE_UPDATE_INTERVAL',
    description: '',
    valuesDescription: '',
    valuesCheck: p => typeof p === 'string'
  },
  {
    name: 'UI_FOREIGN_GAS_PRICE_UPDATE_INTERVAL',
    description: '',
    valuesDescription: '',
    valuesCheck: p => typeof p === 'string'
  },
  {
    name: 'UI_PORT',
    description: '',
    valuesDescription: '',
    valuesCheck: p => typeof p === 'string'
  },
  {
    name: 'UI_APP_STYLES',
    description: '',
    valuesDescription: '',
    valuesCheck: p => typeof p === 'string'
  }
]

const monitorParameters = [
  {
    name: 'MONITOR_HOME_START_BLOCK',
    description: '',
    valuesDescription: '',
    valuesCheck: p => typeof p === 'string'
  },
  {
    name: 'MONITOR_FOREIGN_START_BLOCK',
    description: '',
    valuesDescription: '',
    valuesCheck: p => typeof p === 'string'
  },
  {
    name: 'MONITOR_VALIDATOR_HOME_TX_LIMIT',
    description: '',
    valuesDescription: '',
    valuesCheck: p => typeof p === 'string'
  },
  {
    name: 'MONITOR_VALIDATOR_FOREIGN_TX_LIMIT',
    description: '',
    valuesDescription: '',
    valuesCheck: p => typeof p === 'string'
  },
  {
    name: 'MONITOR_TX_NUMBER_THRESHOLD',
    description: '',
    valuesDescription: '',
    valuesCheck: p => typeof p === 'string'
  },
  {
    name: 'MONITOR_PORT',
    description: '',
    valuesDescription: '',
    valuesCheck: p => typeof p === 'string'
  }
]

const description = () => {
  console.log('\nCommon parameters:\n')
  console.table(commonParameters.map(p => ({ name: p.name, description: p.description })))

  console.log('\nOracle parameters:\n')
  console.table(oracleParameters.map(p => ({ name: p.name, description: p.description })))
}

const check = parameters => {
  const validationErrors = []
  parameters.forEach(p => {
    const value = process.env[p.name]
    if (!p.valuesCheck(value)) {
      validationErrors.push({ name: p.name, expected: p.valuesDescription, value })
    }
  })
  return validationErrors
}

if (process.env.MODE === 'VALIDATE_ORACLE') {
  console.log('\nValidating Oracle parameters...\n')
  const validationErrors = [...check(commonParameters), ...check(oracleParameters)]
  console.table(validationErrors)
  if (validationErrors.length > 0) {
    process.exit(-1)
  }
} else if (process.env.MODE === 'VALIDATE_UI') {
  console.log('this is validate ui')
} else if (process.env.MODE === 'VALIDATE_MONITOR') {
  console.log('this is validate monitor')
} else if (process.env.MODE === 'PRINT') {
  console.log('Not implemented')
  process.exit(-1)
} else {
  description()
}
