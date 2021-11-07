import os
import pytest
import testinfra.utils.ansible_runner

testinfra_hosts = testinfra.utils.ansible_runner.AnsibleRunner(
    os.environ['MOLECULE_INVENTORY_FILE']).get_hosts('all')


@pytest.mark.parametrize("service", [
    ("poabridge"),
    ("tokenbridge-monitor")
])
def test_services(host, service):
    assert host.service(service).is_enabled
    assert host.service(service).is_running


@pytest.mark.parametrize("name", [
    ("oracle_rabbit_1"),
    ("oracle_redis_1"),
    ("oracle_bridge_request_1"),
    ("oracle_bridge_collected_1"),
    ("oracle_bridge_affirmation_1"),
    ("oracle_bridge_senderhome_1"),
    ("oracle_bridge_senderforeign_1"),
    ("oracle_bridge_shutdown_1"),
    ("monitor_monitor_1")
])
def test_docker_containers(host, name):
    container = host.docker(name)
    assert container.is_running
