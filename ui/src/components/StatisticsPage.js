import React from 'react'
import yn from './utils/yn'
import { BRIDGE_MODES } from '../stores/utils/bridgeMode'
import { BridgeStatistics } from './index'
import { Redirect } from 'react-router'
import { TransactionsStatistics } from './TransactionsStatistics'
import { inject, observer } from 'mobx-react'
import { FeeStatistics } from './FeeStatistics'

@inject('RootStore')
@observer
export class StatisticsPage extends React.Component {
  render() {
    const { homeStore, foreignStore, bridgeMode, web3Store } = this.props.RootStore
    const isNativeToErc = bridgeMode === BRIDGE_MODES.NATIVE_TO_ERC
    const leftTitle = isNativeToErc ? 'Deposits' : 'Withdraws'
    const rightTitle = isNativeToErc ? 'Withdraws' : 'Deposits'
    const {
      REACT_APP_HOME_WITHOUT_EVENTS: HOME,
      REACT_APP_FOREIGN_WITHOUT_EVENTS: FOREIGN
    } = process.env
    const withoutEvents =
      web3Store.metamaskNet.id === web3Store.homeNet.id.toString() ? yn(HOME) : yn(FOREIGN)

    return withoutEvents ? (
      <Redirect to="/" />
    ) : (
      <div className="statistics-page">
        <div className="statistics-left-container" />
        <div className="statistics-page-container">
          <div className="statistics-bridge-container">
            <span className="statistics-bridge-title statistics-title">Bridge Statistics</span>
            <BridgeStatistics
              users={homeStore.statistics.finished ? homeStore.statistics.users.size : ''}
              totalBridged={
                homeStore.statistics.finished ? homeStore.statistics.totalBridged.toString() : ''
              }
              homeBalance={homeStore.balance}
              homeSymbol={homeStore.symbol}
              homeNativeSupplyTitle={isNativeToErc}
              foreignSymbol={foreignStore.symbol}
              foreignSupply={foreignStore.totalSupply}
            />
          </div>
          {homeStore.depositFeeCollected.finished &&
            homeStore.withdrawFeeCollected.finished &&
            (homeStore.depositFeeCollected.shouldDisplay ||
              homeStore.withdrawFeeCollected.shouldDisplay) && (
              <FeeStatistics
                depositFeeCollected={homeStore.depositFeeCollected}
                withdrawFeeCollected={homeStore.withdrawFeeCollected}
              />
            )}
          <div className="statistics-transaction-container">
            <div className="statistics-deposit-container">
              <span className="statistics-deposit-title statistics-title">Tokens {leftTitle}</span>
              <TransactionsStatistics
                txNumber={homeStore.statistics.finished ? homeStore.statistics.deposits : ''}
                type={foreignStore.symbol}
                value={homeStore.statistics.finished ? homeStore.statistics.depositsValue : ''}
              />
            </div>
            <div className="statistics-withdraw-container">
              <span className="statistics-withdraw-title statistics-title">
                Tokens {rightTitle}
              </span>
              <TransactionsStatistics
                txNumber={homeStore.statistics.finished ? homeStore.statistics.withdraws : ''}
                type={foreignStore.symbol}
                value={homeStore.statistics.finished ? homeStore.statistics.withdrawsValue : ''}
              />
            </div>
          </div>
        </div>
        <div className="pattern-background">
          <div className="pattern-background-image" />
        </div>
      </div>
    )
  }
}
