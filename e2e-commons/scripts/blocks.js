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
  await homeWeb3.eth.sendTransaction({
    from: user.address,
    to: blockGenerator.address,
    gasPrice: '1',
    gas: '21000',
    value: '2100000000'
  })
  await foreignWeb3.eth.sendTransaction({
    from: user.address,
    to: blockGenerator.address,
    gasPrice: '1',
    gas: '21000',
    value: '2100000000'
  })

  setTimeout(async () => {
    generateNewBlock(homeWeb3, blockGenerator.address)
    generateNewBlock(foreignWeb3, blockGenerator.address)
    main()
  }, 5000)
}

main()

process.on('SIGTERM', function () {
  console.log('Finishing sending blocks...')
  process.exit(0);
});
