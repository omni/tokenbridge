require('console.table')
const shell = require('shelljs')
// const path = require('path')
// require('dotenv').config({
//   path: path.join(__dirname, contractsPath, '/deploy/.env')
// })

const commonParameters = [
  {
    name: 'COMMON_HOME_RPC_URL',
    description:
      'The HTTPS URL(s) used to communicate to the RPC nodes in the Home network. Several URLs can be specified, delimited by spaces. If the connection to one of these nodes is lost the next URL is used for connection.',
    valuesDescription: 'URL(s)',
    valuesCheck: p => typeof p === 'string'
  },
  {
    name: 'COMMON_FOREIGN_RPC_URL',
    description:
      'The HTTPS URL(s) used to communicate to the RPC nodes in the Foreign network. Several URLs can be specified, delimited by spaces. If the connection to one of these nodes is lost the next URL is used for connection.',
    valuesDescription: 'URL(s)',
    valuesCheck: p => typeof p === 'string'
  },
  {
    name: 'COMMON_HOME_BRIDGE_ADDRESS',
    description:
      "The address of the bridge contract address in the Home network. It is used to listen to events from and send validators' transactions to the Home network.",
    valuesDescription: 'hexidecimal beginning with "0x"',
    valuesCheck: p => typeof p === 'string'
  },
  {
    name: 'COMMON_FOREIGN_BRIDGE_ADDRESS',
    description:
      "The  address of the bridge contract address in the Foreign network. It is used to listen to events from and send validators' transactions to the Foreign network.",
    valuesDescription: 'hexidecimal beginning with "0x"',
    valuesCheck: p => typeof p === 'string'
  },
  {
    name: 'COMMON_HOME_GAS_PRICE_SUPPLIER_URL',
    description:
      "The URL used to get a JSON response from the gas price prediction oracle for the Home network. The gas price provided by the oracle is used to send the validator's transactions to the RPC node. Since it is assumed that the Home network has a predefined gas price (e.g. the gas price in the Core of POA.Network is `1 GWei`), the gas price oracle parameter can be omitted for such networks.",
    valuesDescription: 'URL',
    valuesCheck: p => typeof p === 'string'
  },
  {
    name: 'COMMON_HOME_GAS_PRICE_SPEED_TYPE',
    description:
      'Assuming the gas price oracle responds with the following JSON structure: `{"fast": 20.0, "block_time": 12.834, "health": true, "standard": 6.0, "block_number": 6470469, "instant": 71.0, "slow": 1.889}`, this parameter specifies the desirable transaction speed. The speed type can be omitted when `COMMON_HOME_GAS_PRICE_SUPPLIER_URL` is not used.',
    valuesDescription: '`instant` / `fast` / `standard` / `slow`',
    valuesCheck: p => typeof p === 'string'
  },
  {
    name: 'COMMON_HOME_GAS_PRICE_FALLBACK',
    description:
      'The gas price (in Wei) that is used if both the oracle and the fall back gas price specified in the Home Bridge contract are not available.',
    valuesDescription: 'integer',
    valuesCheck: p => typeof p === 'string'
  },
  {
    name: 'COMMON_HOME_GAS_PRICE_FACTOR',
    description:
      'A value that will multiply the gas price of the oracle to convert it to gwei. If the oracle API returns gas prices in gwei then this can be set to `1`. Also, it could be used to intentionally pay more gas than suggested by the oracle to guarantee the transaction verification. E.g. `1.25` or `1.5`.',
    valuesDescription: 'integer',
    valuesCheck: p => typeof p === 'string'
  },
  {
    name: 'COMMON_FOREIGN_GAS_PRICE_SUPPLIER_URL',
    description:
      "The URL used to get a JSON response from the gas price prediction oracle for the Foreign network. The provided gas price is used to send the validator's transactions to the RPC node. If the Foreign network is Ethereum Foundation mainnet, the oracle URL can be: https://gasprice.poa.network. Otherwise this parameter can be omitted.",
    valuesDescription: 'URL',
    valuesCheck: p => typeof p === 'string'
  },
  {
    name: 'COMMON_FOREIGN_GAS_PRICE_SPEED_TYPE',
    description:
      'Assuming the gas price oracle responds with the following JSON structure: `{"fast": 20.0, "block_time": 12.834, "health": true, "standard": 6.0, "block_number": 6470469, "instant": 71.0, "slow": 1.889}`, this parameter specifies the desirable transaction speed. The speed type can be omitted when `COMMON_FOREIGN_GAS_PRICE_SUPPLIER_URL`is not used.',
    valuesDescription: '`instant` / `fast` / `standard` / `slow`',
    valuesCheck: p => typeof p === 'string'
  },
  {
    name: 'COMMON_FOREIGN_GAS_PRICE_FALLBACK',
    description:
      'The gas price (in Wei) used if both the oracle and fall back gas price specified in the Foreign Bridge contract are not available.',
    valuesDescription: 'integer',
    valuesCheck: p => typeof p === 'string'
  },
  {
    name: 'COMMON_FOREIGN_GAS_PRICE_FACTOR',
    description:
      'A value that will multiply the gas price of the oracle to convert it to gwei. If the oracle API returns gas prices in gwei then this can be set to `1`. Also, it could be used to intentionally pay more gas than suggested by the oracle to guarantee the transaction verification. E.g. `1.25` or `1.5`.',
    valuesDescription: 'integer',
    valuesCheck: p => typeof p === 'string'
  }
]

