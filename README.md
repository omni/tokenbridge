![tokenbridge](https://github.com/poanetwork/tokenbridge/workflows/tokenbridge/badge.svg?branch=master)
[![Gitter](https://badges.gitter.im/poanetwork/poa-bridge.svg)](https://gitter.im/poanetwork/poa-bridge?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)
[![License: LGPL v3.0](https://img.shields.io/badge/License-LGPL%20v3-blue.svg)](https://www.gnu.org/licenses/lgpl-3.0)

# Tokenbridge
Welcome to the **POA TokenBridge** monorepository!

Please note that this repository as a **work in progress**.

## Overview

The POA TokenBridge allows users to transfer assets between two chains in the Ethereum ecosystem. It is composed of several elements which are contained within this monorepository.

For a complete picture of the POA TokenBridge functionality, it is useful to explore each subrepository.

## Structure

Sub-repositories maintained within this monorepo are listed below.

| Sub-repository | Description |
| --- | --- |
| [Oracle](oracle/README.md) | Oracle responsible for listening to bridge related events and authorizing asset transfers. |
| [UI](ui/README.md) | DApp interface to transfer tokens and coins between chains. |
| [Monitor](monitor/README.md) | Tool for checking balances and unprocessed events in bridged networks. |
| [Deployment](deployment/README.md) | Ansible playbooks for deploying cross-chain bridges. |
| [Oracle-E2E](oracle-e2e/README.md) | End to end tests for the Oracle |
| [Monitor-E2E](monitor-e2e/README.md) | End to end tests for the Monitor |
| [UI-E2E](ui-e2e/README.md) | End to end tests for the UI |
| [Deployment-E2E](deployment-e2e/README.md) | End to end tests for the Deployment |
| [Commons](commons/README.md) | Interfaces, constants and utilities shared between the sub-repositories |
| [E2E-Commons](e2e-commons/README.md) | Common utilities and configuration used in end to end tests |
| [ALM](alm/README.md) | DApp interface tool for AMB Live Monitoring |
| [Burner-wallet-plugin](burner-wallet-plugin/README.md) | TokenBridge Burner Wallet 2 Plugin |

Additionally there are [Smart Contracts](https://github.com/poanetwork/tokenbridge-contracts) used to manage bridge validators, collect signatures, and confirm asset relay and disposal.

## Available deployments

| **Launched by POA** | **Launched by 3rd parties** |
| ---------- | ---------- |
| [POA20 Bridge](https://bridge.poa.net/) | [Ocean TokenBridge](https://bridge.oceanprotocol.com/) | 
| [xDai Bridge](https://dai-bridge.poa.network/) | [Thunder bridge](https://ui.stormdapps.com/) |
| [WETC Bridge](https://wetc.app/) | [Volta TokenBridge](https://vt.volta.bridge.eth.events/) & [DAI bridge to Volta Chain](https://dai.volta.bridge.eth.events/) |
| | [Artis Brige](https://bridge.artis.network/) |
| | [Tenda bridge](https://bridge-mainnet.tenda.network) & [xDai-to-Tenda bridge](https://bridge-xdai.tenda.network/) |

## Network Definitions

 Bridging occurs between two networks.

 * **Home** - or **Native** - is a network with fast and inexpensive operations. All bridge operations to collect validator confirmations are performed on this side of the bridge.

* **Foreign** can be any chain; generally it refers to the Ethereum mainnet. 

## Operational Modes

The POA TokenBridge provides four operational modes:

- [x] `Native-to-ERC20` **Coins** on a Home network can be converted to ERC20-compatible **tokens** on a Foreign network. Coins are locked on the Home side and the corresponding amount of ERC20 tokens are minted on the Foreign side. When the operation is reversed, tokens are burnt on the Foreign side and unlocked in the Home network. **More Information: [POA-to-POA20 Bridge](https://medium.com/poa-network/introducing-poa-bridge-and-poa20-55d8b78058ac)**
- [x] `ERC20-to-ERC20` ERC20-compatible tokens on the Foreign network are locked and minted as ERC20-compatible tokens (ERC677 tokens) on the Home network. When transferred from Home to Foreign, they are burnt on the Home side and unlocked in the Foreign network. This can be considered a form of atomic swap when a user swaps the token "X" in network "A" to the token "Y" in network "B". **More Information: [ERC20-to-ERC20](https://medium.com/poa-network/introducing-the-erc20-to-erc20-tokenbridge-ce266cc1a2d0)**
- [x] `ERC20-to-Native`: Pre-existing **tokens** in the Foreign network are locked and **coins** are minted in the `Home` network. In this mode, the Home network consensus engine invokes [Parity's Block Reward contract](https://wiki.parity.io/Block-Reward-Contract.html) to mint coins per the bridge contract request. **More Information: [xDai Chain](https://medium.com/poa-network/poa-network-partners-with-makerdao-on-xdai-chain-the-first-ever-usd-stable-blockchain-65a078c41e6a)**
- [x] `Arbitrary-Message`: Transfer arbitrary data between two networks as so the data could be interpreted as an arbitrary contract method invocation.

## Initializing the monorepository

Clone the repository:
```bash
git clone https://github.com/poanetwork/tokenbridge
```

If there is no need to build docker images for the TokenBridge components (oracle, monitor, UI), initialize submodules, install dependencies, compile the Smart Contracts:
```
yarn initialize
```

Then refer to the corresponding README files to get information about particular TokenBridge component.

## Linting

Running linter for all JS projects:

```
yarn lint
```

## Tests

Running tests for all projects:

```
yarn test
```

Additionally there are end-to-end tests for [Oracle](oracle-e2e/README.md) and [UI](ui-e2e/README.md).

For details on building, running and developing please refer to respective READMEs in sub-repositories.

## Building, running and deploying

Please refer to the instructions in sub-directories.
Configuration details are available [here](./CONFIGURATION.md).

## Contributing

See the [CONTRIBUTING](CONTRIBUTING.md) document for contribution, testing and pull request protocol.

## License

This project is licensed under the GNU Lesser General Public License v3.0. See the [LICENSE](LICENSE) file for details.

## References

* [TokenBridge Documentation](https://docs.tokenbridge.net/)
