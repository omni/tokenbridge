async function sendTx(opts) {
  const { privateKey, data, nonce, gasPrice, gasPriceOptions, value, gasLimit, to, chainId, web3, mevOptions } = opts
  const gasOpts = gasPriceOptions || { gasPrice }
  const serializedTx = await web3.eth.accounts.signTransaction(
    {
      nonce: Number(nonce),
      chainId,
      to,
      data,
      value,
      gas: gasLimit,
      ...gasOpts
    },
    privateKey
  )

  if (!mevOptions) {
    return new Promise((res, rej) =>
      web3.eth
        .sendSignedTransaction(serializedTx.rawTransaction)
        .once('transactionHash', res)
        .once('error', rej)
    )
  }

  mevOptions.logger.debug(
    { rawTx: serializedTx.rawTransaction, txHash: serializedTx.transactionHash },
    'Signed MEV helper transaction'
  )

  for (let blockNumber = mevOptions.fromBlock; blockNumber <= mevOptions.toBlock; blockNumber++) {
    mevOptions.logger.debug({ txHash: serializedTx.transactionHash, blockNumber }, 'Sending MEV bundle transaction')
    await mevOptions.provider.sendRawBundle([serializedTx.rawTransaction], blockNumber)
  }
  return Promise.resolve(serializedTx.transactionHash)
}

module.exports = {
  sendTx
}
