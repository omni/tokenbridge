import React from 'react'
import yn from './utils/yn'
import { Authority } from './Authority'
import { Configuration } from './Configuration'
import { inject, observer } from 'mobx-react'
import { isMediatorMode } from 'commons'
import { formatDistanceStrict } from 'date-fns'
import { DataBlock } from './DataBlock'
import { getDateColor } from './utils/date'

@inject('RootStore')
@observer
export class StatusPage extends React.Component {
  render() {
    const { homeStore, foreignStore, web3Store, bridgeMode } = this.props.RootStore
    const isHome = web3Store.isSelectedNetwork(web3Store.homeNet.id)
    const requiredSignatures = isHome ? homeStore.requiredSignatures : foreignStore.requiredSignatures
    const authorities = isHome ? homeStore.validatorsCount : foreignStore.validatorsCount
    const symbol = isHome ? homeStore.symbol : foreignStore.symbol
    const maxSingleDeposit = isHome ? homeStore.maxPerTx : foreignStore.maxPerTx
    const maxTotalBalance = isHome ? homeStore.maxCurrentDeposit : foreignStore.maxCurrentDeposit
    const validatorsList = isHome ? homeStore.validators : foreignStore.validators
    const { REACT_APP_UI_HOME_WITHOUT_EVENTS: HOME, REACT_APP_UI_FOREIGN_WITHOUT_EVENTS: FOREIGN } = process.env
    const withoutEvents = web3Store.isSelectedNetwork(web3Store.homeNet.id) ? yn(HOME) : yn(FOREIGN)
    const displayLatestOperations =
      isMediatorMode(bridgeMode) && homeStore.lastEventRelayedOnHome > 0 && foreignStore.lastEventRelayedOnForeign > 0

    let fromHomeToForeignText
    let fromForeignToHomeText
    let lastEventOnHome
    let lastEventOnForeign
    let lastEventOnHomeColor
    let lastEventOnForeignColor
    if (displayLatestOperations) {
      fromHomeToForeignText = `From ${homeStore.networkName} To ${foreignStore.networkName}`
      fromForeignToHomeText = `From ${foreignStore.networkName} To ${homeStore.networkName}`

      const lastDateOnHome = new Date(0).setUTCSeconds(homeStore.lastEventRelayedOnHome)
      lastEventOnHome = formatDistanceStrict(lastDateOnHome, new Date(), {
        addSuffix: true
      })
      lastEventOnHomeColor = getDateColor(lastDateOnHome)

      const lastDateOnForeign = new Date(0).setUTCSeconds(foreignStore.lastEventRelayedOnForeign)
      lastEventOnForeign = formatDistanceStrict(lastDateOnForeign, new Date(), {
        addSuffix: true
      })
      lastEventOnForeignColor = getDateColor(lastDateOnForeign)
    }
    return (
      <div className="status-page">
        <div className="status-left-container" />
        <div className="status-page-container">
          <div className="status-configuration-container">
            <span className="status-configuration-title status-title">Configuration</span>
            <Configuration
              requiredSignatures={requiredSignatures}
              authorities={authorities}
              symbol={symbol}
              maxSingleDeposit={maxSingleDeposit}
              maxTotalBalance={maxTotalBalance}
            />
          </div>
          {withoutEvents || authorities.toString() === '0' ? null : (
            <div className="status-authorities-container">
              <span className="status-authorities-title status-title">Authorities</span>
              <div className="status-authorities-data">
                {validatorsList.map((validator, i) => (
                  <Authority key={validator} address={validator} number={i + 1} logoIndex={i % 3} />
                ))}
              </div>
            </div>
          )}
          {displayLatestOperations && (
            <div className="status-configuration-container">
              <span className="status-configuration-title status-title">Latest Operations</span>
              <div className="status-configuration-data">
                <DataBlock
                  description={fromHomeToForeignText}
                  value={lastEventOnForeign}
                  type=""
                  valueClass={lastEventOnHomeColor}
                />
                <DataBlock
                  description={fromForeignToHomeText}
                  value={lastEventOnHome}
                  type=""
                  valueClass={lastEventOnForeignColor}
                />
              </div>
            </div>
          )}
        </div>
        <div className="pattern-background">
          <div className="pattern-background-image" />
        </div>
      </div>
    )
  }
}
