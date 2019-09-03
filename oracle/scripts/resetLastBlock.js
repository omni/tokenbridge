require('../env')
const Redis = require('ioredis')
const { id } = require('../config/base.config')
const { EXIT_CODES } = require('../src/utils/constants')

const redis = new Redis(process.env.ORACLE_REDIS_URL)

redis.on('error', () => {
  logError('Error: Cannot connect to redis')
})

if (process.argv.length < 4) {
  logError(
    'Please provide process key and new block value. Example:' +
      '\n  signature-request 12345 ' +
      '\n  collected-signatures 12345 ' +
      '\n  affirmation-request 12345'
  )
}

function logError(message) {
  console.log(message)
  process.exit(EXIT_CODES.GENERAL_ERROR)
}

function getRedisKey(name) {
  return `${id}-${name}:lastProcessedBlock`
}

async function main() {
  try {
    const processName = process.argv[2]
    const rawBlockValue = process.argv[3]

    const newBlockValue = Number(rawBlockValue)
    if (!Number.isInteger(newBlockValue)) {
      logError('Expecting new block value to be an integer!')
    }

    const lastBlockRedisKey = getRedisKey(processName)

    const value = await redis.get(lastBlockRedisKey)

    if (!value) {
      logError(
        'Error: Process key not found on redis. Please provide one of the following:' +
          '\n  signature-request' +
          '\n  collected-signatures' +
          '\n  affirmation-request'
      )
    }

    await redis.set(lastBlockRedisKey, newBlockValue)

    console.log(`${processName} last block updated to ${newBlockValue}`)

    redis.disconnect()
  } catch (e) {
    console.log(e)
  }
}

main()
