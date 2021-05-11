import React from 'react'
import { SocialIcons } from './SocialIcons'

export const Footer = () => {
  return (
    <footer className="footer">
      <div className="container">
        <p className="copy-right">© Decentralized Vision Ltd. All Rights Reserved 2021</p>
        <p className="t_and_c">
          <a target="_blank" rel="noopener noreferrer" href="https://pumapay.io/docs/terms.pdf">
            Terms & Conditions{' '}
          </a>
        </p>
        <SocialIcons />
      </div>
    </footer>
  )
}
