## Deploying bridge authority node

### Prerequisites
1. Launch an Ubuntu 16.04 server on your favourite hosting provider and note its IP address. You should setup ssh access to your node via public+private keys (using passwords is less secure). When creating the node, set a meaningful `hostname` that can identify you (e.g. `validator-0x...`).

2. On your local machine install
    * Python 2 (v2.6-v2.7)/Python3 (v3.5+)
    * Ansible v2.3+
    * Git

### Preparing configuration file
1. Clone this repository and go to `upgradable-wo-parity` folder
```
git clone https://github.com/poanetwork/deployment-bridge.git
cd upgradable-wo-parity
```

2. Create file `hosts.yml` from `hosts.yml.template`
```
cp hosts.yml.template hosts.yml
```
This file contains parameters specific to your node, so you need to edit it and replace/provide missing values. Let's review the parameters:
* `core-foundation` - name of the bridge you want to deploy. Unless deploying a custom bridge, you don't need to change this line
* `192.0.2.1` - replace with your node's IP address
* `ansible_user` - user to ssh into your node. Usually it's either `ubuntu` or `root`
* `ansible_python_interpreter` - path to python interpreter on your node. With Ubuntu 16.04 this should work with default value, however if running the playbook you get an error that `python3` is not found, try changing this to `/usr/bin/python`
* `signer_keyfile` - copy json content (`'{...}'`) of authority's keystore file
* `signer_password` - set this to authority's password
* `syslog_server_port` - set this to `server:port` of syslog server (should be provided to you)

If you're a new validator joining an existing bridge setup, you may want to additionally set the following parameters in `hosts.yml`:
* `last_checked_deposit_relay`
* `last_checked_withdraw_relay`
* `last_checked_withdraw_confirm`
If set, these values overwrite initial block numbers in `db.toml`, so that your node won't be re-processing transactions that are already processed by existing validators. You should get exact values from other validators before running the playbook.

### Installing the node
1. If ssh user can't execute `sudo` without password, you will need to add `--ask-become-pass` option below (without `[]` brackets) and provide sudo password when prompted by the playbook.
2. Run the playbook
```
ansible-playbook -i hosts.yml [--ask-become-pass] authority-node.yml
```
3. Playbook should complete without errors

## Setup details
To get more details about the setup, [go here](./DETAILS.md)

## Changes required for new bridges
To prepare configuration files for a newly deployed bridg, [go here](./NEW-BRIDGE.md)
