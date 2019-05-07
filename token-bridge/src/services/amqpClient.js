require('dotenv').config()
const connection = require('amqp-connection-manager').connect(process.env.QUEUE_URL)
const logger = require('./logger')

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
  const channelWrapper = connection.createChannel({
    json: true
  })

  channelWrapper.addSetup(channel => {
    return Promise.all([
      channel.assertQueue(queueName, { durable: true }),
      channel.prefetch(1),
      channel.consume(queueName, msg =>
        cb({
          msg,
          channel: channelWrapper,
          ackMsg: job => channelWrapper.ack(job),
          nackMsg: job => channelWrapper.nack(job, false, true),
          sendToQueue: data => channelWrapper.sendToQueue(queueName, data, { persistent: true })
        })
      )
    ])
  })
}

module.exports = {
  connectWatcherToQueue,
  connectSenderToQueue,
  connection
}
