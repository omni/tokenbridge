# POA Token Bridge / Monitor
Tool for checking balances and unprocessed events in bridged networks.

## Overview
Please refer to the [POA Token Bridge](../README.md) overview first of all.

- Deployed version: https://bridge-monitoring.poa.net/

This tool allows you to spin up a NODE.JS server to monitor for health of the Token Bridge contracts: check for the balance difference, discover inconsistency in the validators list, catch unhandled transactions.

## Examples

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

# How to run

## Setup

1. [Initialize](../README.md#initializing-the-monorepository) the monorepository.

2. Go to the monitor sub-repository:
```
cd monitor
```

3. Create .env file:
```
cp .env.example .env
```

## Run web interface

Using Yarn:
```
yarn start
```

You can run web interface via [pm2](https://www.npmjs.com/package/pm2) or similar supervisor program.

Using Docker:
```
docker-compose up -d
```

- The application will run on `http://localhost:PORT`, where `PORT` is specified in your `.env` file.
- To enabled debug logging, set `DEBUG=1` variable in `.env`.

## Check balances of contracts and validators, get unprocessed events

Using Yarn:
```
yarn check-all
```

Using Docker:
```
docker-compose exec monitor yarn check-all
```

### Cron

You can create cron job to run workers (see `crontab.example` for reference):

## Linting

Running linter:

```bash
yarn lint
```

## Contributing

See the [CONTRIBUTING](../CONTRIBUTING.md) document for contribution, testing and pull request protocol.

## License

[![License: LGPL v3.0](https://img.shields.io/badge/License-LGPL%20v3-blue.svg)](https://www.gnu.org/licenses/lgpl-3.0)

This project is licensed under the GNU Lesser General Public License v3.0. See the [LICENSE](../LICENSE) file for details.
