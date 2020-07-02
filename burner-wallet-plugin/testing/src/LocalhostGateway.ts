import { Gateway } from '@burner-wallet/core/gateways'
import Web3 from 'web3'

export default class LocalhostGateway extends Gateway {
  private readonly providers: object
  private readonly providerStrings: { [id: string]: string }
  constructor() {
    super()
    this.providerStrings = {
      '111': 'http://localhost:8545',
      '1337': 'http://localhost:8546'
    }
    this.providers = {}
  }

  isAvailable() {
    return true
  }

  getNetworks() {
    return ['111', '1337']
  }

  _provider(network) {
    if (!this.providers[network]) {
      this._makeProvider(network)
    }
    return this.providers[network]
  }

  _makeProvider(network) {
    if (!this.providerStrings[network]) {
      throw new Error(`Network ${network} not supported by LocalhostGateway`)
    }

    this.providers[network] = new Web3.providers.HttpProvider(this.providerStrings[network])
  }

  send(network, payload) {
    return new Promise((resolve, reject) => {
      if (this.getNetworks().indexOf(network) === -1) {
        return reject(new Error('LocalhostGateway does not support this network'))
      }

      this._provider(network).send(payload, (err, response) => {
        if (err) {
          return reject(err)
        }
        return resolve(response.result)
      })
    })
  }
}
