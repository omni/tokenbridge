import React from 'react'

export const ModalContainer = props => {
  if (props.showModal)
    return (
      <div
        className="network-modal loading-container"
        onClick={
          props.hideModal
            ? e => {
                if (
                  e.target.classList.contains('network-details') ||
                  e.target.classList.contains('loading-container')
                ) {
                  props.hideModal()
                }
              }
            : () => {}
        }
      >
        <div className="modal">
          {props.children}
          {props.hideModal ? (
            <div className="close-button" onClick={() => props.hideModal()}>
              <i className="icon" />
            </div>
          ) : null}
        </div>
      </div>
    )
  return null
}
