import os
import pytest
import testinfra.utils.ansible_runner

testinfra_hosts = testinfra.utils.ansible_runner.AnsibleRunner(
    os.environ['MOLECULE_INVENTORY_FILE']).get_hosts('all')


@pytest.mark.parametrize("path", [
    ("/home/poadocker"),
    ("/home/poadocker/bridge"),
    ("/home/poadocker/bridge/commons"),
    ("/home/poadocker/bridge/e2e-commons"),
    ("/home/poadocker/bridge/deployment"),
    ("/home/poadocker/bridge/contracts"),
    ("/home/poadocker/bridge/oracle"),
    ("/home/poadocker/bridge/monitor"),
    ("/home/poadocker/bridge/parity")
])
def test_existing_folders(host, path):
    assert host.file(path).exists
    assert host.file(path).is_directory


@pytest.mark.parametrize("path", [
    ("/home/poadocker/bridge/package.json"),
    ("/home/poadocker/bridge/commons/package.json"),
    ("/home/poadocker/bridge/contracts/package.json"),
    ("/home/poadocker/bridge/oracle/package.json"),
    ("/home/poadocker/bridge/monitor/package.json")
])
def test_existing_package_json(host, path):
    assert host.file(path).exists
    assert host.file(path).is_file


@pytest.mark.parametrize("path", [
    ("/home/poadocker/bridge/Dockerfile.e2e"),
    ("/home/poadocker/bridge/contracts/Dockerfile"),
    ("/home/poadocker/bridge/parity/Dockerfile"),
    ("/home/poadocker/bridge/oracle/Dockerfile"),
    ("/home/poadocker/bridge/monitor/Dockerfile")
])
def test_existing_docker_files(host, path):
    assert host.file(path).exists
    assert host.file(path).is_file
