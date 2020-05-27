import React from 'react'
import { inject, observer } from 'mobx-react'
import { ProgressRing } from './ProgressRing'
import { PreventExit } from './PreventExit'

@inject('RootStore')
@observer
export class Loading extends React.Component {
  render() {
    const { REACT_APP_UI_STYLES } = process.env
    const { alertStore } = this.props.RootStore
    const { loadingStepIndex, loadingSteps, blockConfirmations, requiredBlockConfirmations } = alertStore
    const style = alertStore.showLoading ? { display: 'flex' } : { display: 'none' }
    const progress = loadingStepIndex === 3 ? 100 : 25 + (blockConfirmations / requiredBlockConfirmations) * 50
    const radius = REACT_APP_UI_STYLES === 'stake' ? 33 : 40

    return (
      <div className={`loading-container ${loadingStepIndex > 0 ? 'mobile-container' : ''}`} style={style}>
        <div
          className={`loading-container-content ${
            loadingStepIndex > 0 ? 'loading-container-content-' + REACT_APP_UI_STYLES : ''
          } ${loadingStepIndex > 0 ? 'mobile-container' : ''}`}
          style={style}
        >
          {loadingStepIndex > 0 && (
            <ProgressRing
              confirmationNumber={blockConfirmations}
              requiredBlockConfirmations={requiredBlockConfirmations}
              hideConfirmationNumber={loadingStepIndex > 1}
              progress={progress}
              radius={radius}
              stroke={4}
            />
          )}
          {loadingStepIndex === 0 && <div className="loading-logo" />}
          {loadingStepIndex === 0 && <div className="loading-i" />}
          {loadingStepIndex > 0 && <div className="loading-text">{loadingSteps[loadingStepIndex]}</div>}
          {alertStore.showLoading && <PreventExit />}
        </div>
      </div>
    )
  }
}
