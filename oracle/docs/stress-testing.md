# Stress testing

## Prerequisites

- [Geth](https://geth.ethereum.org/)
- [Parity](https://www.parity.io/)

## Geth (home) setup

In one terminal, initialize the geth chain using this `genesis.json`

```json
{
    "config": {
        "chainId": 15,
        "homesteadBlock": 0,
        "eip155Block": 0,
        "eip158Block": 0,
        "eip160Block": 0,
        "byzantiumBlock": 0
    },
    "difficulty": "100000",
    "gasLimit": "0x1000000000",
    "alloc": {
        "0xaaB52d66283F7A1D5978bcFcB55721ACB467384b": { "balance": "1000000000000000000000" },
        "0xbb140FbA6242a1c3887A7823F7750a73101383e3": { "balance": "1000000000000000000000" }
    }
}
```

and run this command:

```
geth --datadir ./data init genesis.json
```

Then start the node:

```
geth --datadir ./data --networkid 15 --rpc --rpcapi eth,web3,net
```

After doing this, you can enable the mining mode by doing:

```
geth attach --datadir ./data --exec "miner.setEtherbase('0xaaB52d66283F7A1D5978bcFcB55721ACB467384b'); miner.start(1)"
```

And you can disable it by doing:

```
geth attach --datadir ./data --exec "miner.stop()"
```

## Parity (foreign) setup

Start a parity node using the docker image in the `e2e/parity` directory.
Assuming that this image has been built and that the image name is `my-parity`,
run:

```
docker run -p 8546:8545 my-parity
```

## Deploy contracts and start the bridge

Set the geth node in mining mode. Set `http://localhost:8545` as the home RPC
URL, `http://localhost:8546` as the foreign RPC URL and
`0xaaB52d66283F7A1D5978bcFcB55721ACB467384b` as the deployer and validator.
Deploy the contracts.

To start the bridge, you can do `yarn dev`, or you can start all the scripts
separately.

## Generate a block with several transactions

Stop the mining in the node. Then, generate 1000 transactions by doing
`node scripts/sendUserTxToHome.js 1000`. After checking that the node received
all the transactions, start the mining again.

This will generate a block with 1000 transactions that the bridge will process.

## Generate statistics

After doing all of this, run `node scripts/compute-stats.js`. This will print
some statistics about the processed transactions.

### Statistics results

**Signature Requests**

Tests |1|2|3|4|5|AVG
---|---|---|---|---|---|---
count|1000|1000|1000|1000|1000|1000 
mean|12112|17714|15377|16468|15745|15483
median|11968|17925|15518|16994|15931|15667
min|5584|6423|5803|6121|6090|6004
max|18685|27554|23844|25310|24198|23918

**Collected Signatures**

Tests |1|2|3|4|5|AVG
---|---|---|---|---|---|---
count|1000|1000|1000|1000|1000|1000 
mean|8564|5399|6653|9684|9605|7981
median|8771|5971|7295|9854|10056|8389
min|7301|2783|3003|8331|7165|5716
max|9156|7453|9492|10889|10687|9535
