# POA Token Bridge / E2E-Commons

Common scripts and configuration for the end-to-end tests.

## Usage

Spin up parity networks, redis, rabbit, e2e container needed for end-to-end tests:

```
./up.sh [components]
```

Shut down and cleans up containers, networks, services, running scripts:

```
./down.sh
```

### Components

| Component | Description |
| --- | --- |
| deploy | Deploys the Smart Contracts |
| oracle | Launches Oracle containers |
| ui | Launches UI containers |
| blocks | Auto mines blocks |
| native-to-erc | Creates infrastructure for ultimate e2e testing, for native-to-erc type of bridge |

#### Ultimate e2e testing

For more information on the Ultimate e2e testing, please refer to [Ultimate](./ULTIMATE.md).
