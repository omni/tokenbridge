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

