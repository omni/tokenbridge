const { spawn } = require('child_process')
const fs = require('fs')
const Web3 = require('web3')
const { testRPC } = require('./run-local-lib')
const utils = require('ethereumjs-util')

process.on('unhandledRejection', e => console.error(e))

const RPC = 'http://localhost:8545'
const PK_USER = '0xecb2222da7cbca080201acf6a7bbda53a3b2bcb22e3004b83ab8c69a884becb9'

const DEPLOYER_PK = '0x13179885a8731284475aa2317a35a292131772bb5aa33734a1290b8b13944409'
const DEPLOYER_ADDRESS = utils.bufferToHex(utils.privateToAddress(DEPLOYER_PK))

const ERC20_ADDRESS = utils.bufferToHex(utils.generateAddress(DEPLOYER_ADDRESS, '0'))

const getAccount = async web3 => {
  const [defaultAccount] = await web3.eth.getAccounts()
  if (!defaultAccount) {
    throw new Error('Can not find an unlocked account')
  }
  return defaultAccount
}
;(async function() {
  if (!(await testRPC(RPC))) {
    throw new Error('Ganache not found on port 8545')
  }

  const web3 = new Web3(new Web3.providers.HttpProvider(RPC), null, {
    transactionConfirmationBlocks: 1
  })

  const user = web3.eth.accounts.privateKeyToAccount(PK_USER)
  const deployer = web3.eth.accounts.privateKeyToAccount(DEPLOYER_PK)

  const balance = await web3.eth.getBalance(user.address)
  console.log(balance, 'bal')
  if (balance === '0') {
    const defaultAccount = await getAccount(web3)

    console.log(`Sending 1 ETH from ${defaultAccount} to ${user.address}`)
    await web3.eth.sendTransaction({
      from: defaultAccount,
      to: user.address,
      value: web3.utils.toWei('1', 'ether')
    })
  }

  const collectableCode = await web3.eth.getCode(ERC20_ADDRESS)
  if (collectableCode === '0x') {
    console.log('ERC20 contract not found, deploying')
    const defaultAccount = await getAccount(web3)

    await web3.eth.sendTransaction({
      from: defaultAccount,
      to: deployer.address,
      value: web3.utils.toWei('.2', 'ether')
    })

    // Deploy ERC20
    const erc20Bytecode = fs.readFileSync(`${__dirname}/erc20bytecode.txt`, 'utf8')
    const { rawTransaction: deployTx } = await deployer.signTransaction({
      gas: '5000000',
      data: erc20Bytecode
    })
    await web3.eth.sendSignedTransaction(deployTx)

    // Transfer tokens to user
    console.log('Transfering tokens')
    const { rawTransaction: transferTx } = await deployer.signTransaction({
      to: ERC20_ADDRESS,
      gas: '5000000',
      data: `0xa9059cbb000000000000000000000000${user.address.substr(
        2
      )}0000000000000000000000000000000000000000000000056bc75e2d63100000`
    })
    await web3.eth.sendSignedTransaction(transferTx)
  }

  spawn('yarn', ['start-wallet'], {
    env: {
      ...process.env,
      REACT_APP_PK: PK_USER,
      REACT_APP_ERC20_ADDRESS: ERC20_ADDRESS
    },
    stdio: 'inherit'
  })
})()
