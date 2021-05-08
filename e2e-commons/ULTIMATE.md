# POA TokenBridge / Ultimate E2E

Documentation regarding the Ultimate end-to-end tests.

## Overview

The ultimate e2e test scenario covers erc-to-native and amb types of bridges.
It runs the e2e tests on components deployed using the deployment playbooks.


## Usage

### 1. Prepare the infrastructure

Run the Parity nodes, deploy the bridge contracts, deploy Oracle using the deployment playbook.

```bash
./e2e-commons/up.sh deploy blocks
./deployment-e2e/molecule.sh ultimate-erc-to-native
```

### 2. Run the E2E tests

```bash
cd e2e-commons
docker-compose run -e ULTIMATE=true e2e yarn workspace oracle-e2e run erc-to-native
```

## Diagram

![diagram](./ultimate.png)
