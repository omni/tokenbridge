require('../env')
const path = require('path')
const BigNumber = require('bignumber.js')
const { redis } = require('./services/redisClient')
const logger = require('./services/logger')
const { sendTx } = require('./tx/sendTx')
const { getNonce, getChainId, getBlock } = require('./tx/web3')
const { addExtraGas, checkHTTPS, watchdog } = require('./utils/utils')
const { EXIT_CODES, EXTRA_GAS_PERCENTAGE, MAX_GAS_LIMIT } = require('./utils/constants')
const { estimateProfit } = require('./events/processAMBCollectedSignaturesMEV')

if (process.argv.length < 3) {
  logger.error('Please check the number of arguments, config file was not provided')
  process.exit(EXIT_CODES.GENERAL_ERROR)
}

const config = require(path.join('../config/', process.argv[2]))

const { web3, mevForeign, validatorAddress } = config

let chainId = 0
let flashbotsProvider

async function initialize() {
  try {
    const checkHttps = checkHTTPS(process.env.ORACLE_ALLOW_HTTP_FOR_RPC, logger)

    web3.currentProvider.urls.forEach(checkHttps(config.id))

    chainId = await getChainId(web3)
    flashbotsProvider = await mevForeign.getFlashbotsProvider(chainId)
    return runMain()
  } catch (e) {
    logger.error(e.message)
    process.exit(EXIT_CODES.GENERAL_ERROR)
  }
}

async function runMain() {
  try {
    if (redis.status === 'ready') {
      if (config.maxProcessingTime) {
        await watchdog(main, config.maxProcessingTime, () => {
          logger.fatal('Max processing time reached')
          process.exit(EXIT_CODES.MAX_TIME_REACHED)
        })
      } else {
        await main()
      }
    }
  } catch (e) {
    logger.error(e)
  }

  setTimeout(runMain, config.pollingInterval)
}

async function main() {
  try {
    const jobs = Object.values(await redis.hgetall(config.mevJobsRedisKey)).map(JSON.parse)
    const totalJobs = jobs.length

    if (totalJobs === 0) {
      logger.debug('Nothing to process')
      return
    }

    const { baseFeePerGas: pendingBaseFee, number: pendingBlockNumber } = await getBlock(web3, 'pending')
    const bestJob = pickBestJob(jobs, pendingBaseFee)

    if (!bestJob) {
      logger.info({ totalJobs, pendingBaseFee }, 'No suitable job was found, waiting for a lower gas price')
      return
    }

    const jobLogger = logger.child({ eventTransactionHash: bestJob.transactionReference })

    const maxProfit = await estimateProfit(
      mevForeign.contract,
      mevForeign.minGasPrice,
      bestJob.executeData,
      bestJob.value
    )

    if (maxProfit === '0') {
      jobLogger.info(`No MEV opportunity found when testing with min gas price ${mevForeign.minGasPrice}, removing job`)
      await redis.hdel(config.mevJobsRedisKey, bestJob.transactionReference)
      return
    }
    jobLogger.info(`Estimated profit of ${maxProfit} when simulating with ${mevForeign.minGasPrice} gas price`)
    bestJob.profit = maxProfit

    if (new BigNumber(pendingBaseFee).gt(mevForeign.minGasPrice)) {
      const profit = await estimateProfit(mevForeign.contract, pendingBaseFee, bestJob.executeData, bestJob.value)
      if (profit === '0') {
        jobLogger.info(
          `No MEV opportunity found when testing with current gas price ${pendingBaseFee}, waiting for lower gas price`
        )
        bestJob.maxFeePerGas = pendingBaseFee
        await redis.hset(config.mevJobsRedisKey, bestJob.transactionReference, JSON.stringify(bestJob))
        return
      }
      jobLogger.info(`Estimated profit of ${profit} when simulating with ${pendingBaseFee} gas price`)
    }

    let gasLimit
    if (typeof bestJob.extraGas === 'number') {
      gasLimit = addExtraGas(bestJob.gasEstimate + bestJob.extraGas, 0, MAX_GAS_LIMIT)
    } else {
      gasLimit = addExtraGas(bestJob.gasEstimate, EXTRA_GAS_PERCENTAGE, MAX_GAS_LIMIT)
    }

    const nonce = await getNonce(web3, validatorAddress)
    jobLogger.info(
      { nonce, fromBlock: pendingBlockNumber, toBlock: pendingBlockNumber + mevForeign.bundlesPerIteration - 1 },
      'Sending MEV bundles'
    )
    const txHash = await sendTx({
      data: bestJob.data,
      nonce,
      value: bestJob.value,
      gasLimit,
      privateKey: config.validatorPrivateKey,
      to: bestJob.to,
      chainId,
      web3,
      gasPriceOptions: {
        maxFeePerGas: bestJob.maxFeePerGas,
        maxPriorityFeePerGas: bestJob.maxPriorityFeePerGas
      },
      mevOptions: {
        provider: flashbotsProvider,
        fromBlock: pendingBlockNumber,
        toBlock: pendingBlockNumber + mevForeign.bundlesPerIteration - 1,
        logger
      }
    })

    jobLogger.info({ txHash }, `Tx generated ${txHash} for event Tx ${bestJob.transactionReference}`)

    await redis.hset(config.mevJobsRedisKey, bestJob.transactionReference, JSON.stringify(bestJob))
    jobLogger.debug(`Finished processing msg`)
  } catch (e) {
    logger.error(e)
  }
}

function pickBestJob(jobs, feePerGas) {
  const feePerGasBN = new BigNumber(feePerGas)
  let best = null
  jobs.forEach(job => {
    if (feePerGasBN.lt(job.maxFeePerGas) && (!best || new BigNumber(best.profit).lt(job.profit))) {
      best = job
    }
  })
  return best
}

initialize()
