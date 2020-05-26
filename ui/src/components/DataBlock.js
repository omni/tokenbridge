import React from 'react'

export const DataBlock = ({ description, value, type, dataTestid, valueClass = '' }) => (
  <div className="datablock-container" data-testid={dataTestid}>
    <p>
      <span className={`datablock-value datablock-value-${valueClass}`}>{value}</span>
      <span className={type ? 'datablock-type' : ''}>{type}</span>
    </p>
    <p className="datablock-description">{description}</p>
  </div>
)
