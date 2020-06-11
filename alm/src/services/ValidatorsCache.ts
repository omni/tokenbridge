class ValidatorsCache {
  private readonly store: { [key: string]: boolean }

  constructor() {
    this.store = {}
  }

  get(key: string) {
    return this.store[key]
  }

  set(key: string, value: boolean) {
    this.store[key] = value
  }
}

export default new ValidatorsCache()
