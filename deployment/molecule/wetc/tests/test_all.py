import os
import testinfra.utils.ansible_runner

testinfra_hosts = testinfra.utils.ansible_runner.AnsibleRunner(
    os.environ['MOLECULE_INVENTORY_FILE']).get_hosts('all')


def test_repo(host):
    assert host.file('/home/poadocker/bridge').exists
    assert host.file('/home/poadocker/bridge').is_directory
    assert host.file('/home/poadocker/bridge/package.json').exists


def test_docker_group(host):
    assert host.group('docker').exists


def test_user(host):
    assert host.user('poadocker').exists
    assert 'docker' in host.user('poadocker').groups
