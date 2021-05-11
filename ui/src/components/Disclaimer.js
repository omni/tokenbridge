import React, { useState } from 'react'
import disclaimerIcon from '../assets/images/disclaimer-modal/disclaimer@2x.png'

export const Disclaimer = ({ onConfirmation }) => {
  const [isSelectedTandC, setIsSelectedTandC] = useState(false)
  return (
    <div className="disclaimer-alert">
      <div className="image-container">
        <img className="disclaimer-icon" src={disclaimerIcon} alt="disclaimer icon" />
      </div>
      <div className="alert-container">
        <span className="disclaimer-title">
          Welcome to the
          <br /> PumaPay Bridge UI App Beta+
        </span>
        <p className="disclaimer-description">
          <span>
            We’re launching our Bridge'and our UI App on a beta-testing basis. While we’ve worked long and hard to
            develop the core features of the software, we expect that our users may detect bugs and other issues. Help
            us improve by posting any difficulties to our
            <a href="https://pumapay.io/contact" target="_blank" rel="noopener noreferrer">
              {' '}
              support page
            </a>
            .
          </span>
          <span>
            Use of this app and the PumaPay Bridge is at your own risk. Users may experience unexpected delays,
            unexpected visual artifacts, unexpected loss of tokens or funds from improper app configuration, or other
            negative outcomes.
          </span>
        </p>
        <div className="alert-container-t-and-c">
          <input
            type="checkbox"
            id="t_and_c"
            className="alert-container-t-and-c-checkbox"
            onClick={() => setIsSelectedTandC(prev => !prev)}
          />
          <label for="t_and_c" className="alert-container-t-and-c-label">
            I read and accepted the{' '}
            <a href=" https://pumapay.io/docs/terms.pdf" target="_blank" rel="noopener noreferrer">
              Terms & Conditions.
            </a>
          </label>
        </div>
        <div className="disclaimer-buttons">
          <button
            className={isSelectedTandC ? `disclaimer-confirm` : `disclaimer-confirm-disabled`}
            onClick={onConfirmation}
            disabled={!isSelectedTandC}
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  )
}
