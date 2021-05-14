import React, {useState} from 'react'

export const TopWarning = () => {
  const [isClose, setIsClose] = useState(localStorage.getItem("top-warning-close"));
  const handleClose = () => {
    localStorage.setItem("top-warning-close", true);
    setIsClose(true)
  }
  return (
    <>
    {!isClose ? <div className="top-warning">
      <div className="top-warning-detail">
        <img className="top-warning-img" src={require('../assets/images/icons/vector.png')} />
        <span className="top-warning-text">Always make sure the URL is bridge.pumapay.io - Press (Ctrl+D or Cmd+D) to bookmark it to be safe.</span>
      </div>
      <span className="top-warning-close" onClick={handleClose}>X</span>
    </div>: null}
    </>
  )
}
