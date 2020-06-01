import React from 'react'
import { Link } from 'react-router-dom'
import { SocialIcons } from './SocialIcons'

export const Footer = () => {
  const { REACT_APP_UI_STYLES } = process.env
  const logoClass = REACT_APP_UI_STYLES === 'stake' ? 'footer-logo-alternative' : 'footer-logo'
  return (
    <footer className="footer">
      <div className="container">
        <Link to="/" className={logoClass} />
        <SocialIcons />
      </div>
    </footer>
  )
}
