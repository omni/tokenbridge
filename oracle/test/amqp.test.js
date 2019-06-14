const { expect } = require('chai')
const { generateRetry, connection } = require('../src/services/amqpClient')

connection.close()

describe('generateRetry', () => {
  let channel
  let channelWrapper
  const data = [{}]
  const queueName = 'test-queue'
  const deadLetterExchange = `${queueName}-retry`
  beforeEach(() => {
    channel = {
      assertQueue(queue, options) {
        this.queue = queue
        this.options = options
      }
    }
    channelWrapper = {
      sendToQueue(queue, data, options) {
        this.queue = queue
        this.data = data
        this.options = options
      }
    }
  })
  it('should assert new queue and push the message', async () => {
    // Given
    const msgRetries = 0
    const delay = 1000

    // When
    await generateRetry({
      data,
      msgRetries,
      channelWrapper,
      channel,
      queueName,
      deadLetterExchange
    })

    // Then
    expect(channel.queue).to.equal(`${queueName}-retry-${delay}`)
    expect(channel.options.messageTtl).to.equal(delay)
    expect(channel.options.expires).to.equal(delay * 10)
    expect(channelWrapper.options.headers['x-retries']).to.equal(msgRetries + 1)
  })
  it('should increment delay on retries', async () => {
    let msgRetries = 1
    let delay = 2000

    await generateRetry({
      data,
      msgRetries,
      channelWrapper,
      channel,
      queueName,
      deadLetterExchange
    })

    expect(channel.queue).to.equal(`${queueName}-retry-${delay}`)
    expect(channel.options.messageTtl).to.equal(delay)
    expect(channel.options.expires).to.equal(delay * 10)
    expect(channelWrapper.options.headers['x-retries']).to.equal(msgRetries + 1)

    msgRetries = 2
    delay = 3000

    await generateRetry({
      data,
      msgRetries,
      channelWrapper,
      channel,
      queueName,
      deadLetterExchange
    })

    expect(channel.queue).to.equal(`${queueName}-retry-${delay}`)
    expect(channel.options.messageTtl).to.equal(delay)
    expect(channel.options.expires).to.equal(delay * 10)
    expect(channelWrapper.options.headers['x-retries']).to.equal(msgRetries + 1)

    msgRetries = 4
    delay = 8000

    await generateRetry({
      data,
      msgRetries,
      channelWrapper,
      channel,
      queueName,
      deadLetterExchange
    })

    expect(channel.queue).to.equal(`${queueName}-retry-${delay}`)
    expect(channel.options.messageTtl).to.equal(delay)
    expect(channel.options.expires).to.equal(delay * 10)
    expect(channelWrapper.options.headers['x-retries']).to.equal(msgRetries + 1)
  })
  it('should have a max delay of 60 seconds', async () => {
    let msgRetries = 10
    let delay = 60000

    await generateRetry({
      data,
      msgRetries,
      channelWrapper,
      channel,
      queueName,
      deadLetterExchange
    })

    expect(channel.queue).to.equal(`${queueName}-retry-${delay}`)
    expect(channel.options.messageTtl).to.equal(delay)
    expect(channel.options.expires).to.equal(delay * 10)
    expect(channelWrapper.options.headers['x-retries']).to.equal(msgRetries + 1)

    msgRetries = 15
    delay = 60000

    await generateRetry({
      data,
      msgRetries,
      channelWrapper,
      channel,
      queueName,
      deadLetterExchange
    })

    expect(channel.queue).to.equal(`${queueName}-retry-${delay}`)
    expect(channel.options.messageTtl).to.equal(delay)
    expect(channel.options.expires).to.equal(delay * 10)
    expect(channelWrapper.options.headers['x-retries']).to.equal(msgRetries + 1)

    msgRetries = 20
    delay = 60000

    await generateRetry({
      data,
      msgRetries,
      channelWrapper,
      channel,
      queueName,
      deadLetterExchange
    })

    expect(channel.queue).to.equal(`${queueName}-retry-${delay}`)
    expect(channel.options.messageTtl).to.equal(delay)
    expect(channel.options.expires).to.equal(delay * 10)
    expect(channelWrapper.options.headers['x-retries']).to.equal(msgRetries + 1)
  })
})