const oracleParameters = [
  {
    name: 'ORACLE_BRIDGE_MODE',
    description: 'The bridge mode. The bridge starts listening to a different set of events based on this parameter.',
    valuesDescription: 'NATIVE_TO_ERC / ERC_TO_ERC / ERC_TO_NATIVE',
    valuesCheck: p => p === 'NATIVE_TO_ERC' || p === 'NATIVE_TO_ERC' || p === 'NATIVE_TO_ERC'
  },
  {
    name: 'ORACLE_ALLOW_HTTP_FOR_RPC',
    description:
      '**Only use in test environments - must be omitted in production environments.**. If this parameter is specified and set to `yes`, RPC URLs can be specified in form of HTTP links. A warning that the connection is insecure will be written to the logs.',
    valuesDescription: '`yes` / `no`',
    valuesCheck: p => typeof p === 'string'
  },
  {
    name: 'ORACLE_HOME_RPC_POLLING_INTERVAL',
    description:
      'The interval in milliseconds used to request the RPC node in the Home network for new blocks. The interval should match the average production time for a new block.',
    valuesDescription: 'integer',
    valuesCheck: p => typeof p === 'string'
  },
  {
    name: 'ORACLE_FOREIGN_RPC_POLLING_INTERVAL',
    description:
      'The interval in milliseconds used to request the RPC node in the Foreign network for new blocks. The interval should match the average production time for a new block.',
    valuesDescription: 'integer',
    valuesCheck: p => typeof p === 'string'
  },
  {
    name: 'ORACLE_HOME_GAS_PRICE_UPDATE_INTERVAL',
    description:
      'An interval in milliseconds used to get the updated gas price value either from the oracle or from the Home Bridge contract.',
    valuesDescription: 'integer',
    valuesCheck: p => typeof p === 'string'
  },
  {
    name: 'ORACLE_FOREIGN_GAS_PRICE_UPDATE_INTERVAL',
    description:
      'The interval in milliseconds used to get the updated gas price value either from the oracle or from the Foreign Bridge contract.',
    valuesDescription: 'integer',
    valuesCheck: p => typeof p === 'string'
  },
  {
    name: 'ORACLE_QUEUE_URL',
    description:
      'RabbitMQ URL used by watchers and senders to communicate to the message queue. Typically set to: `amqp://127.0.0.1`.',
    valuesDescription: 'local URL',
    valuesCheck: p => typeof p === 'string'
  },
  {
    name: 'ORACLE_REDIS_URL',
    description:
      'Redis DB URL used by watchers and senders to communicate to the database. Typically set to: `redis://127.0.0.1:6379`.',
    valuesDescription: 'local URL',
    valuesCheck: p => typeof p === 'string'
  },
  {
    name: 'ORACLE_HOME_START_BLOCK',
    description:
      'The block number in the Home network used to start watching for events when the bridge instance is run for the first time. Usually this is the same block where the Home Bridge contract is deployed. If a new validator instance is being deployed for an existing set of validators, the block number could be the latest block in the chain.',
    valuesDescription: 'integer',
    valuesCheck: p => typeof p === 'string'
  },
  {
    name: 'ORACLE_FOREIGN_START_BLOCK',
    description:
      'The block number in the Foreign network used to start watching for events when the bridge instance runs for the first time. Usually this is the same block where the Foreign Bridge contract was deployed to. If a new validator instance is being deployed for an existing set of validators, the block number could be the latest block in the chain.',
    valuesDescription: 'integer',
    valuesCheck: p => typeof p === 'string'
  },
  {
    name: 'ORACLE_LOG_LEVEL',
    description: 'Set the level of details in the logs.',
    valuesDescription: '`trace` / `debug` / `info` / `warn` / `error` / `fatal`',
    valuesCheck: p => typeof p === 'string'
  },
  {
    name: 'ORACLE_MAX_PROCESSING_TIME',
    description:
      'The workers processes will be killed if this amount of time (in milliseconds) is elapsed before they finish processing. It is recommended to set this value to 4 times the value of the longest polling time (set with the `HOME_POLLING_INTERVAL` and `FOREIGN_POLLING_INTERVAL` variables). To disable this, set the time to 0.',
    valuesDescription: 'integer',
    valuesCheck: p => typeof p === 'string'
  },
  {
    name: 'ORACLE_VALIDATOR_ADDRESS_PRIVATE_KEY',
    description:
      'The private key of the bridge validator used to sign confirmations before sending transactions to the bridge contracts. The validator account is calculated automatically from the private key. Every bridge instance (set of watchers and senders) must have its own unique private key. The specified private key is used to sign transactions on both sides of the bridge.',
    valuesDescription: 'hexidecimal without "0x"',
    valuesCheck: p => typeof p === 'string'
  },
  {
    name: 'ORACLE_VALIDATOR_ADDRESS',
    description: '',
    valuesDescription: 'hexidecimal with "0x"',
    valuesCheck: p => typeof p === 'string'
  }
]

