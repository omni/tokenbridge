const Web3 = require('web3')
const { generateNewBlock } = require('../utils')

const homeWeb3 = new Web3(new Web3.providers.HttpProvider('http://localhost:8541'))
const foreignWeb3 = new Web3(new Web3.providers.HttpProvider('http://localhost:8542'))
const {secondUser} = require('../constants.json');
homeWeb3.eth.accounts.wallet.add(secondUser.privateKey)
foreignWeb3.eth.accounts.wallet.add(secondUser.privateKey)

function main() {
  setTimeout(async () => {
    generateNewBlock(homeWeb3, secondUser.address)
    generateNewBlock(foreignWeb3, secondUser.address)
    main()
  }, 1000)
}

main()

process.on('SIGTERM', function () {
  console.log('Finishing sending blocks...')
  process.exit(0);
});
