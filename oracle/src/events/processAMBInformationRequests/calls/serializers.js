const { ZERO_ADDRESS } = require('../../../../../commons')

const serializeBlock = (web3, block) => {
  const args = [block.number, block.hash, block.miner]
  const types = ['uint256', 'bytes32', 'address']
  return web3.eth.abi.encodeParameters(types, args)
}

const serializeTx = (web3, tx) => {
  const args = [
    tx.hash,
    tx.blockNumber,
    tx.from,
    tx.to || ZERO_ADDRESS,
    tx.value,
    tx.nonce,
    tx.gas,
    tx.gasPrice,
    tx.input
  ]
  const types = ['bytes32', 'uint256', 'address', 'address', 'uint256', 'uint256', 'uint256', 'uint256', 'bytes']
  return web3.eth.abi.encodeParameters(types, args)
}

const normalizeLog = log => [log.address, log.topics, log.data]

const serializeReceipt = (web3, receipt) => {
  const args = [receipt.transactionHash, receipt.blockNumber, receipt.status, receipt.logs.map(normalizeLog)]
  const types = ['bytes32', 'uint256', 'bool', '(address,bytes32[],bytes)[]']
  return web3.eth.abi.encodeParameters(types, args)
}

module.exports = {
  serializeBlock,
  serializeTx,
  serializeReceipt
}
