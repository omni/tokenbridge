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
  },
  {
    constant: false,
    inputs: [
      {
        name: '',
        type: 'address'
      },
      {
        name: '',
        type: 'uint256'
      }
    ],
    name: 'relayTokens',
    outputs: [],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        name: '',
        type: 'address'
      },
      {
        indexed: true,
        name: '',
        type: 'address'
      },
      {
        indexed: false,
        name: '',
        type: 'uint256'
      }
    ],
    name: 'Transfer',
    type: 'event'
  }
]
