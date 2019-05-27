[![CircleCI](https://circleci.com/gh/poanetwork/tokenbridge.svg?style=svg)](https://circleci.com/gh/poanetwork/tokenbridge)
[![Gitter](https://badges.gitter.im/poanetwork/poa-bridge.svg)](https://gitter.im/poanetwork/poa-bridge?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)
[![License: LGPL v3.0](https://img.shields.io/badge/License-LGPL%20v3-blue.svg)](https://www.gnu.org/licenses/lgpl-3.0)

# Tokenbridge
Welcome to the **POA Token Bridge** monorepository!

Please note that this repository as a **work in progress**.

## Overview

The POA Token Bridge allows users to transfer assets between two chains in the Ethereum ecosystem. It is composed of several elements which are contained within this monorepository.

For a complete picture of the POA Token Bridge functionality, it is useful to explore each subrepository.

## Structure

Sub-repositories maintained within this monorepo are listed below.

| Sub-repository | Description |
| --- | --- |
| [Oracle](oracle/README.md) | Oracle responsible for listening to bridge related events and authorizing asset transfers. |
| [UI](ui/README.md) | DApp interface to transfer tokens and coins between chains. |
| [Monitor](monitor/README.md) | Tool for checking balances and unprocessed events in bridged networks. |
| [Deployment](deployment/README.md) | Ansible playbooks for deploying cross-chain bridges. |
| [Oracle-E2E]() | End to end tests for the Oracle |
| [UI-E2E]() | End to end tests for the UI |

Additionally there are [Smart Contracts](https://github.com/poanetwork/poa-bridge-contracts) used to manage bridge validators, collect signatures, and confirm asset relay and disposal.

## Network Definitions

 Bridging occurs between two networks.

 * **Home** - or **Native** - is a network with fast and inexpensive operations. All bridge operations to collect validator confirmations are performed on this side of the bridge.

* **Foreign** can be any chain; generally it refers to the Ethereum mainnet. 

## Operational Modes

The POA TokenBridge provides three operational modes:

- [x] `Native-to-ERC20` **Coins** on a Home network can be converted to ERC20-compatible **tokens** on a Foreign network. Coins are locked on the Home side and the corresponding amount of ERC20 tokens are minted on the Foreign side. When the operation is reversed, tokens are burnt on the Foreign side and unlocked in the Home network. **More Information: [POA-to-POA20 Bridge](https://medium.com/poa-network/introducing-poa-bridge-and-poa20-55d8b78058ac)**
- [x] `ERC20-to-ERC20` ERC20-compatible tokens on the Foreign network are locked and minted as ERC20-compatible tokens (ERC677 tokens) on the Home network. When transferred from Home to Foreign, they are burnt on the Home side and unlocked in the Foreign network. This can be considered a form of atomic swap when a user swaps the token "X" in network "A" to the token "Y" in network "B". **More Information: [ERC20-to-ERC20](https://medium.com/poa-network/introducing-the-erc20-to-erc20-tokenbridge-ce266cc1a2d0)**
- [x] `ERC20-to-Native`: Pre-existing **tokens** in the Foreign network are locked and **coins** are minted in the `Home` network. In this mode, the Home network consensus engine invokes [Parity's Block Reward contract](https://wiki.parity.io/Block-Reward-Contract.html) to mint coins per the bridge contract request. **More Information: [xDai Chain](https://medium.com/poa-network/poa-network-partners-with-makerdao-on-xdai-chain-the-first-ever-usd-stable-blockchain-65a078c41e6a)**

## Building, running, linting & tests

To initialize submodules:

```
git submodule update --init
```

To install dependencies:

```
yarn install && yarn install:deploy
```

To build all projects and compile contracts:

```
yarn build
```

Running linter for all JS projects:

```
yarn lint
```

Running linter for all Ansible playbooks:

- [ansible-lint](https://github.com/ansible/ansible-lint) is required

```
yarn ansible-lint
```

Running tests for all projects:

```
yarn test
```

For details on building, running and developing please refer to respective READMEs in sub-repositories.

## Contributing

See the [CONTRIBUTING](CONTRIBUTING.md) document for contribution, testing and pull request protocol.

## License

This project is licensed under the GNU Lesser General Public License v3.0. See the [LICENSE](LICENSE) file for details.

## References

* [Additional Documentation](https://forum.poa.network/c/tokenbridge)
* [POA20 Bridge FAQ](https://forum.poa.network/c/tokenbridge/poa20-bridge)
