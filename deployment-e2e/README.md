# POA TokenBridge / Deployment Testing

The deployment playbooks are tested using [Molecule](https://molecule.readthedocs.io).

## Push remote branch

The deployment playbooks are cloning the monorepository on target hosts, using your current local git branch name. If the branch does not exists on remote, you need to push it.

```
git push
```

Alternatively, if there are no changes except the playbooks, you can use the `master` branch:

```
./molecule.sh <scenario_name>
```

In this case `master` branch will be used as a codebase for Monitor, UI, Oracle and Contracts deployed by your local playbook.

## Run the tests

```
./molecule.sh <scenario_name>
```

Available scenarios:

Scenario | Description
--- | ---
oracle | Deploys and checks standalone Oracle on Ubuntu host
ui | Deploys and checks standalone UI on Ubuntu host

## Ultimate E2E tests

For information on the Ultimate tests, please refer to [Ultimate](../e2e-commons/ULTIMATE.md).
