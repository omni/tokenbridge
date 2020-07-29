const waitUntil = async (predicate, step = 100, timeout = 20000) => {
  const stopTime = Date.now() + timeout
  while (Date.now() <= stopTime) {
    const result = await predicate()
    if (result) {
      return result
    }
    await new Promise(resolve => setTimeout(resolve, step)) // sleep
  }
  throw new Error(`waitUntil timed out after ${timeout} ms`)
}

module.exports = {
  waitUntil
}
