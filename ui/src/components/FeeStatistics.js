import React from 'react'
import numeral from 'numeral'
import { DataBlock } from './DataBlock'

export const FeeStatistics = ({ depositFeeCollected, withdrawFeeCollected }) => (
  <div className="statistics-fee-container" data-testid="fee-statistics">
    {(depositFeeCollected.shouldDisplay || withdrawFeeCollected.shouldDisplay) && (
      <span className="statistics-bridge-title statistics-title">Fee Statistics</span>
    )}
    <div className="statistics-fee-data" data-testid="fee-statistics-data">
      {depositFeeCollected.shouldDisplay && (
        <DataBlock
          description="Deposit Fees"
          value={numeral(depositFeeCollected.value).format('0,0.00 a', Math.floor)}
          type={depositFeeCollected.type}
          dataTestid="deposit-fees-block"
        />
      )}
      {depositFeeCollected.shouldDisplay &&
        withdrawFeeCollected.shouldDisplay && <div className="separator" />}
      {withdrawFeeCollected.shouldDisplay && (
        <DataBlock
          description="Withdrawal Fees"
          value={numeral(withdrawFeeCollected.value).format('0,0.00 a', Math.floor)}
          type={withdrawFeeCollected.type}
          dataTestid="withdrawal-fees-block"
        />
      )}
    </div>
  </div>
)
