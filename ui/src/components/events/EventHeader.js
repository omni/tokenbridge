import React from 'react'

export const EventHeader = ({ color, eventName, transactionHash, handleClick }) => (
  <div className="events-i-header">
    <div className="events-i-header-title">
      <p className={`label ${color}`}>{eventName}</p>
    </div>
    <p className="description break-all">tx: {transactionHash}</p>
    <div onClick={handleClick} className="events-i-switcher" />
  </div>
)
