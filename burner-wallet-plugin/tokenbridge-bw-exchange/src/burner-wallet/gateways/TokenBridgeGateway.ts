import { Gateway } from '@burner-wallet/core/gateways'
import Web3 from 'web3'

export default class TokenBridgeGateway extends Gateway {
  private readonly providers: object
  private readonly providerStrings: { [id: string]: string }
  constructor() {
    super()
    this.providerStrings = {
      '61': `https://www.ethercluster.com/etc`,
      '77': 'https://sokol.poa.network',
      '99': 'https://core.poa.network',
      '181': 'https://quorum-rpc.tokenbridge.net'
    }
    this.providers = {}
  }

  isAvailable() {
    return true
  }

  getNetworks() {
    return ['61', '77', '99', '181']
  }

  _provider(network) {
    if (!this.providers[network]) {
      this._makeProvider(network)
    }
    return this.providers[network]
  }

  _makeProvider(network) {
    if (!this.providerStrings[network]) {
      throw new Error(`Network ${network} not supported by TokenBridgeGateway`)
    }

    this.providers[network] = new Web3.providers.HttpProvider(this.providerStrings[network])
  }

  send(network, payload) {
    return new Promise((resolve, reject) => {
      if (this.getNetworks().indexOf(network) === -1) {
        return reject(new Error('TokenBridgeGateway does not support this network'))
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
