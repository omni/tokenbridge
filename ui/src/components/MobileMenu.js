import React from 'react'
import { MenuItems } from './MenuItems'

export const MobileMenu = ({ onMenuToggle, withoutEvents }) => (
  <div className="mobile-menu">
    <div className="mobile-menu-links">
      <MenuItems withoutEvents={withoutEvents} onMenuToggle={onMenuToggle} />
    </div>
  </div>
)
