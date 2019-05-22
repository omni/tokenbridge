import React from 'react'
import { inject, observer } from 'mobx-react'
import { WalletIcon } from './menu-icons/WalletIcon'

@inject('RootStore')
@observer
export class Wallet extends React.Component {
  render() {
    const { web3Store, homeStore, foreignStore, alertStore } = this.props.RootStore
    const isHome = web3Store.metamaskNet.id.toString() === web3Store.homeNet.id.toString()
    const address = web3Store.defaultAccount.address
    const explorerAddressUrl = isHome
      ? homeStore.getExplorerAddressUrl(address)
      : foreignStore.getExplorerAddressUrl(address)
    const completed = isHome
      ? homeStore.getDailyQuotaCompleted()
      : foreignStore.getDailyQuotaCompleted()
    const width = `${completed}%`

    const wallet =
      web3Store.defaultAccount.address !== '' && web3Store.defaultAccount.address !== undefined ? (
        <a href={explorerAddressUrl} target="_blank" className="wallet-text wallet-link">
          {web3Store.defaultAccount.address.slice(0, 17).concat('...')}
        </a>
      ) : (
        <span className="wallet-text">
          Login with <span className="wallet-text-metamask">wallet</span>
        </span>
      )

    return (
      <div
        className="header-wallet"
        onMouseEnter={() => alertStore.setShowDailyQuotaInfo(true)}
        onMouseLeave={() => alertStore.setShowDailyQuotaInfo(false)}
      >
        <div className="wallet-container">
          <span className="wallet-icon">{<WalletIcon />}</span>
          {wallet}
        </div>
        <div className="daily-quota-container">
          {web3Store.metamaskNet.id && <div className="daily-quota-progress" style={{ width }} />}
        </div>
      </div>
    )
  }
}
