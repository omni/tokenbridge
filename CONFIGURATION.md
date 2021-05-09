# Configuration

## Common configuration

name | description | value
--- | --- | ---
COMMON_HOME_RPC_URL | The HTTPS URL(s) used to communicate to the RPC nodes in the Home network. Several URLs can be specified, delimited by spaces. If the connection to one of these nodes is lost the next URL is used for connection. | URL(s)
COMMON_FOREIGN_RPC_URL | The HTTPS URL(s) used to communicate to the RPC nodes in the Foreign network. Several URLs can be specified, delimited by spaces. If the connection to one of these nodes is lost the next URL is used for connection. | URL(s)
COMMON_HOME_BRIDGE_ADDRESS | The address of the bridge contract address in the Home network. It is used to listen to events from and send validators' transactions to the Home network. | hexidecimal beginning with "0x"
COMMON_FOREIGN_BRIDGE_ADDRESS | The  address of the bridge contract address in the Foreign network. It is used to listen to events from and send validators' transactions to the Foreign network. | hexidecimal beginning with "0x"
COMMON_HOME_GAS_PRICE_SUPPLIER_URL | The URL used to get a JSON response from the gas price prediction oracle for the Home network. The gas price provided by the oracle is used to send the validator's transactions to the RPC node. Since it is assumed that the Home network has a predefined gas price (e.g. the gas price in the Core of POA.Network is `1 GWei`), the gas price oracle parameter can be omitted for such networks. | URL
COMMON_HOME_GAS_PRICE_SPEED_TYPE | Assuming the gas price oracle responds with the following JSON structure: `{"fast": 20.0, "block_time": 12.834, "health": true, "standard": 6.0, "block_number": 6470469, "instant": 71.0, "slow": 1.889}`, this parameter specifies the desirable transaction speed. The speed type can be omitted when `COMMON_HOME_GAS_PRICE_SUPPLIER_URL` is not used. | `instant` / `fast` / `standard` / `slow`
COMMON_HOME_GAS_PRICE_FALLBACK | The gas price (in Wei) that is used if both the oracle and the fall back gas price specified in the Home Bridge contract are not available. | integer
COMMON_HOME_GAS_PRICE_FACTOR | A value that will multiply the gas price of the oracle to convert it to gwei. If the oracle API returns gas prices in gwei then this can be set to `1`. Also, it could be used to intentionally pay more gas than suggested by the oracle to guarantee the transaction verification. E.g. `1.25` or `1.5`. | integer
COMMON_FOREIGN_GAS_PRICE_SUPPLIER_URL | The URL used to get a JSON response from the gas price prediction oracle for the Foreign network. The provided gas price is used to send the validator's transactions to the RPC node. If the Foreign network is Ethereum Foundation mainnet, the oracle URL can be: https://gasprice.poa.network. Otherwise this parameter can be omitted. Set to `gas-price-oracle` if you want to use npm `gas-price-oracle` package for retrieving gas price from multiple sources. | URL
COMMON_FOREIGN_GAS_PRICE_SPEED_TYPE | Assuming the gas price oracle responds with the following JSON structure: `{"fast": 20.0, "block_time": 12.834, "health": true, "standard": 6.0, "block_number": 6470469, "instant": 71.0, "slow": 1.889}`, this parameter specifies the desirable transaction speed. The speed type can be omitted when `COMMON_FOREIGN_GAS_PRICE_SUPPLIER_URL`is not used. | `instant` / `fast` / `standard` / `slow`
COMMON_FOREIGN_GAS_PRICE_FALLBACK | The gas price (in Wei) used if both the oracle and fall back gas price specified in the Foreign Bridge contract are not available. | integer
COMMON_FOREIGN_GAS_PRICE_FACTOR | A value that will multiply the gas price of the oracle to convert it to gwei. If the oracle API returns gas prices in gwei then this can be set to `1`. Also, it could be used to intentionally pay more gas than suggested by the oracle to guarantee the transaction verification. E.g. `1.25` or `1.5`. | integer


## Oracle configuration

