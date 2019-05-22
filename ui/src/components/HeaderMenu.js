import React from 'react'
import { MenuItems } from './MenuItems'
import { Wallet } from './Wallet'

export const HeaderMenu = ({ withoutEvents }) => (
  <div className="header-menu">
    <MenuItems withoutEvents={withoutEvents} />
    <Wallet />
  </div>
)
