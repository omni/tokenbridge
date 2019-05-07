module.exports = async (array, f) => {
  const errors = []

  for (let i = 0; i < array.length; i++) {
    try {
      const res = await f(array[i])
      return [res, i]
    } catch (e) {
      errors.push(e)
    }
  }

  return Promise.reject(errors)
}
