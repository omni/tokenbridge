import React from 'react'

export const Authority = ({ address, number, logoIndex }) => (
  <div className="authority">
    <span className="authority-number">{number}</span>
    <div className="separator" />
    <div className={`authority-logo authority-logo-${logoIndex}`} />
    <span className="authority-address">{address}</span>
    <span className="authority-address-mobile">{`${address.substring(0, 7)}...${address.substring(
      address.length - 5
    )}`}</span>
  </div>
)
