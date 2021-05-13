import React from 'react'

export const TopWarning = () => {
  return (
    <div className="top-warning">
      <img className="top-warning-img" src={require('../assets/images/icons/vector.png')} />
      <span className="top-warning-text">Always make sure the URL is bridge.pumapay.io - Press (Ctrl+D or Cmd+D) to bookmark it to be safe.</span>
    </div>
  )
}
