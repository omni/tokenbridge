import React from 'react'

export const Authority = ({ address, number, logoIndex }) => (
  <div className="authority">
    <span className="authority-number">{number}</span>
    <div className="separator" />
    <div className={`authority-logo authority-logo-${logoIndex}`} />
    <span className="authority-address">{address}</span>
  </div>
)
