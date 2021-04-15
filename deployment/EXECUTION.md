# POA TokenBridge / Deployment Execution

Please refer to the [Configuration](./CONFIGURATION.md) first.

## Dependencies

On your local machine install:
  * Python 2 (v2.6-v2.7)/Python3 (v3.5+)
  * [Ansible v2.3+](https://docs.ansible.com/ansible/latest/installation_guide/intro_installation.html)
  * Git

The playbook will automatically install `Docker`, `docker-compose`, `Python`, `Git` and it dependencies (such as `curl`, `ca-certificates`, `apt-transport-https`, etc.) to the node. Also this playbooks creates an additional non-sudo docker user to run service as.

## Running the playbook

```yaml
ansible-playbook -i hosts.yml site.yml
```

## Useful arguments

To be used with the ansible-playbook command, for example:

```yaml
ansible-playbook -i hosts.yml site.yml --ask-become-pass
```

* `--ask-pass` - ask for the password used to connect to the bridge VM.

* `--ask-become-pass` - ask for the `become` password used to execute some commands (such as Docker installation) with root privileges.

* `-i <file>` - use specified file as a `hosts.yml` file.

* `-e "<variable>=<value>"` - override default variable.

* `--private-key=<file_name>` - if private keyfile is required to connect to the ubuntu instance.

* `--user=<username>` - connect as this username

## Service commands

The deployed components have the following services:

Component | Service Name
--- | ---
Oracle | poabridge
Monitor | tokenbridge-monitor

Use the default `SysVinit` commands to `start`, `stop`, `restart`, and `rebuild` the service and to check the `status` of the service. 

Commands format:
```bash
sudo service <service_name> [start|stop|restart|status|rebuild]
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

## Reset nonce counters
In case some tx from your bridge validator account were done outside the bridge, you might need to update nonce counters.

1. ssh to your bridge node and run:
    ```
    $ sudo su poadocker
    $ cd ~/bridge
    ```
1. stop running docker containers using the nonce by running:
    ```
    $ docker-compose stop bridge_senderhome bridge_senderforeign
    ```
1. Connect to the redis container:
    ```
    $ docker-compose exec redis /bin/bash
    ```
    you should get a shell prompt from inside the docker container, similar to this:
    ```
    root@redis:/data#
    ```
1. connect to redis database by running `redis-cli`, prompt should change once again to
    ```
    127.0.0.1:6379>
    ```
1. list existing keys by running `keys *`, output should look like this:
    ```
    127.0.0.1:6379> keys *
    1) "erc-native-affirmation-request:lastProcessedBlock"
    2) "erc-native-collected-signatures:lastProcessedBlock"
    3) "erc-native-signature-request:lastProcessedBlock"
    4) "home:nonce"
    5) "foreign:nonce"
    ```
1. delete keys containing last used nonces on both networks
    ```
    127.0.0.1:6379> del "home:nonce" "foreign:nonce"
    ```
1. exit from redis container by running `exit` twice
1. start the rest of bridge containers:
    ```
    $ docker-compose start bridge_senderhome bridge_senderforeign
    ```

## Logs

If the `syslog_server_port` option in the hosts.yml file is not set, all logs will be stored in `/var/log/docker/` folder in the set of folders with the `bridge_` prefix. 

If the `syslog_server_port` is set, logs will be redirected to the specified server and cannot be accessed on the bridge machine.

```yaml 
syslog_server_port: "<protocol>://<ip>:<port>" # When this parameter is set all bridge logs will be redirected to the <ip>:<port> address.
```
