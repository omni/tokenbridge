## Deploy multiple bridge monitor on the same host

If you want to deploy multiple monitors for different bridges in the same host, the following variables should be configured in `group_vars/<bridge_name>.yml` and be different on every deployment:
```
BRIDGE_NAME
MONITOR_PORT
```
 
For example, let's say we are going to deploy a monitor for xDai bridge and another monitor for WETC bridge in the same host.

#### Setup and deploy xDai monitor

First we create `hosts.yml` file for xDai bridge
```yaml
---
dai:
  children:
    monitor:
      hosts:
        <host_ip_A>:
          ansible_user: ubuntu
```
Then in `group_vars/dai.yml`
```
...
BRIDGE_NAME: "xdai_monitor"
MONITOR_PORT: 3003
...
```

Run the playbook for xDai monitor
```
ansible-playbook -i hosts.yml site.yml
```

#### Setup and deploy WETC monitor

Update `hosts.yml` or create a new file for WETC bridge
```yaml
---
wetc:
  children:
    monitor:
      hosts:
        <host_ip_A>:
          ansible_user: ubuntu
```
Then in `group_vars/wetc.yml`
```
...
BRIDGE_NAME: "wetc_monitor"
MONITOR_PORT: 3005
...
```

Run the playbook for WETC monitor
```
ansible-playbook -i hosts.yml site.yml
```
