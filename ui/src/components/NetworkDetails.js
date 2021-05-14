import React from 'react'
import numeral from 'numeral'
import { CopyIcon } from './icons/CopyIcon'
import { CopyToClipboard } from 'react-copy-to-clipboard'

export const NetworkDetails = ({
  isHome,
  networkName,
  url,
  address,
  currency,
  maxCurrentLimit,
  maxPerTx,
  minPerTx,
  tokenAddress,
  totalSupply,
  totalBalance,
  balance,
  displayTokenAddress,
  displayBridgeLimits,
  nativeSupplyTitle,
  tokenName,
  getExplorerAddressUrl
}) => {
  const { REACT_APP_UI_STYLES } = process.env
  const networkTitle = isHome ? 'Bridge Home' : 'Bridge Foreign'
  const logoClass = isHome ? 'home-logo home-logo-modal' : 'foreign-logo foreign-logo-modal'
  const totalTitle =
    isHome && !displayTokenAddress
      ? nativeSupplyTitle
        ? `Native Coins Amount`
        : `Totally minted by the bridge`
      : `${currency} Tokens Amount`
  const totalAmount = isHome ? totalBalance : totalSupply
  const formattedBalance = isNaN(numeral(balance).format('0.00', Math.floor))
    ? numeral(0).format('0,0.00', Math.floor)
    : numeral(balance).format('0,0.000', Math.floor)

  return (
    <div className="network-details" data-testid="network-details">
      <div className={`details-logo-container details-logo-container-${REACT_APP_UI_STYLES}`}>
        <div className={logoClass} />
      </div>
      <div className={`details-body details-body-${REACT_APP_UI_STYLES}`}>
        <p className={`details-data-container details-data-container-${REACT_APP_UI_STYLES}`}>
          <span className="details-title">{networkName}</span>
        </p>
        <p className="details-data-container">
          <span className="details-label">Network</span>
          <span className="details-description">{url}</span>
        </p>
        <p className="details-data-container">
          <span className="details-label">{networkTitle} Address</span>
          <span className="details-description details-copy">
            <a
              className="details-description"
              href={getExplorerAddressUrl(address)}
              target="_blank"
              rel="noopener noreferrer"
            >
              {address.slice(0, 27).concat('...')}
            </a>
            <CopyToClipboard text={address}>
              <span className="copy-icon copy-icon-right">
                <CopyIcon />
              </span>
            </CopyToClipboard>
          </span>
        </p>
        {displayBridgeLimits && (
          <p className="details-data-container">
            <span className="details-label">Remaining Daily {currency} Quota</span>
            <div className="details-description-black">
              {numeral(maxCurrentLimit).format('0,0.0', Math.floor)}
              <span className={`details-description-currency-${REACT_APP_UI_STYLES}`}>{' ' + currency}</span>
            </div>
          </p>
        )}
        {displayBridgeLimits && (
          <p className="details-data-container">
            <span className="details-label">Maximum Amount Per Transaction</span>
            <span className="details-description-black">
              {numeral(maxPerTx).format('0,0.0', Math.floor)}
              <span className={`details-description-currency-${REACT_APP_UI_STYLES}`}>{' ' + currency}</span>
            </span>
          </p>
        )}
        {displayBridgeLimits && (
          <p className="details-data-container">
            <span className="details-label">Minimum Amount Per Transaction</span>
            <span className="details-description-black">
              {numeral(minPerTx).format('0,0.000', Math.floor)}
              <span className={`details-description-currency-${REACT_APP_UI_STYLES}`}>{' ' + currency}</span>
            </span>
          </p>
        )}
        {displayTokenAddress && (
          <p className="details-data-container">
            <span className="details-label">Token Address</span>
            <span className="details-description details-copy">
              <a
                className="details-description"
                href={getExplorerAddressUrl(tokenAddress)}
                target="_blank"
                rel="noopener noreferrer"
              >
                {tokenAddress.slice(0, 27).concat('...')}
              </a>
              <CopyToClipboard text={tokenAddress}>
                <span className="copy-icon copy-icon-right">
                  <CopyIcon />
                </span>
              </CopyToClipboard>
            </span>
          </p>
        )}
        {displayTokenAddress && (
          <p className="details-data-container">
            <span className="details-label">Token Name</span>
            <span className={`details-description-black details-description-black-${REACT_APP_UI_STYLES}`}>
              {tokenName || 'No token name'}
            </span>
          </p>
        )}
        <p className="details-data-container">
          <span className="details-label">{totalTitle}</span>
          <span className="details-description-black">
            {numeral(totalAmount).format('0,0.000', Math.floor)}
            <span className={`details-description-currency-${REACT_APP_UI_STYLES}`}>{' ' + currency}</span>
          </span>
        </p>
        <p className="details-data-container">
          <span className="details-label">Your {currency} Balance</span>
          <span className="details-description-black">
            {formattedBalance}
            <span className={`details-description-currency-${REACT_APP_UI_STYLES}`}>{' ' + currency}</span>
          </span>
        </p>
      </div>
    </div>
  )
}
