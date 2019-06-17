### Configuration

1. Clone this repository and go to the `deployment/oracle` folder
```
git clone --recursive https://github.com/poanetwork/tokenbridge
cd tokenbridge/deployment/oracle
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

#### Administrator Configurations

1. The `group_vars/<bridge_name>.yml` file contains the public bridge parameters. This file is prepared by administrators for each bridge. The validator only needs to add the required bridge name in the hosts.yml file to tell Ansible which file to use.

   `group_vars/example.yml` shows an example configuration for the POA/Sokol - POA/Sokol bridge. Parameter values should match values from the .env file for the Oracle. See [Configuration parameters](../../oracle/README.md#configuration-parameters) for details.

2. You can also add the following parameters in the `group_vars` to change the default behavior of `deployment-bridge` playbooks:

2.1 `compose_service_user` - specifies users to be created by playbooks. This user will be used to run Token Bridge Oracle.

2.2 `bridge_repo` contains address of Token Bridge Oracle repository. The default value is  https://github.com/poanetwork/tokenbridge.

2.3 `bridge_repo_branch` points to the specific branch or commit to use with the `bridge_repo`. If `bridge_repo_branch` is not specified, the default (`master`) branch is used.

2.4 `bridge_path` set the path where Token Bridge Oracle would be installed. By default it point to the home folder of `compose_service_user`

2.5 `docker_compose_version` - specifies a version of docker-compose to be installed.

2.6 `ALLOW_HTTP` (`no` by default) can be set to `yes` to allow bridge insecure connections to the network.

## Execution

The playbook can be executed once [Ansible](https://docs.ansible.com/ansible/latest/installation_guide/intro_installation.html) is installed and all configuration variables are set. 

It will automatically install `Docker`, `docker-compose`, `Python`, `Git` and it dependencies (such as `curl`, `ca-certificates`, `apt-transport-https`, etc.) to the node. Also this playbooks creates an additional non-sudo docker user to run service as.

```yaml
ansible-playbook -i hosts.yml site.yml
```

**Useful arguments:**

To be used with the ansible-playbook command, for example:

```yaml
 `ansible-playbook -i hosts.yml site.yml --ask-become-pass`
```

* `--ask-pass` - ask for the password used to connect to the bridge VM.

* `--ask-become-pass` - ask for the `become` password used to execute some commands (such as Docker installation) with root privileges.

* `-i <file>` - use specified file as a `hosts.yml` file.

* `-e "<variable>=<value>"` - override default variable.

* `--private-key=<file_name>` - if private keyfile is required to connect to the ubuntu instance.

* `--user=<username>` - connect as this username