name | description | value
--- | --- | ---
ORACLE_BRIDGE_MODE | The bridge mode. The bridge starts listening to a different set of events based on this parameter. | ERC_TO_NATIVE / ARBITRARY_MESSAGE
ORACLE_ALLOW_HTTP_FOR_RPC | **Only use in test environments - must be omitted in production environments.**. If this parameter is specified and set to `yes`, RPC URLs can be specified in form of HTTP links. A warning that the connection is insecure will be written to the logs. | `yes` / `no`
ORACLE_HOME_RPC_POLLING_INTERVAL | The interval in milliseconds used to request the RPC node in the Home network for new blocks. The interval should match the average production time for a new block. | integer
ORACLE_FOREIGN_RPC_POLLING_INTERVAL | The interval in milliseconds used to request the RPC node in the Foreign network for new blocks. The interval should match the average production time for a new block. | integer
ORACLE_HOME_GAS_PRICE_UPDATE_INTERVAL | An interval in milliseconds used to get the updated gas price value either from the oracle or from the Home Bridge contract. | integer
ORACLE_FOREIGN_GAS_PRICE_UPDATE_INTERVAL | The interval in milliseconds used to get the updated gas price value either from the oracle or from the Foreign Bridge contract. | integer
ORACLE_QUEUE_URL | RabbitMQ URL used by watchers and senders to communicate to the message queue. Typically set to: `amqp://127.0.0.1`. | local URL
ORACLE_REDIS_URL | Redis DB URL used by watchers and senders to communicate to the database. Typically set to: `redis://127.0.0.1:6379`. | local URL
ORACLE_HOME_START_BLOCK | The block number in the Home network used to start watching for events when the bridge instance is run for the first time. Usually this is the same block where the Home Bridge contract is deployed. If a new validator instance is being deployed for an existing set of validators, the block number could be the latest block in the chain. | integer
ORACLE_FOREIGN_START_BLOCK | The block number in the Foreign network used to start watching for events when the bridge instance runs for the first time. Usually this is the same block where the Foreign Bridge contract was deployed to. If a new validator instance is being deployed for an existing set of validators, the block number could be the latest block in the chain. | integer
ORACLE_LOG_LEVEL | Set the level of details in the logs. | `trace` / `debug` / `info` / `warn` / `error` / `fatal`
ORACLE_MAX_PROCESSING_TIME | The workers processes will be killed if this amount of time (in milliseconds) is elapsed before they finish processing. It is recommended to set this value to 4 times the value of the longest polling time (set with the `HOME_POLLING_INTERVAL` and `FOREIGN_POLLING_INTERVAL` variables). To disable this, set the time to 0. | integer
ORACLE_VALIDATOR_ADDRESS_PRIVATE_KEY | The private key of the bridge validator used to sign confirmations before sending transactions to the bridge contracts. The validator account is calculated automatically from the private key. Every bridge instance (set of watchers and senders) must have its own unique private key. The specified private key is used to sign transactions on both sides of the bridge. | hexidecimal without "0x"
ORACLE_VALIDATOR_ADDRESS | The public address of the bridge validator | hexidecimal with "0x"
ORACLE_TX_REDUNDANCY | If set to `true`, instructs oracle to send `eth_sendRawTransaction` requests through all available RPC urls defined in `COMMON_HOME_RPC_URL` and `COMMON_FOREIGN_RPC_URL` variables instead of using first available one
ORACLE_HOME_TO_FOREIGN_ALLOWANCE_LIST | Filename with a list of addresses, separated by newlines. If set, determines the privileged set of accounts whose requests will be automatically processed by the CollectedSignatures watcher. | string
ORACLE_HOME_TO_FOREIGN_BLOCK_LIST | Filename with a list of addresses, separated by newlines. If set, determines the blocked set of accounts whose requests will not be automatically processed by the CollectedSignatures watcher. Has a lower priority than the `ORACLE_HOME_TO_FOREIGN_ALLOWANCE_LIST` | string
ORACLE_HOME_TO_FOREIGN_CHECK_SENDER | If set to `true`, instructs the oracle to do an extra check for transaction origin in the block/allowance list. `false` by default. | `true` / `false`
ORACLE_ALWAYS_RELAY_SIGNATURES | If set to `true`, the oracle will always relay signatures even if it was not the last who finilized the signatures collecting process. The default is `false`. | `true` / `false`
ORACLE_RPC_REQUEST_TIMEOUT | Timeout in milliseconds for a single RPC request. Default value is `ORACLE_*_RPC_POLLING_INTERVAL * 2`. | integer
ORACLE_HOME_TX_RESEND_INTERVAL | Interval in milliseconds for automatic resending of stuck transactions for Home sender service. Defaults to 20 minutes. | integer  
ORACLE_FOREIGN_TX_RESEND_INTERVAL | Interval in milliseconds for automatic resending of stuck transactions for Foreign sender service. Defaults to 20 minutes. | integer  
ORACLE_SHUTDOWN_SERVICE_URL | Optional external URL to some other service/monitor/configuration manager that controls the remote shutdown process. GET request should return `application/json` message with the following schema: `{ shutdown: true/false }`. | URL
ORACLE_SHUTDOWN_SERVICE_POLLING_INTERVAL | Optional interval in milliseconds used to request the side RPC node or external shutdown service. Default is 120000. | integer
ORACLE_SIDE_RPC_URL | Optional HTTPS URL(s) for communication with the external shutdown service or side RPC nodes, used for shutdown manager activities. Several URLs can be specified, delimited by spaces. If the connection to one of these nodes is lost the next URL is used for connection. | URL(s)
ORACLE_FOREIGN_ARCHIVE_RPC_URL | Optional HTTPS URL(s) for communication with the archive nodes on the foreign network. Only used in AMB bridge mode for async information request processing. Several URLs can be specified, delimited by spaces. If the connection to one of these nodes is lost the next URL is used for connection. | URL(s)
ORACLE_SHUTDOWN_CONTRACT_ADDRESS | Optional contract address in the side chain accessible through `ORACLE_SIDE_RPC_URL`, where the method passed in `ORACLE_SHUTDOWN_CONTRACT_METHOD` is implemented. | `address`
ORACLE_SHUTDOWN_CONTRACT_METHOD | Method signature to be used in the side chain to identify the current shutdown status. Method should return boolean. Default value is `isShutdown()`. | `function signature`
ORACLE_FOREIGN_RPC_BLOCK_POLLING_LIMIT | Max length for the block range used in `eth_getLogs` requests for polling contract events for the Foreign chain. Infinite, if not provided. | `integer`
ORACLE_HOME_RPC_BLOCK_POLLING_LIMIT | Max length for the block range used in `eth_getLogs` requests for polling contract events for the Home chain. Infinite, if not provided. | `integer`


