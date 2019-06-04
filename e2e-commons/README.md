# POA Token Bridge / E2E-Commons

Common scripts and configuration for the end-to-end tests.

## Usage

```
./up.sh [components]
```
Spins up parity networks, redis, rabbit, e2e container needed for end-to-end tests.

```
./down.sh
```
Shuts down and cleans up containers, networks, services, running scripts.

### Components

| Component | Description |
| --- | --- |
| deploy | Deploys the Smart Contracts |
| oracle | Launches oracle containers |
| ui | launches UI containers |
| blocks | Mines blocks |
