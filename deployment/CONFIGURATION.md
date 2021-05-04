# POA TokenBridge / Deployment Configuration

Please see the [Configuration](../CONFIGURATION.md) for additional configuration and execution details.

## Prerequisites

A functional Ubuntu 16.04 server launched using a trusted hosting provider. For more information, see our tutorials on [setting up a validator node on AWS](https://github.com/poanetwork/wiki/wiki/Validator-Node-on-AWS) or [setting up on non-AWS](https://github.com/poanetwork/wiki/wiki/Validator-Node-Non-AWS).
  * Record the IP address (required for file setup).
  * Setup ssh access to your node via public+private keys (using passwords is less secure). 
  * When creating the node, set a meaningful `hostname` that can identify you (e.g. `validator-0x...`).

## Initialization

1. Clone this repository and go to the `deployment` folder
```
git clone --recursive https://github.com/poanetwork/tokenbridge
cd tokenbridge/deployment
```
2. Create the file `hosts.yml` from `hosts.yml.example`
```
cp hosts.yml.example hosts.yml
```

`hosts.yml` should have the following structure:

```yaml
<bridge_name>:
  children:
    oracle:
      hosts:
        <host_ip_A>:
          ansible_user: <user>
          ORACLE_VALIDATOR_ADDRESS_PRIVATE_KEY: "<private_key>"
          #syslog_server_port: "<protocol>://<ip>:<port>" # When this parameter is set all bridge logs will be redirected to <ip>:<port> address.
        <host_ip_B>:
          # (...)
    monitor:
      hosts:
        <host_ip_B>:
          ansible_user: <user>
          #syslog_server_port: "<protocol>://<ip>:<port>"
          #monitor_cron_schedule: "*/4 * * * *" # When this parameter is set, it will overwrite default schedule for performing checks
```

The config above would install the Oracle on `<host_ip_A>`, and both Oracle and Monitor on `<host_ip_B>`.
```

| Value | Description |
|:------------------------------------------------|:----------------------------------------------------------------------------------------------------------|
| `<bridge_name>` | The bridge name which tells Ansible which file to use. This is located in `group_vars/<bridge_name>.yml`. |
| `<host_ip>` | Remote server IP address. |
| ansible_user: `<user>` | User that will ssh into the node. This is typically `ubuntu` or `root`. |
| ORACLE_VALIDATOR_ADDRESS_PRIVATE_KEY: `"<private_key>"` | The private key for the specified validator address. |
| syslog_server_port: `"<protocol>://<ip>:<port>"` | Optional port specification for bridge logs. This value will be provided by an administrator if required.  |

`hosts.yml` can contain multiple bridge configurations at once.

3. Copy the bridge name(s) to the hosts.yml file. 
   1. Go to the group_vars folder. 
   `cd group_vars`
   2. Note the  <bridge_name> and add it to the hosts.yml configuration. For example, if a bridge file is named sokol-kovan.yml, you would change the <bridge_name> value in hosts.yml to sokol-kovan.
   
## Examples

[Deploy a monitor for multiple bridges](./MONITOR.md)

## Administrator Configurations

1. The `group_vars/<bridge_name>.yml` file contains the public bridge parameters. This file is prepared by administrators for each bridge. The validator only needs to add the required bridge name in the hosts.yml file to tell Ansible which file to use.

   `group_vars/example.yml` shows an example configuration for the POA/Sokol - POA/Sokol bridge. Parameter values should match values from the .env file for the Oracle. See [Configuration parameters](../../oracle/README.md#configuration-parameters) for details.

2. You can also add the following parameters in the `group_vars` to change the default behavior of the playbooks:

2.1 `compose_service_user` - specifies the user created by the playbooks. This user runs the TokenBridge Oracle.

2.4 `bridge_path` sets the path where the TokenBridge Oracle is installed. By default, it points. to the home folder of `compose_service_user`

2.5 `docker_compose_version` - specifies a version of docker-compose to be installed.

2.6 `ALLOW_HTTP` (`no` by default) can be set to `yes` to allow bridge insecure connections to the network.
