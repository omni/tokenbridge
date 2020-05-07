## Deploy multiple bridge monitor on the same host

If you want to deploy a monitor for different bridges, the [monitor variables](../monitor/.env.example) should be configured in `group_vars/<bridge_name>.yml` for each bridge.

For example, let's say we are going to deploy a monitor for xDai bridge and for WETC bridge.

#### Setup ansible configuration for xDai Bridge

First we create `hosts.yml` file to deploy the monitor for xdai bridge
```yaml
---
xdai:
  children:
    monitor:
      hosts:
        <host_ip_A>:
          ansible_user: ubuntu
```
In `group_vars/xdai.yml`
```
---
MONITOR_BRIDGE_NAME: "xdai"
MONITOR_PORT: 3003
MONITOR_CACHE_EVENTS: "true"

COMMON_HOME_RPC_URL: "https://dai.poa.network"
COMMON_HOME_BRIDGE_ADDRESS: "0x7301CFA0e1756B71869E93d4e4Dca5c7d0eb0AA6"
COMMON_FOREIGN_RPC_URL: "https://mainnet.infura.io/v3/INFURA_KEY"
COMMON_FOREIGN_BRIDGE_ADDRESS: "0x4aa42145Aa6Ebf72e164C9bBC74fbD3788045016"

COMMON_HOME_GAS_PRICE_FALLBACK: 0
COMMON_FOREIGN_GAS_PRICE_SUPPLIER_URL: "https://gasprice.poa.network/"
COMMON_FOREIGN_GAS_PRICE_SPEED_TYPE: "standard"
COMMON_FOREIGN_GAS_PRICE_FALLBACK: 10000000000
COMMON_FOREIGN_GAS_PRICE_FACTOR: 1

MONITOR_HOME_START_BLOCK: 759
MONITOR_FOREIGN_START_BLOCK: 6478417
MONITOR_VALIDATOR_HOME_TX_LIMIT: 0
MONITOR_VALIDATOR_FOREIGN_TX_LIMIT: 300000
MONITOR_TX_NUMBER_THRESHOLD: 100
```

Run the playbook to deploy the monitor for xdai bridge
```
ansible-playbook -i hosts.yml site.yml
```

This command will deploy the monitor component and enable statistics for xdai bridge.

#### Setup ansible configuration for WETC Bridge

Update `hosts.yml` file to deploy the monitor for WETC Bridge
```yaml
---
wetc:
  children:
    monitor:
      hosts:
        <host_ip_A>:
          ansible_user: ubuntu
```

In `group_vars/wetc.yml`
```
---
MONITOR_BRIDGE_NAME: "wetc"
MONITOR_CACHE_EVENTS: "true"

COMMON_HOME_RPC_URL: "https://ethereumclassic.network"
COMMON_HOME_BRIDGE_ADDRESS: "0x073081832B4Ecdce79d4D6753565c85Ba4b3BeA9"
COMMON_FOREIGN_RPC_URL: "https://mainnet.infura.io/v3/32e8e252699a4ac1b5dd5c1ef53cc301"
COMMON_FOREIGN_BRIDGE_ADDRESS: "0x0cB781EE62F815bdD9CD4c2210aE8600d43e7040"

COMMON_HOME_GAS_PRICE_SUPPLIER_URL: "https://gasprice-etc.poa.network/"
COMMON_HOME_GAS_PRICE_SPEED_TYPE: "standard"
COMMON_HOME_GAS_PRICE_FALLBACK: 15000000000
COMMON_HOME_GAS_PRICE_FACTOR: 1

COMMON_FOREIGN_GAS_PRICE_SUPPLIER_URL: "https://gasprice.poa.network/"
COMMON_FOREIGN_GAS_PRICE_SPEED_TYPE: "standard"
COMMON_FOREIGN_GAS_PRICE_FALLBACK: 10000000000
ORACLE_FOREIGN_GAS_PRICE_UPDATE_INTERVAL: 600000
COMMON_FOREIGN_GAS_PRICE_FACTOR: 1

MONITOR_HOME_START_BLOCK: 7703292
MONITOR_FOREIGN_START_BLOCK: 7412459
MONITOR_VALIDATOR_HOME_TX_LIMIT: 300000
MONITOR_VALIDATOR_FOREIGN_TX_LIMIT: 300000
MONITOR_TX_NUMBER_THRESHOLD: 100
```
Given that there is a monitor component deployed in the system, the `MONITOR_PORT` variable is not needed.

Run the playbook to deploy the monitor for WETC Bridge
```
ansible-playbook -i hosts.yml site.yml
```

They playbook will detect that the monitor component is already deployed in the system, so it will only generate the configuration needed to enable the WETC Bridge statistics.

##### Get Monitor results
The monitor output will be available at `http://host_ip_A:MONITOR_PORT/MONITOR_BRIDGE_NAME`.

Given that in `xdai.env` the variable `MONITOR_BRIDGE_NAME` is set to `xdai`, the results are in the url `http://host_ip_A:3003/xdai/`.

Similar to the xdai case, in `wetc.env` the variable `MONITOR_BRIDGE_NAME` is set to `wetc`, so the results are in the url `http://host_ip_A:3003/wetc/`.
