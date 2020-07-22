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
    constant: true,
    inputs: [],
    name: 'getBridgeMode',
    outputs: [
      {
        name: '',
        type: 'bytes4'
      }
    ],
    payable: false,
    stateMutability: 'pure',
    type: 'function'
  }
]
