const Web3 = require('web3')
const { generateNewBlock } = require('../utils')

const homeWeb3 = new Web3(new Web3.providers.HttpProvider('http://localhost:8541'))
const foreignWeb3 = new Web3(new Web3.providers.HttpProvider('http://localhost:8542'))
const {user} = require('../constants.json');
homeWeb3.eth.accounts.wallet.add(user.privateKey)
foreignWeb3.eth.accounts.wallet.add(user.privateKey)

function main() {
  setTimeout(async () => {
    generateNewBlock(homeWeb3, user.address)
    generateNewBlock(foreignWeb3, user.address)
    main()
  }, 5000)
}

main()

process.on('SIGTERM', function () {
  console.log('Finishing sending blocks...')
  process.exit(0);
});
