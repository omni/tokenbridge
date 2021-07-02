const Web3 = require('web3')
const { SafeEthLogsProvider } = require('../services/SafeEthLogsProvider')
const { getEventsFromTx } = require('./web3')

const httpProvider = new Web3.providers.HttpProvider('https://dai.poa.network')
const provider = new SafeEthLogsProvider(httpProvider)
const web3 = new Web3(provider)
const { abi } = require('../../../contracts/build/contracts/HomeAMB.json')

// const addr = '0x8397be90BCF57b0B71219f555Fe121b22e5a994C'
const addr = '0x75Df5AF045d91108662D8080fD1FEFAd6aA0bb59'
const contract = new web3.eth.Contract(abi, addr)

const txHash = '0x0786ea3de107c74c27470eadffb4c2ea44b97d3accf5a13eaedea29bccb08073'
const event = 'SignedForUserRequest'
const filter = {}

getEventsFromTx({ web3, txHash, event, contract, filter }).then(console.log)

// contract.getPastEvents('UserRequestForSignature', { fromBlock: 16000000, toBlock: 16000057 }).then(console.log)
