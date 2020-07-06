import { ConfirmationParam } from '../hooks/useMessageConfirmations'

class ValidatorsCache {
  private readonly store: { [key: string]: boolean }
  private readonly dataStore: { [key: string]: ConfirmationParam }

  constructor() {
    this.store = {}
    this.dataStore = {}
  }

  get(key: string) {
    return this.store[key]
  }

  set(key: string, value: boolean) {
    this.store[key] = value
  }

  getData(key: string) {
    return this.dataStore[key]
  }

  setData(key: string, value: ConfirmationParam) {
    this.dataStore[key] = value
  }
}

export default new ValidatorsCache()
