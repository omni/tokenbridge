const MEV_HELPER_ABI = [
  {
    constant: false,
    inputs: [
      {
        name: '_data',
        type: 'bytes'
      }
    ],
    name: 'execute',
    outputs: [],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    constant: false,
    inputs: [
      {
        name: '_gasPrice',
        type: 'uint256'
      },
      {
        name: '_data',
        type: 'bytes'
      }
    ],
    name: 'estimateProfit',
    outputs: [
      {
        name: '',
        type: 'uint256'
      }
    ],
    payable: true,
    stateMutability: 'nonpayable',
    type: 'function'
  }
]

module.exports = {
  MEV_HELPER_ABI
}
