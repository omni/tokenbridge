module.exports = function logger(name) {
  let lastlog = 0

  function log(...args) {
    const now = new Date()
    console.log(now.toISOString(), `(+${lastlog ? now.getTime() - lastlog : 0}ms)`, `[${name}]`, ...args)
    lastlog = now.getTime()
  }

  function error(...args) {
    const now = new Date()
    console.error(now.toISOString(), `[${name}]`, ...args)
  }

  let dbg
  if (process.env.DEBUG) {
    dbg = (...args) => {
      log(...args)
    }
  } else {
    dbg = () => {}
  }

  return {
    log,
    error,
    debug: dbg
  }
}
