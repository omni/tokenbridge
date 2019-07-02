# POA Token Bridge / Deployment Testing

The deployment playbooks are tested using [Molecule](https://molecule.readthedocs.io).

## Prepare virtual python environment

```
command -v virtualenv || pip3 install virtualenv
virtualenv -p python3 venv
source venv/bin/activate
pip install -r requirements.txt
```

## Push remote branch

The deployment playbooks are cloning the monorepository on target hosts, using your current local git branch name. If the branch does not exists on remote, you need to push it.

```
git push
```

Alternatively, if there are no changes except the playbooks, you can use the `master` branch:

```
CIRCLE_BRANCH=master molecule test
```

In this case `master` branch will be used as a codebase for Monitor, UI, Oracle and Contracts deployed by your local playbook.

## Run the tests

```
molecule test
```

## Exit the virtual environment

```
deactivate
```
