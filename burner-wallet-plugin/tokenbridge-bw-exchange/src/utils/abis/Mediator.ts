export default [
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        name: 'recipient',
        type: 'address'
      },
      {
        indexed: false,
        name: 'value',
        type: 'uint256'
      },
      {
        indexed: true,
        name: 'messageId',
        type: 'bytes32'
      }
    ],
    name: 'TokensBridged',
    type: 'event'
  },
  {
    constant: true,
    inputs: [],
    name: 'feeManagerContract',
    outputs: [
      {
        name: '',
        type: 'address'
      }
    ],
    payable: false,
    stateMutability: 'view',
    type: 'function'
  }
]
