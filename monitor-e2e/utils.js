const shell = require('shelljs')
const Web3 = require('web3')

const checkAll = () => {
  // the different container names comes from macOS/linux docker differences and/or different docker-compose versions
  ;['e2e-commons_monitor_1', 'e2e_commons_monitor_1', 'e2ecommons_monitor_1'].forEach(container =>
    shell.exec(`docker exec ${container} yarn check-all`)
  )
}

const sendEther = async (rpcUrl, account, to) => {
  const web3 = new Web3(new Web3.providers.HttpProvider(rpcUrl))
  web3.eth.accounts.wallet.add(account.privateKey)

  await web3.eth.sendTransaction({
    from: account.address,
    to,
    gasPrice: '1',
    gas: '50000',
    value: '1000000000000000000'
  })
}

module.exports = {
  checkAll,
  sendEther
}
