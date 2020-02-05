const Web3 = require('web3')
const { generateNewBlock } = require('../utils')

const homeWeb3 = new Web3(new Web3.providers.HttpProvider('http://localhost:8541'))
const foreignWeb3 = new Web3(new Web3.providers.HttpProvider('http://localhost:8542'))
const {user, blockGenerator} = require('../constants.json');

homeWeb3.eth.accounts.wallet.add(user.privateKey)
foreignWeb3.eth.accounts.wallet.add(user.privateKey)
homeWeb3.eth.accounts.wallet.add(blockGenerator.privateKey)
foreignWeb3.eth.accounts.wallet.add(blockGenerator.privateKey)

function main() {
  setTimeout(async () => {
    try {
      generateNewBlock(homeWeb3, blockGenerator.address)
    } catch {} // in case of Transaction with the same hash was already imported.
    try {
      generateNewBlock(foreignWeb3, blockGenerator.address)
    } catch {} // in case of Transaction with the same hash was already imported.
    main()
  }, 1000)
}

main()

process.on('SIGTERM', function () {
  console.log('Finishing sending blocks...')
  process.exit(0);
});
