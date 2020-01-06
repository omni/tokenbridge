## Deploy multiple bridge monitor on the same host

If you want to deploy a monitor for different bridges, the following variable should be configured in `group_vars/<bridge_name>.yml`:
```
MONITOR_PORT
```

For example, let's say we are going to deploy a monitor for xDai bridge and for WETC bridge.

#### Setup ansible configuration for monitor

First we create `hosts.yml` file
```yaml
---
new-monitor:
  children:
    monitor:
      hosts:
        <host_ip_A>:
          ansible_user: ubuntu
```
In `group_vars/new-monitor.yml`
```
MONITOR_PORT: 3003
```

Then we create a configuration file for xDai Bridge `xdai.env` in `monitor/configs`. 
```bash
cp dai.env.example xdai.env
```

And also create a configuration file for WETC Bridge `wetc.env` in `monitor/configs`. 
```bash
cp wetc.env.example wetc.env
```

Run the playbook to deploy the monitor
```
ansible-playbook -i hosts.yml site.yml
```

##### Get Monitor results
The monitor output will be available at `http://host_ip_A:MONITOR_PORT/MONITOR_BRIDGE_NAME`.

Given that in `xdai.env` the variable `MONITOR_BRIDGE_NAME` is set to `xdai`, the results are in the url `http://host_ip_A:3003/xdai/`.

Similar to the xdai case, in `wetc.env` the variable `MONITOR_BRIDGE_NAME` is set to `wetc`, so the results are in the url `http://host_ip_A:3003/wetc/`.
