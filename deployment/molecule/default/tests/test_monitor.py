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


def test_website(host):
    assert host.run_test('curl http://host.docker.internal:3003')
    assert host.run_test('curl http://host.docker.internal:3003/validators')
    assert host.run_test('curl http://host.docker.internal:3003/eventsStats')
    assert host.run_test('curl http://host.docker.internal:3003/alerts')
