const cTable = require('console.table')

const commonParameters = [
  {
    name: 'BRIDGE_MODE',
    description: 'The bridge mode',
    valuesDescription: 'NATIVE_TO_ERC / ERC_TO_ERC / ERC_TO_NATIVE',
    valuesCheck: p => p === 'NATIVE_TO_ERC' || p === 'NATIVE_TO_ERC' || p === 'NATIVE_TO_ERC'
  }
]

const description = () => {
  console.log('\nCommon parameters:\n')
  console.table(commonParameters.map(p => ({ name: p.name, description: p.description })))
  console.log('This is the description')
}

if (process.env.MODE === 'VALIDATE_ORACLE') {
  console.log('this is validate oracle')
} else if (process.env.MODE === 'VALIDATE_UI') {
  console.log('this is validate ui')
} else if (process.env.MODE === 'VALIDATE_MONITOR') {
  console.log('this is validate monitor')
} else {
  description()
}
