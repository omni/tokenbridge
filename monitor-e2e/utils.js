const shell = require('shelljs')
const Web3 = require('web3')

const checkAll = () => {
  // the different prefixes come from macOS/linux docker differences and/or different docker-compose versions
  ;['e2e-commons_', 'e2e_commons_', 'e2ecommons_'].forEach(prefix =>
    ['monitor_1', 'monitor-erc20_1', 'monitor-erc20-native_1'].forEach(container =>
      shell.exec(`docker exec ${prefix}${container} yarn check-all`)
    )
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
