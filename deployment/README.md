# POA Token Bridge / Deployment
Ansible playbooks for deploying cross-chain bridges.

## Overview
Please refer to the [POA Token Bridge](../README.md) overview first of all.

These playbooks are designed to automate the deployment process for cross-chain bridges on bridge validator nodes. This process installs the bridge as a service and sets .env configurations on a remote server.

## Dependencies and Prerequisites

1. A functional Ubuntu 16.04 server launched using a trusted hosting provider. For more information, see our tutorials on [setting up a validator node on AWS](https://github.com/poanetwork/wiki/wiki/Validator-Node-on-AWS) or [setting up on non-AWS](https://github.com/poanetwork/wiki/wiki/Validator-Node-Non-AWS).
   * Record the IP address (required for file setup).
   * Setup ssh access to your node via public+private keys (using passwords is less secure). 
   * When creating the node, set a meaningful `hostname` that can identify you (e.g. `validator-0x...`).

2. On your local machine install:
    * Python 2 (v2.6-v2.7)/Python3 (v3.5+)
    * [Ansible v2.3+](https://docs.ansible.com/ansible/latest/installation_guide/intro_installation.html)
    * Git

The playbooks automatically install `Docker`, `docker-compose`, `Python`, `Git`and it dependencies (such as `curl`, `ca-certificates`, `apt-transport-https`, etc.).

## Configuration

Please refer to [Configuration](./CONFIGURATION.md).

## Execution

Please refer to [Execution](./EXECUTION.md).

## Linting

- [ansible-lint](https://github.com/ansible/ansible-lint) is required

`yarn ansible-lint`

## Contributing

See the [CONTRIBUTING](../CONTRIBUTING.md) document for contribution, testing and pull request protocol.

## License

[![License: LGPL v3.0](https://img.shields.io/badge/License-LGPL%20v3-blue.svg)](https://www.gnu.org/licenses/lgpl-3.0)

This project is licensed under the GNU Lesser General Public License v3.0. See the [LICENSE](../LICENSE) file for details.


