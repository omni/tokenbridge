export const processLargeArrayAsync = (array, fn, endFn, maxTimePerChunk = 16) => {
  let index = 0

  const doChunk = () => {
    const startTime = now()
    while (index < array.length && now() - startTime <= maxTimePerChunk) {
      fn(array[index])
      ++index
    }
    if (index < array.length) {
      setTimeout(doChunk, 0)
    } else if (endFn) {
      endFn()
    }
  }

  doChunk()
}

function now() {
  return new Date().getTime()
}
