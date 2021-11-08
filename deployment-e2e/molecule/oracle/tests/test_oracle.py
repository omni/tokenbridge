import os
import pytest
import testinfra.utils.ansible_runner

testinfra_hosts = testinfra.utils.ansible_runner.AnsibleRunner(
    os.environ['MOLECULE_INVENTORY_FILE']).get_hosts('oracle_swarm')


@pytest.mark.parametrize("name", [
    ("oracle_rabbit"),
    ("oracle_redis"),
    ("oracle_bridge_request"),
    ("oracle_bridge_collected"),
    ("oracle_bridge_affirmation"),
    ("oracle_bridge_senderhome"),
    ("oracle_bridge_senderforeign"),
    ("oracle_bridge_shutdown"),
])
def test_docker_containers(host, name):
    assert host.docker(name) is not None


@pytest.mark.parametrize("service", [
    ("poabridge"),
    ("rsyslog")
])
def test_services(host, service):
    assert host.service(service).is_enabled
    assert host.service(service).is_running


@pytest.mark.parametrize("filename", [
    ("/etc/rsyslog.d/31-oracle-docker.conf"),
    ("/etc/rsyslog.d/36-oracle-remote-logging.conf")
])
def test_logging(host, filename):
    assert host.file(filename).exists
    assert host.file(filename).mode == 0o0644
