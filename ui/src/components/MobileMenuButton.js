import React from 'react'
import { MobileMenuIcon } from './menu-icons/MobileMenuIcon'
import { MobileMenuCloseIcon } from './menu-icons/MobileMenuCloseIcon'

export const MobileMenuButton = ({ showMobileMenu, onMenuToggle }) => {
  return (
    <div className="mobile-menu-button" onClick={onMenuToggle}>
      {showMobileMenu ? <MobileMenuCloseIcon /> : <MobileMenuIcon />}
    </div>
  )
}
