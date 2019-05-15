# POA Token Bridge / Deployment
Ansible playbooks for deploying cross-chain bridges.

## Overview
Please refer to the [POA Token Bridge](../README.md) overview first of all.

These playbooks are designed to automate the deployment process for cross-chain bridges on bridge validator nodes. This process installs the bridge as a service and sets .env configurations on a remote server. Playbooks for the current Token Bridge Oracle deployment are located in the [Oracle](oracle) folder.

## Dependencies

The playbooks automatically install `Docker`, `docker-compose`, `Python`, `Git`and it dependencies (such as `curl`, `ca-certificates`, `apt-transport-https`, etc.). Install [Ansible](https://docs.ansible.com/ansible/latest/installation_guide/intro_installation.html) to launch playbooks.

## Linting

- [ansible-lint](https://github.com/ansible/ansible-lint) is required

`yarn ansible-lint`

## Configuration

Please see the [Oracle](../oracle/README.md) for configuration and execution details. 

## Bridge service commands

The Bridge service is named `poabridge`. Use the default `SysVinit` commands to `start`, `stop`, `restart`, and `rebuild` the service and to check the `status` of the service. 

Commands format:
```bash
sudo service poabridge [start|stop|restart|status|rebuild]
```

## Contributing

See the [CONTRIBUTING](../CONTRIBUTING.md) document for contribution, testing and pull request protocol.

## License

[![License: LGPL v3.0](https://img.shields.io/badge/License-LGPL%20v3-blue.svg)](https://www.gnu.org/licenses/lgpl-3.0)

This project is licensed under the GNU Lesser General Public License v3.0. See the [LICENSE](../LICENSE) file for details.


