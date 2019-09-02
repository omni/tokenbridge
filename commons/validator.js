require('console.table')
// const path = require('path')
// require('dotenv').config({
//   path: path.join(__dirname, contractsPath, '/deploy/.env')
// })

const commonParameters = [
  {
    name: 'COMMON_HOME_RPC_URL',
    description: 'The home rpc url',
    valuesDescription: 'URL e.g. https://kovan.infura.io/mew',
    valuesCheck: p => typeof p === 'string'
  }
]

const oracleParameters = [
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

  console.log('\nOracle parameters:\n')
  console.table(oracleParameters.map(p => ({ name: p.name, description: p.description })))
}

const check = parameters => {
  const validationErrors = []
  parameters.forEach(p => {
    const value = process.env[p.name]
    if (!p.valuesCheck(value)) {
      validationErrors.push({ name: p.name, expected: p.valuesDescription, value })
    }
  })
  return validationErrors
}

if (process.env.MODE === 'VALIDATE_ORACLE') {
  console.log('\nValidating Oracle parameters...\n')
  const validationErrors = [...check(commonParameters), ...check(oracleParameters)]
  console.table(validationErrors)
  if (validationErrors.length > 0) {
    process.exit(-1)
  }
} else if (process.env.MODE === 'VALIDATE_UI') {
  console.log('this is validate ui')
} else if (process.env.MODE === 'VALIDATE_MONITOR') {
  console.log('this is validate monitor')
} else {
  description()
}
