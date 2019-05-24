import React from 'react'
import numeral from 'numeral'
import { DataBlock } from './DataBlock'

export const Configuration = ({
  requiredSignatures,
  authorities,
  symbol,
  maxSingleDeposit,
  maxTotalBalance
}) => (
  <div className="status-configuration-data">
    <DataBlock
      description="Required Signatures"
      value={numeral(requiredSignatures).format('0')}
      type=""
    />
    <div className="separator" />
    <DataBlock description="Authorities" value={numeral(authorities).format('0')} type="" />
    {maxSingleDeposit &&
      maxSingleDeposit !== '0' && <div className="separator" /> && (
        <DataBlock
          description="Max Single Deposit"
          value={numeral(maxSingleDeposit).format('0.00 a', Math.floor)}
          type={symbol}
        />
      )}
    {maxSingleDeposit &&
      maxSingleDeposit !== '0' && <div className="separator" /> && (
        <DataBlock
          description={`Remaining Daily ${symbol} Quota`}
          value={numeral(maxTotalBalance).format('0.00 a', Math.floor)}
          type={symbol}
        />
      )}
  </div>
)
