import React from 'react'

export const BridgeForm = ({ reverse, currency, onTransfer, onInputChange, displayArrow }) => {
  const { REACT_APP_UI_STYLES } = process.env
  return (
    <div className={`form-container ${displayArrow || REACT_APP_UI_STYLES === 'stake' ? 'transfer-right' : ''}`}>
      <form className="bridge-form" onSubmit={onTransfer} autoComplete="off">
        <div className={`bridge-form-controls bridge-form-controls-${REACT_APP_UI_STYLES}`}>
          <div className="bridge-form-input-container">
            <input
              onChange={onInputChange}
              name="amount"
              pattern="[0-9]+([.][0-9]{1,18})?"
              type="text"
              className="bridge-form-input"
              id="amount"
              placeholder="0"
            />
            <label htmlFor="amount" className="bridge-form-label">
              {currency}
            </label>
          </div>
          <div>
            <button type="submit" className="bridge-form-button">
              Transfer
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
