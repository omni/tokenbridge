# POA TokenBridge / E2E-Commons

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
| oracle-validator-2 | Launches Oracle containers for second validator |
| oracle-validator-3 | Launches Oracle containers for third validator |
| blocks | Auto mines blocks |
| monitor | Launches Monitor containers |
| erc-to-native | Creates infrastructure for ultimate e2e testing, for erc-to-native type of bridge |
| amb | Creates infrastructure for ultimate e2e testing, for arbitrary message type of bridge |

#### Ultimate e2e testing

For more information on the Ultimate e2e testing, please refer to [Ultimate](./ULTIMATE.md).
