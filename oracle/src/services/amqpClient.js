require('../../env')
const connection = require('amqp-connection-manager').connect(process.env.QUEUE_URL)
const logger = require('./logger')
const { getRetrySequence } = require('../utils/utils')

connection.on('connect', () => {
  logger.info('Connected to amqp Broker')
})

connection.on('disconnect', () => {
  logger.error('Disconnected from amqp Broker')
})

function connectWatcherToQueue({ queueName, cb }) {
  const channelWrapper = connection.createChannel({
    json: true,
    setup(channel) {
      return Promise.all([channel.assertQueue(queueName, { durable: true })])
    }
  })

  const sendToQueue = data => channelWrapper.sendToQueue(queueName, data, { persistent: true })

  cb({ sendToQueue, channel: channelWrapper })
}

function connectSenderToQueue({ queueName, cb }) {
  const deadLetterExchange = `${queueName}-retry`

  const channelWrapper = connection.createChannel({
    json: true
  })

  channelWrapper.addSetup(channel => {
    return Promise.all([
      channel.assertExchange(deadLetterExchange, 'fanout', { durable: true }),
      channel.assertQueue(queueName, { durable: true }),
      channel.bindQueue(queueName, deadLetterExchange),
      channel.prefetch(1),
      channel.consume(queueName, msg =>
        cb({
          msg,
          channel: channelWrapper,
          ackMsg: job => channelWrapper.ack(job),
          nackMsg: job => channelWrapper.nack(job, false, true),
          scheduleForRetry: async (data, msgRetries = 0) => {
            await generateRetry({
              data,
              msgRetries,
              channelWrapper,
              channel,
              queueName,
              deadLetterExchange
            })
          }
        })
      )
    ])
  })
}

async function generateRetry({
  data,
  msgRetries,
  channelWrapper,
  channel,
  queueName,
  deadLetterExchange
}) {
  const retries = msgRetries + 1
  const delay = getRetrySequence(retries) * 1000
  const retryQueue = `${queueName}-retry-${delay}`
  await channel.assertQueue(retryQueue, {
    durable: true,
    deadLetterExchange,
    messageTtl: delay,
    expires: delay * 10
  })
  await channelWrapper.sendToQueue(retryQueue, data, {
    persistent: true,
    headers: { 'x-retries': retries }
  })
}

module.exports = {
  connectWatcherToQueue,
  connectSenderToQueue,
  connection,
  generateRetry
}
