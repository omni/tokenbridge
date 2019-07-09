import os
import pytest
import testinfra.utils.ansible_runner

testinfra_hosts = testinfra.utils.ansible_runner.AnsibleRunner(
    os.environ['MOLECULE_INVENTORY_FILE']).get_hosts('oracle')


@pytest.mark.parametrize("name", [
    ("oracle_rabbit_1"),
    ("oracle_redis_1"),
    ("oracle_bridge_request_1"),
    ("oracle_bridge_collected_1"),
    ("oracle_bridge_affirmation_1"),
    ("oracle_bridge_senderhome_1"),
    ("oracle_bridge_senderforeign_1"),
])
def test_docker_containers(host, name):
    container = host.docker(name)
    assert container.is_running


@pytest.mark.parametrize("service", [
    ("poabridge"),
    ("rsyslog")
])
def test_services(host, service):
    assert host.service(service).is_enabled
    assert host.service(service).is_running


def test_logging(host):
    assert host.file('/etc/rsyslog.d/31-oracle-docker.conf').exists
    assert host.file('/etc/rsyslog.d/36-oracle-remote-logging.conf').exists


def test_docker_config(host):
    assert host.file('/etc/docker/daemon.json').exists
