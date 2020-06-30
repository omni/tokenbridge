const initialValue = {
  chainId: 0,
  RequiredBlockConfirmationChanged: [],
  validatorAddress: '',
  RequiredSignaturesChanged: [],
  ValidatorAdded: [],
  ValidatorRemoved: []
}

export interface SnapshotEvent {
  blockNumber: number
  returnValues: any
}

export interface Snapshot {
  chainId: number
  RequiredBlockConfirmationChanged: SnapshotEvent[]
  validatorAddress: string
  RequiredSignaturesChanged: SnapshotEvent[]
  ValidatorAdded: SnapshotEvent[]
  ValidatorRemoved: SnapshotEvent[]
}

export class SnapshotProvider {
  private data: Snapshot

  constructor(side: string) {
    let data = initialValue
    try {
      data = require(`../snapshots/${side}.json`)
    } catch (e) {
      console.log('Snapshot not found')
    }
    this.data = data
  }

  chainId() {
    return this.data.chainId
  }

  validatorAddress() {
    return this.data.validatorAddress
  }
}

export const homeSnapshotProvider = new SnapshotProvider('home')
export const foreignSnapshotProvider = new SnapshotProvider('foreign')
