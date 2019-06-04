import React from 'react'
import disclaimerIcon from '../assets/images/disclaimer-modal/disclaimer@2x.png'

export const Disclaimer = ({ onConfirmation }) => (
  <div className="disclaimer-alert">
    <div className="image-container">
      <img className="disclaimer-icon" src={disclaimerIcon} alt="disclaimer icon" />
    </div>
    <div className="alert-container">
      <span className="disclaimer-title">
        Welcome to the
        <br /> TokenBridge UI App Beta+
      </span>
      <p className="disclaimer-description">
        We’re launching our TokenBridge and our UI App on a beta-testing basis. While we’ve worked
        long and hard to develop the core features of the software, we expect that our users may
        detect bugs and other issues. Help us improve by posting any difficulties to our
        <a
          href="https://forum.poa.network/c/support/tokenbridge-support"
          target="_blank"
          rel="noopener noreferrer"
        >
          {' '}
          support page
        </a>
        .<br />
        <br />
        Use of this app and the TokenBridge is at your own risk. Users may experience unexpected
        delays, unexpected visual artifacts, unexpected loss of tokens or funds from improper app
        configuration, or other negative outcomes.
        <br />
        <br />
        By hitting the "continue" button, you are representing that you’ve read our
        <a
          href="https://forum.poa.network/t/end-user-licensing-agreement-and-terms-of-service/2197"
          target="_blank"
          rel="noopener noreferrer"
        >
          Terms of Service
        </a>{' '}
        in full, and that you agree to be legally bound by them.
      </p>
      <div className="disclaimer-buttons">
        <button className="disclaimer-confirm" onClick={onConfirmation}>
          Continue
        </button>
      </div>
    </div>
  </div>
)
