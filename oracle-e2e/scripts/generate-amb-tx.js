const Web3 = require('web3')
const { user, homeRPC, foreignRPC, amb2: amb } = require('../../e2e-commons/constants.json')
const { BOX_ABI } = require('../../commons')

const homeWeb3 = new Web3(new Web3.providers.HttpProvider(homeRPC.URL))
const foreignWeb3 = new Web3(new Web3.providers.HttpProvider(foreignRPC.URL))

homeWeb3.eth.accounts.wallet.add(user.privateKey)
foreignWeb3.eth.accounts.wallet.add(user.privateKey)

const opts = {
  from: user.address,
  gas: 400000,
  gasPrice: '1'
}
const homeBox = new homeWeb3.eth.Contract(BOX_ABI, amb.homeBox, opts)
const foreignBox = new foreignWeb3.eth.Contract(BOX_ABI, amb.foreignBox, opts)

async function main() {
  const res1 = await homeBox.methods.setValueOnOtherNetwork(123, amb.home, amb.foreignBox).send()
  const res2 = await foreignBox.methods.setValueOnOtherNetwork(456, amb.foreign, amb.homeBox).send()
  const res3 = await foreignBox.methods.setValueOnOtherNetwork(789, amb.foreign, amb.homeBox).send()

  console.log(res1.transactionHash)
  console.log(res2.transactionHash)
  console.log(res3.transactionHash)
}

main()
