import { HTTPGateway } from '@burner-wallet/core/gateways'

export default class EtcGateway extends HTTPGateway {
  constructor() {
    super('https://www.ethercluster.com/etc', '61')
  }
}
