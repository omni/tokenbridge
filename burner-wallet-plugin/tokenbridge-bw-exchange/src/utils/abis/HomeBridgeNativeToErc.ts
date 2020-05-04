export default [
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        name: 'recipient',
        type: 'address'
      },
      {
        indexed: false,
        name: 'value',
        type: 'uint256'
      },
      {
        indexed: false,
        name: 'transactionHash',
        type: 'bytes32'
      }
    ],
    name: 'AffirmationCompleted',
    type: 'event'
  },
  {
    constant: true,
    inputs: [],
    name: 'deployedAtBlock',
    outputs: [
      {
        name: '',
        type: 'uint256'
      }
    ],
    payable: false,
    stateMutability: 'view',
    type: 'function'
  },
  {
    constant: true,
    inputs: [],
    name: 'getForeignFee',
    outputs: [
      {
        name: '',
        type: 'uint256'
      }
    ],
    payable: false,
    stateMutability: 'view',
    type: 'function'
  }
]
