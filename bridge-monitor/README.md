# Bridge Monitor
Deployed version:
https://bridge-monitoring.poa.net/

This tools allows you to spin up node.js server to monitor for 2 contracts on
Home and Foreign Eth networks to check for balance difference.
On Home network it checks for `HOME_BRIDGE_ADDRESS` balance.
On Foreign network it checks for the `ERC20 token` total supply for the `FOREIGN_BRIDGE_ADDRESS`.

Example of an API 

* `GET /` - check contract balances & tx numbers

```json

{
    "home": {
        "balance": "3710077.6896438415780044",
        "deposits": 481,
        "withdrawals": 221
    },
    "foreign": {
        "totalSupply": "3710077.6896438415780044",
        "deposits": 481,
        "withdrawals": 221
    },
    "balanceDiff": 0,
    "lastChecked": 1529511982,
    "depositsDiff": 0,
    "withdrawalDiff": 0
}
```

* `GET /validators` - check validators balances
```json
{
    "home": {
        "validators": {
            "0x35DC13c72A9C09C8AEEBD0490C7228C43Ccc38Cd": {
                "balance": "19.994900374",
                "leftTx": 66649667913333,
                "gasPrice": 1
            },
            "0x5D44BC8642947685F45004c936245B969F9709a6": {
                "balance": "19.993736069",
                "leftTx": 66645786896666,
                "gasPrice": 1
            },
            "0x284877074B986A78F01D7Eb1f34B6043b1719002": {
                "balance": "19.995139875",
                "leftTx": 66650466250000,
                "gasPrice": 1
            }
        },
        "requiredSignatures": 2
    },
    "foreign": {
        "validators": {
            "0x35DC13c72A9C09C8AEEBD0490C7228C43Ccc38Cd": {
                "balance": "19.084023268196",
                "leftTx": 28915,
                "gasPrice": 2.2
            },
            "0x5D44BC8642947685F45004c936245B969F9709a6": {
                "balance": "19.086724777075",
                "leftTx": 28919,
                "gasPrice": 2.2
            },
            "0x284877074B986A78F01D7Eb1f34B6043b1719002": {
                "balance": "19.050074813935",
                "leftTx": 28863,
                "gasPrice": 2.2
            }
        },
        "requiredSignatures": 2
    },
    "requiredSignaturesMatch": true,
    "validatorsMatch": true,
    "lastChecked": 1529512164
}
```

* `GET /eventsStats` - check unprocessed events
```json
{
    "onlyInHomeDeposits": [],
    "onlyInForeignDeposits": [],
    "onlyInHomeWithdrawals": [],
    "onlyInForeignWithdrawals": [],
    "lastChecked": 1529512436
}
```

* `GET /stuckTransfers` - check stucked transfers that wasnot called by transferAndCall
```json
{
    
    "stuckTransfers": [
        {
            "address": "0x6758B7d441a9739b98552B373703d8d3d14f9e62",
            "blockNumber": 5964312,
            "transactionHash": "0x74413ba79509a292d5d0d6edd364b3617c83a57b13d603de9deb6c8e6b6c6daf",
            ...
            "returnValues": {
                "0": "0x8D4bbc1B533aB9e3a743210870b6e3c4c0f7E935",
                "1": "0xd819E948b14cA6AAD2b7Ffd333cCDf732b129EeD",
                "2": "10000000000000000000000",
                "from": "0x8D4bbc1B533aB9e3a743210870b6e3c4c0f7E935",
                "to": "0xd819E948b14cA6AAD2b7Ffd333cCDf732b129EeD",
                "value": "10000000000000000000000"
            },
            ...
        }
    ],
    "total": 2,
    "lastChecked": 1535058662
}
```

# How to run
Create .env file (see `.env.example` for parameters reference)
```bash
HOME_RPC_URL=https://sokol.poa.network
FOREIGN_RPC_URL=https://kovan.infura.io/mew
HOME_BRIDGE_ADDRESS=0xABb4C1399DcC28FBa3Beb76CAE2b50Be3e087353
FOREIGN_BRIDGE_ADDRESS=0xE405F6872cE38a7a4Ff63DcF946236D458c2ca3a
GAS_PRICE_SPEED_TYPE=standard
GAS_LIMIT=300000
GAS_PRICE_FALLBACK=21
LEFT_TX_THRESHOLD=100
```

```bash
npm i
# check balances of contracts and validators
node checkWorker.js
# check unprocessed events
node checkWorker2.js
# check stuck transfers called by transfer, not transferAndCall
# only applicable for bridge-rust-v1-native-to-erc
node checkWorker3.js
# run web interface
node index.js
```

To enabled debug logging, set `DEBUG=1` env variable.

You can create cron job to run workers (see `crontab.example` for reference):
```bash
#crontab -e
*/4 * * * * cd $HOME/bridge-monitor; node checkWorker.js >>cronWorker.out 2>>cronWorker.err
*/5 * * * * cd $HOME/bridge-monitor; node checkWorker2.js >>cronWorker2.out 2>>cronWorker2.err
```

You can run web interface via [pm2](https://www.npmjs.com/package/pm2) or similar supervisor program.
