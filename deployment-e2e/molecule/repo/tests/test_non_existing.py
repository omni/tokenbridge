import os
import pytest
import testinfra.utils.ansible_runner

testinfra_hosts = testinfra.utils.ansible_runner.AnsibleRunner(
    os.environ['MOLECULE_INVENTORY_FILE']).get_hosts('all')


@pytest.mark.parametrize("path", [
    ("/home/poadocker/bridge/node_modules"),
    ("/home/poadocker/bridge/ui/node_modules"),
    ("/home/poadocker/bridge/oracle/node_modules"),
    ("/home/poadocker/bridge/monitor/node_modules"),
    ("/home/poadocker/bridge/contracts/node_modules"),
])
def test_non_existing_node_modules(host, path):
    assert not host.file(path).exists

@pytest.mark.parametrize("path", [
    ("/home/poadocker/bridge/.git")
])
def test_non_existing_git(host, path):
    assert not host.file(path).exists
