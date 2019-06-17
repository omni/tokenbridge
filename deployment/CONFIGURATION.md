# POA Token Bridge / Deployment Configuration

Please see the [Oracle](../oracle/README.md) for configuration and execution details.

## Initialization

1. Clone this repository and go to the `deployment/oracle` folder
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
    hosts:
        <host_ip>:
            ansible_user: <user>
            VALIDATOR_ADDRESS_PRIVATE_KEY: "<private_key>"
            #syslog_server_port: "<protocol>://<ip>:<port>" # When this parameter is set all bridge logs will be redirected to <ip>:<port> address.
```

| Value | Description |
|:------------------------------------------------|:----------------------------------------------------------------------------------------------------------|
| `<bridge_name>` | The bridge name which tells Ansible which file to use. This is located in `group_vars/<bridge_name>.yml`. |
| `<host_ip>` | Remote server IP address. |
| ansible_user: `<user>` | User that will ssh into the node. This is typically `ubuntu` or `root`. |
| VALIDATOR_ADDRESS_PRIVATE_KEY: `"<private_key>"` | The private key for the specified validator address. |
| syslog_server_port: `"<protocol>://<ip>:<port>"` | Optional port specification for bridge logs. This value will be provided by an administrator if required.  |

`hosts.yml` can contain multiple hosts and bridge configurations (groups) at once.

3. Copy the bridge name(s) to the hosts.yml file. 
   1. Go to the group_vars folder. 
   `cd group_vars`
   2. Note the  <bridge_name> and add it to the hosts.yml configuration. For example, if a bridge file is named sokol-kovan.yml, you would change the <bridge_name> value in hosts.yml to sokol-kovan.

