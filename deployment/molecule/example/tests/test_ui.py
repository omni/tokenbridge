import os
import pytest
import testinfra.utils.ansible_runner

testinfra_hosts = testinfra.utils.ansible_runner.AnsibleRunner(
    os.environ['MOLECULE_INVENTORY_FILE']).get_hosts('ui')


@pytest.mark.parametrize("name", [
    ("ui_ui_1")
])
def test_docker_containers(host, name):
    container = host.docker(name)
    assert container.is_running


def test_website(host):
    assert host.run_test(
        'curl http://host.docker.internal:3001 || curl http://localhost:3001'
    )
