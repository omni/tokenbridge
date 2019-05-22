import React from 'react'
import { inject, observer } from 'mobx-react'
import numeral from 'numeral'

@inject('RootStore')
@observer
export class DailyQuotaModal extends React.Component {
  state = {
    left: 0,
    top: 0
  }

  componentDidMount() {
    this.getPosition()
  }

  getPosition = () => {
    const offsetsElement = document.getElementsByClassName('header-wallet')
    if (offsetsElement.length > 0) {
      const offsets = offsetsElement[0].getBoundingClientRect()
      const height = offsets.height
      const left = offsets.left
      this.setState({ left, top: height + 20 })
    } else {
      setTimeout(this.getPosition, 100)
    }
  }

  render() {
    const { web3Store, homeStore, foreignStore } = this.props.RootStore
    const { left, top } = this.state

    const isHome = web3Store.metamaskNet.id.toString() === web3Store.homeNet.id.toString()
    const value = isHome ? homeStore.maxCurrentDeposit : foreignStore.maxCurrentDeposit
    const limit = isHome ? homeStore.maxPerTx : foreignStore.maxPerTx
    const from = isHome ? homeStore.symbol : foreignStore.symbol
    const to = isHome ? foreignStore.symbol : homeStore.symbol
    const networkNameFrom = isHome ? homeStore.networkName : foreignStore.networkName
    const networkNameTo = isHome ? foreignStore.networkName : homeStore.networkName
    const description =
      limit && limit !== '0'
        ? `${numeral(value).format('0,0.0', Math.floor)} ${from} on ${networkNameFrom + ' '}
            remaining for transfer to ${to + ' '}
            on ${networkNameTo}`
        : `No limit configured`
    return (
      <div className="daily-quota-modal-container">
        <div className="daily-quota-modal" style={{ left, top }}>
          <div className="modal-container">
            <span className="daily-quota-title">Daily Quota</span>
            <span className="daily-quota-description">{description}</span>
          </div>
        </div>
      </div>
    )
  }
}
