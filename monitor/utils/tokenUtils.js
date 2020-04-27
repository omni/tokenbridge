// https://etherscan.io/tx/0xd0c3c92c94e05bc71256055ce8c4c993e047f04e04f3283a04e4cb077b71f6c6
const blockNumberHalfDuplexDisabled = 9884448

/**
 * Returns true if the event was before the bridge stopped supporting half duplex transfers.
 */
async function transferBeforeES(event) {
  return event.blockNumber < blockNumberHalfDuplexDisabled
}

async function filterTransferBeforeES(array) {
  const newArray = []
  // Iterate events from newer to older
  for (let i = array.length - 1; i >= 0; i--) {
    const beforeES = await transferBeforeES(array[i])
    if (beforeES) {
      // add element to first position so the new array will have the same order
      newArray.unshift(array[i])
    }
  }
  return newArray
}

module.exports = {
  filterTransferBeforeES,
  blockNumberHalfDuplexDisabled
}
