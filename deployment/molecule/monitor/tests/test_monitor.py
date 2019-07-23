import os
import pytest
import testinfra.utils.ansible_runner

testinfra_hosts = testinfra.utils.ansible_runner.AnsibleRunner(
    os.environ['MOLECULE_INVENTORY_FILE']).get_hosts('monitor')


@pytest.mark.parametrize("name", [
    ("monitor_monitor_1")
])
def test_docker_containers(host, name):
    container = host.docker(name)
    assert container.is_running
