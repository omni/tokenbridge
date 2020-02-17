import os
import pytest
import testinfra.utils.ansible_runner

testinfra_hosts = testinfra.utils.ansible_runner.AnsibleRunner(
    os.environ['MOLECULE_INVENTORY_FILE']).get_hosts('all')


def test_repo(host):
    assert host.file('/home/poadocker/bridge').exists
    assert host.file('/home/poadocker/bridge').is_directory


def test_docker_group(host):
    assert host.group('docker').exists


def test_user(host):
    assert host.user('poadocker').exists
    assert 'docker' in host.user('poadocker').groups


@pytest.mark.parametrize("filename", [
    ("/etc/rsyslog.d/30-docker.conf"),
    ("/etc/rsyslog.d/35-docker-remote-logging.conf")
])
def test_logging(host, filename):
    assert host.file(filename).exists
    assert host.file(filename).mode == 0o0644


def test_docker_config(host):
    assert host.file('/etc/docker/daemon.json').exists
