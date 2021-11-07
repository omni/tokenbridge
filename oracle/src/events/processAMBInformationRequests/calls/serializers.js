const { ZERO_ADDRESS } = require('../../../../../commons')

const serializeBlock = (web3, block) => {
  const args = [
    block.number,
    block.hash,
    block.miner,
    block.gasUsed,
    block.gasLimit,
    block.parentHash,
    block.receiptsRoot,
    block.stateRoot,
    block.transactionsRoot,
    block.timestamp,
    block.difficulty,
    block.totalDifficulty
  ]
  const type = '(uint256,bytes32,address,uint256,uint256,bytes32,bytes32,bytes32,bytes32,uint256,uint256,uint256)'
  return web3.eth.abi.encodeParameter(type, args)
}

const serializeTx = (web3, tx) => {
  const args = [
    tx.hash,
    tx.blockNumber,
    tx.blockHash,
    tx.transactionIndex,
    tx.from,
    tx.to || ZERO_ADDRESS,
    tx.value,
    tx.nonce,
    tx.gas,
    tx.gasPrice,
    tx.input
  ]
  const type = '(bytes32,uint256,bytes32,uint256,address,address,uint256,uint256,uint256,uint256,bytes)'
  return web3.eth.abi.encodeParameter(type, args)
}

const normalizeLog = log => [log.address, log.topics, log.data]

const serializeReceipt = (web3, receipt) => {
  const args = [
    receipt.transactionHash,
    receipt.blockNumber,
    receipt.blockHash,
    receipt.transactionIndex,
    receipt.from,
    receipt.to || ZERO_ADDRESS,
    receipt.gasUsed,
    receipt.status,
    receipt.logs.map(normalizeLog)
  ]
  const type = '(bytes32,uint256,bytes32,uint256,address,address,uint256,bool,(address,bytes32[],bytes)[])'
  return web3.eth.abi.encodeParameter(type, args)
}

module.exports = {
  serializeBlock,
  serializeTx,
  serializeReceipt
}
