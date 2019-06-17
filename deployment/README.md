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

## Rollback the Last Processed Block in Redis

If the bridge does not handle an event properly (i.e. a transaction stalls due to a low gas price), the Redis DB can be rolled back. You must identify which watcher needs to re-run. For example, if the validator signatures were collected but the transaction with signatures was not sent to the Foreign network, the `collected-signatures` watcher must look at the block where the corresponding `CollectedSignatures` event was raised.

Execute the `reset-lastBlock.sh` script in the bridge root directory. For example, if you've installed your bridge with this deployment script and all the default parameters, use the following set of commands:

```shell
$ sudo su poadocker
$ cd ~/bridge
$ docker-compose stop bridge_affirmation bridge_request bridge_collected
$ docker-compose exec bridge_senderhome bash ./reset-lastBlock.sh <watcher> <block num>
$ exit
$ sudo service poabridge restart
```
where the _<watcher>_ could be one of the following:

- `signature-request`
- `collected-signatures`
- `affirmation-request`

## Logs

If the `syslog_server_port` option in the hosts.yml file is not set, all logs will be stored in `/var/log/docker/` folder in the set of folders with the `bridge_` prefix. 

If the `syslog_server_port` is set, logs will be redirected to the specified server and cannot be accessed on the bridge machine.

```yaml 
syslog_server_port: "<protocol>://<ip>:<port>" # When this parameter is set all bridge logs will be redirected to the <ip>:<port> address.
```

## Contributing

See the [CONTRIBUTING](../CONTRIBUTING.md) document for contribution, testing and pull request protocol.

## License

[![License: LGPL v3.0](https://img.shields.io/badge/License-LGPL%20v3-blue.svg)](https://www.gnu.org/licenses/lgpl-3.0)

This project is licensed under the GNU Lesser General Public License v3.0. See the [LICENSE](../LICENSE) file for details.


