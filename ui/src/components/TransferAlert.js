import React from 'react'
import arrowsIcon from '../assets/images/transfer-modal/icon-arrows@2x.png'
import numeral from 'numeral'
import { ArrowRight } from './icons/ArrowRight'

export const TransferAlert = ({
  onConfirmation,
  onCancel,
  from,
  to,
  fromCurrency,
  toCurrency,
  fromAmount,
  toAmount,
  fee,
  reverse
}) => {
  const { REACT_APP_UI_STYLES } = process.env
  const formattedFromAmount = numeral(fromAmount).format('0,0[.][000000000000000000]', Math.floor)
  const formattedToAmount = numeral(toAmount).format('0,0[.][000000000000000000]', Math.floor)

  return (
    <div className="transfer-alert">
      <div className={`image-container image-container-${REACT_APP_UI_STYLES}`}>
        <img className="arrows-icon" src={arrowsIcon} alt="transfer icon" />
      </div>
      <div className="alert-container">
        <div className={`transfer-title transfer-title-${REACT_APP_UI_STYLES}`}>
          <div className="alert-logo-box">
            <div className={reverse ? 'foreign-logo' : 'home-logo'} />
          </div>
          <div>
            <strong>{formattedFromAmount}</strong> {fromCurrency}
          </div>
          <ArrowRight />
          <div>
            <strong>{formattedToAmount}</strong> {toCurrency}
          </div>
          <div className="alert-logo-box">
            <div className={reverse ? 'home-logo' : 'foreign-logo'} />
          </div>
        </div>
        <div className={`transfer-title-alternative transfer-title-alternative-${REACT_APP_UI_STYLES}`}>
          <span className="transfer-title-text">Confirm Transfer</span>
        </div>
        <div className={`transfer-title-alternative transfer-title-alternative-${REACT_APP_UI_STYLES}`}>
          <div className="transfer-operation-container">
            <div className="transfer-operation-box">
              <div className="transfer-operation-box-value">
                <strong>{formattedFromAmount}</strong> {fromCurrency}
              </div>
              <div className="transfer-operation-box-network">{from}</div>
            </div>
            <div className="transfer-operation-arrow-container">
              <div className="transfer-operation-ellipse">
                <div className="transfer-operation-arrow" />
              </div>
            </div>
            <div className="transfer-operation-box">
              <div className="transfer-operation-box-value">
                <strong>{formattedToAmount}</strong> {toCurrency}
              </div>
              <div className="transfer-operation-box-network">{to}</div>
            </div>
          </div>
        </div>
        <p className="transfer-description" data-testid="transfer-description">
          <strong>{fee && `Fee: ${fee.toString()}%`}</strong>
          <br />
          Please confirm that you would like to send {formattedFromAmount} {fromCurrency} from {from} to receive{' '}
          {formattedToAmount} {toCurrency} on {to}.
        </p>
        <div className="transfer-buttons">
          <button className="transfer-confirm" onClick={onConfirmation}>
            Continue
          </button>
          <button className="transfer-cancel" onClick={onCancel}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
