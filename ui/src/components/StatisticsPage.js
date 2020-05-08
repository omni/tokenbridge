import React from 'react'
import yn from './utils/yn'
import { BRIDGE_MODES } from '../../../commons'
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
    const statisticsReady = homeStore.statistics.finished && foreignStore.statistics.finished
    const isNativeToErc = bridgeMode === BRIDGE_MODES.NATIVE_TO_ERC
    const leftTitle = isNativeToErc ? 'Deposits' : 'Withdrawals'
    const rightTitle = isNativeToErc ? 'Withdrawals' : 'Deposits'
    const { REACT_APP_UI_HOME_WITHOUT_EVENTS: HOME, REACT_APP_UI_FOREIGN_WITHOUT_EVENTS: FOREIGN } = process.env
    const withoutEvents = web3Store.metamaskNet.id === web3Store.homeNet.id.toString() ? yn(HOME) : yn(FOREIGN)

    return withoutEvents ? (
      <Redirect to="/" />
    ) : (
      <div className="statistics-page">
        <div className="statistics-left-container" />
        <div className="statistics-page-container">
          <div className="statistics-bridge-container">
            <span className="statistics-bridge-title statistics-title">Bridge Statistics</span>
            <BridgeStatistics
              users={statisticsReady ? homeStore.statistics.users.size : ''}
              totalBridged={statisticsReady ? homeStore.statistics.totalBridged.toString() : ''}
              homeBalance={homeStore.balance}
              homeSymbol={homeStore.symbol}
              homeNativeSupplyTitle={isNativeToErc}
              foreignSymbol={foreignStore.symbol}
              foreignSupply={foreignStore.totalSupply}
            />
          </div>
          {homeStore.depositFeeCollected.finished &&
            homeStore.withdrawFeeCollected.finished &&
            (homeStore.depositFeeCollected.shouldDisplay || homeStore.withdrawFeeCollected.shouldDisplay) && (
              <FeeStatistics
                depositFeeCollected={homeStore.depositFeeCollected}
                withdrawFeeCollected={homeStore.withdrawFeeCollected}
              />
            )}
          <div className="statistics-transaction-container">
            <div className="statistics-deposit-container">
              <span className="statistics-deposit-title statistics-title">Tokens {leftTitle}</span>
              <TransactionsStatistics
                txNumber={statisticsReady ? homeStore.statistics.deposits : ''}
                type={foreignStore.symbol}
                value={statisticsReady ? homeStore.statistics.depositsValue : ''}
              />
            </div>
            <div className="statistics-withdraw-container">
              <span className="statistics-withdraw-title statistics-title">Tokens {rightTitle}</span>
              <TransactionsStatistics
                txNumber={statisticsReady ? homeStore.statistics.withdrawals : ''}
                type={foreignStore.symbol}
                value={statisticsReady ? homeStore.statistics.withdrawalsValue : ''}
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
