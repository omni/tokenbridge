Bridge-specific parameters should be stored in `group_vars/$BRIDGE_NAME.yml` so that they can be easily reused by selecting suitable bridge name in `hosts.yml`. However, for one-time testing purposes, these parameters can also be set directly in `hosts.yml` alongside other node-specific parametrs.

## Details of the authority node setup
Installation consists of 2 parts:

### 1. Preparing
1. A new user without sudo access is created. By default it's named `bridgeuser`, but can be controlled by `service_user` variable in `authority_node.yml`

2. UFW is configured to allow inbound tcp connections only on ssh port (`22` by default)

3. Syslog forwarding to remote server is setup by placing a config file in `/etc/rsyslog.d/tls-client.conf` file. This is done only if `syslog_server_port` is not empty

4. Binaries and configuration files will be stored in the bridgeuser's home directory in `poa-bridge` folder, with the following structure:
```
poa-bridge/
└── bridge/
    ├── bridge*
    ├── config.toml
    ├── db.toml
    ├── password.txt
    └── keys/
       └── home-keystore.json
```
here `*` means executable file, `/` means folder. Parity binary is downloaded both to home-node folder and foreign-node folder in case different versions might be required.

### 2. Setting up bridge service
1. Bridge binary is downloaded from url specified in `bridge_bin_url` variable (default value is set in `roles/bridge/defaults/main.yml`). Binary's sha256-checksum is validated against the value from `bridge_bin_sha256`. So when changing default version **both** `bridge_bin_url` and `bridge_bin_sha256` should be updated

2. Bridge `config.toml` is created based on `roles/bridge/templates/bridge.service.j2`, example:
```
keystore = "keys"

[home]
account = "0x006E27B6A72E1f34C626762F3C4761547Aff1421"
required_confirmations = 0
poll_interval = 2
rpc_host = "https://sokol.poa.network"
rpc_port = 443
password = "password.txt"

[foreign]
account = "0x006E27B6A72E1f34C626762F3C4761547Aff1421"
required_confirmations = 0
poll_interval = 2
rpc_host = "https://kovan.infura.io/mew"
rpc_port = 443
password = "password.txt"

[authorities]
accounts = []
required_signatures = 1

[transactions]
deposit_relay = { gas = 3000000, gas_price = 1000000000 }
withdraw_relay = { gas = 3000000, gas_price = 1000000000 }
withdraw_confirm = { gas = 3000000, gas_price = 1000000000 }
```

3. Database `db.toml` file is created based on `roles/bridge/db.toml.j2`, example (in this case it will be the same for all newly-created nodes):
```
home_contract_address = "0xad1dae0320717a288912ff7bae766ac87e7d14a5"
foreign_contract_address = "0xfd03be9947cbecb14a1ae8729936e23af7a0b50b"
checked_deposit_relay = 1768893
checked_withdraw_relay = 6715777
checked_withdraw_confirm = 6715777
```
**OR** `db.toml` can be copied from local machine, in this case `db_toml_location` variable should be set in `hosts.yml` to absolute path of the file

4. Bridge service is installed for `systemd` so that it auto-start on startup and auto-restarts if bridge process fails. Example of `/etc/systemd/system/bridge.service`
```
[Unit]
Description=bridge
After=network.target

[Service]
User=bridgeuser
Group=bridgeuser
WorkingDirectory=/home/bridgeuser/poa-bridge/bridge
Environment=RUST_LOG=info
ExecStart=/home/bridgeuser/poa-bridge/bridge/bridge --config /home/bridgeuser/poa-bridge/bridge/config.toml --database /home/bridgeuser/poa-bridge/bridge/db.toml
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
```
By default, restart delay is 3 seconds, this can be controlled by `restart_delay_sec` variable

5. Logs are stored in `/var/log/syslog`. If you provided `syslog_server_port` variable (in format `host:port`) in `hosts.yml` during installation, logs from syslog will be duplicated to a central syslog server for analysis and monitoring

## Useful commands
1. Restart services:
```
sudo systemctl restart bridge
```
Replace `restart` with `start` or `stop` if needed

2. Get quick status of a service:
```
sudo systemctl status bridge
```
note if it's reported `active`, `running` or `dead`

3. Tail bridge logs from `/var/log/syslog`:
```
tail -F /var/log/syslog | grep bridge
```

4. Relogin as bridge user (user without sudo access for running bridge):
```
sudo -i -u bridgeuser
```
to go back
```
exit
```

## URLs of bridge precompiled binary
Update `bridge_bin_url` and `bridge_bin_sha256` from `roles/bridge/defaults/main.yml`
