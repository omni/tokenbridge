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


@pytest.mark.parametrize("service", [
    ("tokenbridge-ui"),
    ("rsyslog")
])
def test_services(host, service):
    assert host.service(service).is_enabled
    assert host.service(service).is_running


@pytest.mark.parametrize("filename", [
    ("/etc/rsyslog.d/32-ui-docker.conf"),
    ("/etc/rsyslog.d/37-ui-remote-logging.conf")
])
def test_logging(host, filename):
    assert host.file(filename).exists
    assert host.file(filename).mode == 0o0644


def test_docker_config(host):
    assert host.file('/etc/docker/daemon.json').exists
