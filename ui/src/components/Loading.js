import React from 'react'
import { inject, observer } from 'mobx-react'
import { ProgressRing } from './ProgressRing'
import { PreventExit } from './PreventExit'

@inject('RootStore')
@observer
export class Loading extends React.Component {
  render() {
    const { alertStore } = this.props.RootStore
    const { loadingStepIndex, loadingSteps, blockConfirmations } = alertStore
    const style = alertStore.showLoading ? { display: 'flex' } : { display: 'none' }
    const progress = loadingStepIndex === 3 ? 100 : loadingStepIndex * 25 + blockConfirmations * 4

    return (
      <div
        className={`loading-container ${loadingStepIndex > 0 ? 'mobile-container' : ''}`}
        style={style}
      >
        {loadingStepIndex > 0 && (
          <ProgressRing
            confirmationNumber={blockConfirmations}
            hideConfirmationNumber={loadingStepIndex > 1}
            progress={progress}
            radius={40}
            stroke={4}
          />
        )}
        {loadingStepIndex === 0 && <div className="loading-logo" />}
        {loadingStepIndex === 0 && <div className="loading-i" />}
        {loadingStepIndex > 0 && (
          <div className="loading-text">{loadingSteps[loadingStepIndex]}</div>
        )}
        {alertStore.showLoading && <PreventExit />}
      </div>
    )
  }
}
