const Web3 = require('web3')

const homeWeb3 = new Web3(new Web3.providers.HttpProvider('http://parity1:8545'))
const foreignWeb3 = new Web3(new Web3.providers.HttpProvider('http://parity2:8545'))
const {user, blockGenerator} = require('../constants.json');

homeWeb3.eth.accounts.wallet.add(user.privateKey)
foreignWeb3.eth.accounts.wallet.add(user.privateKey)
homeWeb3.eth.accounts.wallet.add(blockGenerator.privateKey)
foreignWeb3.eth.accounts.wallet.add(blockGenerator.privateKey)

function generateNewBlock(web3, address) {
  return web3.eth.sendTransaction({
    from: address,
    to: '0x0000000000000000000000000000000000000000',
    gasPrice: '1',
    gas: '21000',
    value: '1'
  })
}

function main() {
  setTimeout(async () => {
    try {
      generateNewBlock(homeWeb3, blockGenerator.address)
    } catch (_) {} // in case of Transaction with the same hash was already imported.
    try {
      generateNewBlock(foreignWeb3, blockGenerator.address)
    } catch (_) {} // in case of Transaction with the same hash was already imported.
    main()
  }, 1000)
}

main()

process.on('SIGTERM', function () {
  console.log('Finishing sending blocks...')
  process.exit(0);
});
