# Bridge construction
This file includes how to deploy bridge contracts and how to run the corresponding oracle. The bridge allows users to lock existing ERC20 token in one chain(foreign) and mint the same amount of ERC677(ERC20 compatible) token in another(home). Or burning ERC677 for releasing ERC20 on the other hand.

## Initialize the repo
```
git clone git@github.com:taisys-technologies/taisys-bridge.git
cd taisys-bridge
yarn initialize
```

## Deploy Arbituary Message Bridge(AMB) bridge contracts

AMB bridge contracts are deployed on both chains to interact with oracle to varify messages crossing chains. Use `.env.amb` as template for `.env`, more details [here](). It is assumed that a target ERC20 address is already in mind. Put the chain with that ERC20 contract as `foreign chain`.
```bash
cd contracts
# cp deploy/.env.amb deploy/.env
# vim deploy/.env
docker-compose up --build
docker-compose run bridge-contracts deploy.sh
```
keep the log from stdout. It is in the format below:
```
[   Home  ] HomeBridge: 0x31Ef709691B29caE64460F0bc16c98a1BBDFeF63 at block 11882086
[ Foreign ] ForeignBridge: 0x1217dD15B5962835037209564AEAE832c917686E at block 5112
Contracts Deployment have been saved to `bridgeDeploymentResults.json`
{
    "homeBridge": {
        "address": "0x31Ef709691B29caE64460F0bc16c98a1BBDFeF63",
        "deployedBlockNumber": 11882086
    },
    "foreignBridge": {
        "address": "0x1217dD15B5962835037209564AEAE832c917686E",
        "deployedBlockNumber": 5112
    }
}
```

## Deploy mediator contracts
Mediator contracts lock/release/burn/mint tokens when they receive varified message from AMB bridge contracts. With the home and foreign AMB bridges deployed, renew `.env` file with the template, `.env.ambe2e`. Put addresses of new bridge contracts into the new `.env` file.
```bash
# cp deploy/.env.amb deploy/.env
# vim deploy/.env
docker-compose up --build
docker-compose run bridge-contracts deploy.sh
```

keep the log from stdout. It is in the format below:
```
[   Home  ] Bridge Mediator: 0x9E49071ED3297575f484296c25DEa1f04C590b14
[   Home  ] ERC677 Bridgeable Token: 0x0D5360d7803EF269E8A2a7dD81d3323A2e14c160
[ Foreign ] Bridge Mediator: 0xeeDe1C632c79c0e39FCDd6948da90E463936531F
[ Foreign ] ERC677 Token: 0x8bA54E3309577be16B0C7E2973CF90d67328158c
Contracts Deployment have been saved to `bridgeDeploymentResults.json`
{
    "homeBridge": {
        "homeBridgeMediator": {
            "address": "0x9E49071ED3297575f484296c25DEa1f04C590b14"
        },
        "bridgeableErc677": {
            "address": "0x0D5360d7803EF269E8A2a7dD81d3323A2e14c160"
        }
    },
    "foreignBridge": {
        "foreignBridgeMediator": {
            "address": "0xeeDe1C632c79c0e39FCDd6948da90E463936531F"
        }
    }
}

```

## Start oracle
Oracle is in charge of verifying and forwarding messages between two chains. Put AMB bridge contract addresses and block heights in the `.env` file.
```
cd oracle
# vim .env
docker-compose -f docker-compose-build.yml build
env ORACLE_VALIDATOR_ADDRESS=0x<address> \
env ORACLE_VALIDATOR_ADDRESS_PRIVATE_KEY=<private_key> \
docker-compose up -d

```
