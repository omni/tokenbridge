import React from 'react'
import numeral from 'numeral'
import { InfoIcon } from './icons/InfoIcon'

export const BridgeNetwork = ({ balance, currency, isHome, networkSubtitle, networkTitle, showModal, side }) => {
  const { REACT_APP_UI_STYLES } = process.env
  const containerName = isHome ? 'home' : 'foreign'
  const formattedBalance = isNaN(numeral(balance).format('0.00', Math.floor))
    ? numeral(0).format('0,0.00', Math.floor)
    : numeral(balance).format('0,0.00', Math.floor)

  const showMore = () =>
    isHome ? (
      <div className="bridge-network-data" onClick={showModal}>
        <span className="info-icon info-icon-left">
          <InfoIcon />
        </span>
        <span className="network-show-more">Show More</span>
      </div>
    ) : (
      <div className="bridge-network-data" onClick={showModal}>
        <span className="network-show-more">Show More</span>
        <span className="info-icon info-icon-right">
          <InfoIcon />
        </span>
      </div>
    )

  return (
    <div className={`network-container-${containerName} network-container-${containerName}-${REACT_APP_UI_STYLES}`}>
      <p className={`${side ? `text-${side}` : ''}`}>
        <span className={`network-title network-title-${REACT_APP_UI_STYLES}`}>{networkTitle}</span>
        {networkSubtitle ? <span className="network-name">{networkSubtitle}</span> : null}
      </p>
      <p>
        <span className="network-basic-label">Balance:</span>
        <span className="network-balance">
          {' '}
          {formattedBalance} {currency}
        </span>
      </p>
      {showMore()}
    </div>
  )
}
