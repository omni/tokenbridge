const { toWei } = require('web3').utils

async function sendTx({ privateKey, data, nonce, gasPrice, amount, gasLimit, to, chainId, web3 }) {
  const serializedTx = await web3.eth.accounts.signTransaction(
    {
      nonce: Number(nonce),
      chainId,
      to,
      data,
      value: toWei(amount),
      gasPrice,
      gas: gasLimit
    },
    `0x${privateKey}`
  )

  return new Promise((res, rej) =>
    web3.eth
      .sendSignedTransaction(serializedTx.rawTransaction)
      .once('transactionHash', res)
      .once('error', rej)
  )
}

module.exports = {
  sendTx
}
