import React from 'react'
import { fromWei } from 'web3-utils'
import numeral from 'numeral'
import { CopyIcon } from '../icons/CopyIcon'
import { CopyToClipboard } from 'react-copy-to-clipboard'

export const Event = ({
  color,
  eventName,
  transactionHash,
  recipient,
  value,
  blockNumber,
  txUrl,
  accountUrl
}) => (
  <div>
    <div className="event">
      <div className="event-tx-container txhash-column">
        <span className={`event-name background-${color}`}>{eventName}</span>
        <span>
          <a href={txUrl} target="_blank" className="event-txhash">
            {transactionHash.slice(0, 18).concat('...')}
          </a>
          <CopyToClipboard text={transactionHash}>
            <span className="copy-icon copy-icon-right">
              <CopyIcon />
            </span>
          </CopyToClipboard>
        </span>
      </div>
      <a href={accountUrl} target="_blank" className="event-recipient recipient-column">
        {recipient ? <strong className="only-mobile event-recipient-label ">Recipient</strong> : ''}
        {recipient ? recipient.slice(0, 27).concat('...') : ''}
      </a>
      <span className="event-value value-column">
        {recipient ? <strong className="only-mobile">Value</strong> : ''}
        {value ? numeral(fromWei(value)).format('0,0.00', Math.floor) : ''}
      </span>
      <span className="event-block block-column">
        <strong className="only-mobile">Block</strong>
        {blockNumber}
      </span>
    </div>
    <div className="event-separator" />
  </div>
)
