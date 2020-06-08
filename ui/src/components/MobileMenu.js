import React from 'react'
import { MenuItems } from './MenuItems'
import NetworkSelect from './NetworkSelect'

export const MobileMenu = ({ selected, onMenuToggle, withoutEvents }) => (
  <div className="mobile-menu">
    <div className="mobile-menu-links">
      <MenuItems selected={selected} withoutEvents={withoutEvents} onMenuToggle={onMenuToggle} />
      <NetworkSelect />
    </div>
  </div>
)
