# Ansible playbooks for deploying cross-chain bridges

## Bridge Overview

The POA Bridge allows users to transfer assets between two chains in the Ethereum ecosystem. It is composed of several elements which are located in different POA Network repositories:

**Bridge Elements**
1. Deployment Playbooks. Configuration management instructions for validator nodes contained in this repository.
2. [Bridge Smart Contracts](https://github.com/poanetwork/poa-bridge-contracts). Solidity contracts used to manage bridge validators, collect signatures, and confirm asset relay and disposal.
3. [Token Bridge](https://github.com/poanetwork/token-bridge). The token bridge oracle written in NodeJS.
4. [Bridge UI Application](https://github.com/poanetwork/bridge-ui). A DApp interface to transfer tokens and coins between chains.
5. [Bridge Monitor](https://github.com/poanetwork/bridge-monitor). A tool for checking balances and unprocessed events in bridged networks.


## Playbooks Overview

These playbooks are designed to automate the deployment process for cross-chain bridges on bridge validator nodes. This process installs the bridge as a service and sets .env configurations on a remote server. Playbooks for the current token-bridge deployment are located in the [bridge-nodejs](bridge-nodejs) folder.


### Rust Bridge Playbooks

The Rust bridge is not currently in production, but an Ansible playbook is developed for this implementation. It is available in the [upgradable-wo-parity](upgradable-wo-parity)folder. 

## Dependencies

The playbooks automatically install `Docker`, `docker-compose`, `Python`, `Git`and it dependencies (such as `curl`, `ca-certificates`, `apt-transport-https`, etc.). Install [Ansible](https://docs.ansible.com/ansible/latest/installation_guide/intro_installation.html) to launch playbooks.

## Configuration

Please see the [bridge-nodejs README](bridge-nodejs/README.md) for configuration and execution details. 

## Bridge service commands

The Bridge service is named `poabridge`. Use the default `SysVinit` commands to `start`, `stop`, `restart`, and `rebuild` the service and to check the `status` of the service. 

Commands format:
```bash
sudo service poabridge [start|stop|restart|status|rebuild]
```

## License

[![License: LGPL v3.0](https://img.shields.io/badge/License-LGPL%20v3-blue.svg)](https://www.gnu.org/licenses/lgpl-3.0)

This project is licensed under the GNU Lesser General Public License v3.0. See the [LICENSE](LICENSE) file for details.

## Contributing

See the [CONTRIBUTING](CONTRIBUTING.md) document for contribution, testing and pull request protocol.
