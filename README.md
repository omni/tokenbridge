
# Bridge construction
This file includes how to deploy bridge contracts and how to run the corresponding oracle. The bridge allows users to lock existing ERC20 token in one chain(foreign) and mint the same amount of ERC677(ERC20 compatible) token in another(home). Or burning ERC677 for releasing ERC20 on the other hand.

## Initialize the repo
```
git clone git@github.com:taisys-technologies/taisys-bridge.git
cd taisys-bridge
yarn initialize
```

## Deploy Arbituary Message Bridge(AMB) bridge contracts

AMB bridge contracts are deployed on both chains to interact with oracle to varify messages crossing chains. 
* Use `.env.amb` as template for `.env`, more details [here](https://github.com/taisys-technologies/taisys-bridge/blob/master/CONFIGURATION.md). 
* It is assumed that a target ERC20 address is already in mind. Put the chain with that ERC20 contract as `foreign chain`.
* Double check key, addresses, rpc urls and **gasPrice** in `.env`.
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
Mediator contracts lock/release/burn/mint tokens when they receive varified message from AMB bridge contracts. With the home and foreign AMB bridges deployed, 
* Renew `.env` file with the template, `.env.ambe2e`. Put addresses of new bridge contracts into the new `.env` file.
* Double check key, addresses, rpc urls and **gasPrice** in `.env`.
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
Oracle is in charge of verifying and forwarding messages between two chains. 
* Put AMB bridge contract addresses and block heights in the `.env` file. 
* Put addresses of both mediator contracts into `oracle/bridge_data/access-lists/allowance_list.txt`.
* Provide address and private key of any validator provided in `.env` file when deploying bridge contracts as below.
```
cd oracle
# vim bridge_data/allowance_list.txt
# vim .env
docker-compose -f docker-compose-build.yml build
env ORACLE_VALIDATOR_ADDRESS=0x<address> \
env ORACLE_VALIDATOR_ADDRESS_PRIVATE_KEY=<private_key> \
docker-compose up -d
```

# Usage
About how to use the bridge.
## Smart Contracts3.eth.get_transaction_count(addr)

User
* ERC677 
    * TransferAndCall \*transaction
* ERC20
    * Approve \*transaction
* Foreign Mediator
    * RelayTokens \*transaction
___
Admin
* Home Bridge
    * submitSignatures \*transaction
    * executeAffirmation \*transaction
* Home/Foreign Validator
    *  addValidator \*transaction
    *  removeValidator \*transaction
* Foreign Bridge
    * executeSignatures \*transaction
### TransferAndCall
* Format: `transferAndCall(address _to, uint256 _value, bytes _data)`
* Output: True if succeed.
* Event: (list internal function events?)
    * `Tranfer(msg.sender, _to, _value, _data)``
### Approve
skip
### RelayTokens
* Format: `function relayTokens(address _receiver, uint256 _value)`
* Output: void
### addValidator
* Format: `function addValidator(address _validator) onlyOwner`
* Output: void
    * Event: ValidatorAdded(_validator)
### removeValidator
* Format: `function addValidator(address _validator) onlyOwner`
* Output: void
    * Event: ValidatorRomoved(_validator)

## Backend Integration
* sending from foreign to home(lock to mint)
```javascript
const approved = await erc20Contract.approve(
  config.foreignMediator,
  ethers.utils.parseEther(sellNGX),
);
const relayed = await foreignMediatorContract.relayTokens(
  signer.getAddress(),
  ethers.utils.parseEther(sellNGX),
);
```
* sending from home to foreign(burn to release)
```javascript
const result = await contract.transferAndCall(
  config.homeMediator,
  ethers.utils.parseEther(buyNGX),
  "0x"
);
```
## Deployments
```
[   Home  ] HomeBridge: 0x959992B4b392f9e231D37b093aEbCfECe9314cd6 at block 23611338
[ Foreign ] ForeignBridge: 0x974705E969381e75Cd248EF0A31EF9A3bea80123 at block 2387
Contracts Deployment have been saved to `bridgeDeploymentResults.json`
{
    "homeBridge": {
        "address": "0x959992B4b392f9e231D37b093aEbCfECe9314cd6",
        "deployedBlockNumber": 23611338
    },
    "foreignBridge": {
        "address": "0x974705E969381e75Cd248EF0A31EF9A3bea80123",
        "deployedBlockNumber": 2387
    }
}

[   Home  ] Bridge Mediator: 0xBac397F5020B1699434b95aF452ef0ce87e8fCC9
[   Home  ] ERC677 Bridgeable Token: 0xa1765940dccDaC254Fa20dE4641E3400f17b7fa9
[ Foreign ] Bridge Mediator: 0x9E49071ED3297575f484296c25DEa1f04C590b14
[ Foreign ] ERC677 Token: 0x8bA54E3309577be16B0C7E2973CF90d67328158c
Contracts Deployment have been saved to `bridgeDeploymentResults.json`
{
    "homeBridge": {
        "homeBridgeMediator": {
            "address": "0xBac397F5020B1699434b95aF452ef0ce87e8fCC9"
        },
        "bridgeableErc677": {
            "address": "0xa1765940dccDaC254Fa20dE4641E3400f17b7fa9"
        }
    },
    "foreignBridge": {
        "foreignBridgeMediator": {
            "address": "0x9E49071ED3297575f484296c25DEa1f04C590b14"
        }
    }
}
```
