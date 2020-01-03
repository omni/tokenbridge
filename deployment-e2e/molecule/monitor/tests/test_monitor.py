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


@pytest.mark.parametrize("service", [
    ("tokenbridge-monitor"),
    ("rsyslog")
])
def test_services(host, service):
    assert host.service(service).is_enabled
    assert host.service(service).is_running


@pytest.mark.parametrize("filename", [
    ("/etc/rsyslog.d/33-monitor-docker.conf"),
    ("/etc/rsyslog.d/38-monitor-remote-logging.conf")
])
def test_logging(host, filename):
    assert host.file(filename).exists
    assert host.file(filename).mode == 0o0644


def test_home_exists(host):
    assert host.run_test(
        'curl -s http://localhost:3003/bridge | '
        'grep -q -i "home"'
    )


def test_foreign_exists(host):
    assert host.run_test(
        'curl -s http://localhost:3003/bridge | '
        'grep -q -i "foreign"'
    )


def test_no_error(host):
    assert host.run_expect(
        [1],
        'curl -s http://localhost:3003/bridge | '
        'grep -i -q "error"'
    )