// const oracleTestParameters = [
//   {
//     name: 'FOREIGN_MIN_AMOUNT_PER_TX',
//     description: '',
//     valuesDescription: '',
//     valuesCheck: p => typeof p === 'string'
//   }
// ]

const uiParameters = [
  {
    name: 'UI_APP_TITLE',
    description: 'The title for the bridge UI page. `%c` will be replaced by the name of the network.',
    valuesDescription: '',
    valuesCheck: p => typeof p === 'string'
  },
  {
    name: 'UI_APP_DESCRIPTION',
    description: 'The meta description for the deployed bridge page.',
    valuesDescription: '',
    valuesCheck: p => typeof p === 'string'
  },
  {
    name: 'UI_NATIVE_TOKEN_DISPLAY_NAME',
    description: 'name of the home native coin',
    valuesDescription: '',
    valuesCheck: p => typeof p === 'string'
  },
  {
    name: 'UI_HOME_NETWORK_DISPLAY_NAME',
    description: 'name to be displayed for home network',
    valuesDescription: '',
    valuesCheck: p => typeof p === 'string'
  },
  {
    name: 'UI_FOREIGN_NETWORK_DISPLAY_NAME',
    description: 'name to be displayed for foreign network',
    valuesDescription: '',
    valuesCheck: p => typeof p === 'string'
  },
  {
    name: 'UI_HOME_WITHOUT_EVENTS',
    description: "`true` if home network doesn't support events",
    valuesDescription: '',
    valuesCheck: p => typeof p === 'string'
  },
  {
    name: 'UI_FOREIGN_WITHOUT_EVENTS',
    description: "`true` if foreign network doesn't support events",
    valuesDescription: '',
    valuesCheck: p => typeof p === 'string'
  },
  {
    name: 'UI_HOME_EXPLORER_TX_TEMPLATE',
    description: 'template link to transaction on home explorer. `%s` will be replaced by transaction hash',
    valuesDescription: '',
    valuesCheck: p => typeof p === 'string'
  },
  {
    name: 'UI_FOREIGN_EXPLORER_TX_TEMPLATE',
    description: 'template link to transaction on foreign explorer. `%s` will be replaced by transaction hash',
    valuesDescription: '',
    valuesCheck: p => typeof p === 'string'
  },
  {
    name: 'UI_HOME_EXPLORER_ADDRESS_TEMPLATE',
    description: 'template link to address on home explorer. `%s` will be replaced by address',
    valuesDescription: '',
    valuesCheck: p => typeof p === 'string'
  },
  {
    name: 'UI_FOREIGN_EXPLORER_ADDRESS_TEMPLATE',
    description: 'template link to address on foreign explorer. `%s` will be replaced by address',
    valuesDescription: '',
    valuesCheck: p => typeof p === 'string'
  },
  {
    name: 'UI_HOME_GAS_PRICE_UPDATE_INTERVAL',
    description:
      'An interval in milliseconds used to get the updated gas price value either from the oracle or from the Home Bridge contract.',
    valuesDescription: '',
    valuesCheck: p => typeof p === 'string'
  },
  {
    name: 'UI_FOREIGN_GAS_PRICE_UPDATE_INTERVAL',
    description:
      'An interval in milliseconds used to get the updated gas price value either from the oracle or from the Foreign Bridge contract.',
    valuesDescription: '',
    valuesCheck: p => typeof p === 'string'
  },
  {
    name: 'UI_PORT',
    description: 'The port for the UI app.',
    valuesDescription: '',
    valuesCheck: p => typeof p === 'string'
  },
  {
    name: 'UI_APP_STYLES',
    description: 'The set of styles to render the bridge UI page. Currently only `classic` is implemented',
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

  console.log('\nOracle specific parameters:\n')
  console.table(oracleParameters.map(p => ({ name: p.name, description: p.description })))

  console.log('\nUI specific parameters:\n')
  console.table(uiParameters.map(p => ({ name: p.name, description: p.description })))

  console.log('\nMonitor specific parameters:\n')
  console.table(monitorParameters.map(p => ({ name: p.name, description: p.description })))
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

const print = () => {
  shell.exec('echo "<!-- This file is auto-generated, please do not modify. -->\n" > ../CONFIGURATION.md')
  shell.exec('echo "# Configuration\n" >> ../CONFIGURATION.md')

  shell.exec('echo "## Oracle configuration\n" >> ../CONFIGURATION.md')
  shell.exec('echo "name | description | value" >> ../CONFIGURATION.md')
  shell.exec('echo "--- | --- | ---" >> ../CONFIGURATION.md')
  oracleParameters.forEach(p =>
    shell.exec(`echo "${p.name} | ${p.description} | ${p.valuesDescription}" >> ../CONFIGURATION.md`)
  )

  shell.exec('echo "\n## UI configuration\n" >> ../CONFIGURATION.md')
  shell.exec('echo "name | description | value" >> ../CONFIGURATION.md')
  shell.exec('echo "--- | --- | ---" >> ../CONFIGURATION.md')
  uiParameters.forEach(p =>
    shell.exec(`echo "${p.name} | ${p.description} | ${p.valuesDescription}" >> ../CONFIGURATION.md`)
  )

  shell.exec('echo "\n## Monitor configuration\n" >> ../CONFIGURATION.md')
  shell.exec('echo "name | description | value" >> ../CONFIGURATION.md')
  shell.exec('echo "--- | --- | ---" >> ../CONFIGURATION.md')
  monitorParameters.forEach(p =>
    shell.exec(`echo "${p.name} | ${p.description} | ${p.valuesDescription}" >> ../CONFIGURATION.md`)
  )
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
  print()
} else {
  description()
}