## Monitor configuration

name | description | value
--- | --- | ---
MONITOR_HOME_START_BLOCK | The app will monitor transactions starting from this block. | integer
MONITOR_FOREIGN_START_BLOCK | The app will monitor transactions starting from this block. | integer
MONITOR_VALIDATOR_HOME_TX_LIMIT | Average gas usage of a transaction sent by a validator, it is used to estimate the number of transaction that can be paid by the validator. | integer
MONITOR_VALIDATOR_FOREIGN_TX_LIMIT | Average gas usage of a transaction sent by a validator, it is used to estimate the number of transaction that can be paid by the validator. | integer
MONITOR_TX_NUMBER_THRESHOLD | If estimated number of transaction is equal to or below this value, the monitor will report that the validator has less funds than it is required. | integer
MONITOR_PORT | The port for the Monitor. | integer
MONITOR_BRIDGE_NAME | The name to be used in the url path for the bridge | string
MONITOR_CACHE_EVENTS | If set to true, monitor will cache obtained events for other workers runs | `true` / `false`
MONITOR_HOME_TO_FOREIGN_ALLOWANCE_LIST | File with a list of addresses, separated by newlines. If set, determines the privileged set of accounts whose requests should be automatically processed by the CollectedSignatures watcher. | string
MONITOR_HOME_TO_FOREIGN_BLOCK_LIST | File with a list of addresses, separated by newlines. If set, determines the set of accounts whose requests should be marked as unclaimed. Has a lower priority than the `MONITOR_HOME_TO_FOREIGN_ALLOWANCE_LIST`. | string
MONITOR_HOME_TO_FOREIGN_CHECK_SENDER | If set to `true`, instructs the oracle to do an extra check for transaction origin in the block/allowance list. `false` by default. | `true` / `false`
MONITOR_HOME_VALIDATORS_BALANCE_ENABLE | If set, defines the list of home validator addresses for which balance should be checked. | `string`
MONITOR_FOREIGN_VALIDATORS_BALANCE_ENABLE | If set, defines the list of foreign validator addresses for which balance should be checked. | `string`
