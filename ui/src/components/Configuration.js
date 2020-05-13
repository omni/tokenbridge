import React from 'react'
import numeral from 'numeral'
import { DataBlock } from './DataBlock'

export const Configuration = ({ requiredSignatures, authorities, symbol, maxSingleDeposit, maxTotalBalance }) => (
  <div className="status-configuration-data">
    {requiredSignatures.toString() !== '0' && (
      <DataBlock description="Required Signatures" value={numeral(requiredSignatures).format('0')} type="" />
    )}
    {authorities.toString() !== '0' && <div className="separator" />}
    {authorities.toString() !== '0' && (
      <DataBlock description="Authorities" value={numeral(authorities).format('0')} type="" />
    )}
    {maxSingleDeposit && maxSingleDeposit !== '0' && authorities.toString() !== '0' && <div className="separator" />}
    {maxSingleDeposit &&
      maxSingleDeposit !== '0' && (
        <DataBlock
          description="Max Single Deposit"
          value={numeral(maxSingleDeposit).format('0.00 a', Math.floor)}
          type={symbol}
        />
      )}
    {maxSingleDeposit && maxSingleDeposit !== '0' && authorities.toString() !== '0' && <div className="separator" />}
    {maxSingleDeposit &&
      maxSingleDeposit !== '0' && (
        <DataBlock
          description={`Remaining Daily ${symbol} Quota`}
          value={numeral(maxTotalBalance).format('0.00 a', Math.floor)}
          type={symbol}
        />
      )}
  </div>
)
