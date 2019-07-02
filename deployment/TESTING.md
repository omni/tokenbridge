# POA Token Bridge / Deployment Testing

The deployment playbooks are tested using [Molecule](https://molecule.readthedocs.io).

## Prepare virtual python environment

```
command -v virtualenv || pip3 install virtualenv
virtualenv -p python3 venv
source venv/bin/activate
pip install -r requirements.txt
```

## Run the tests

```
molecule test
```

## Exit the virtual environment

```
deactivate
```
