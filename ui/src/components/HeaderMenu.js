import React from 'react'
import { MenuItems } from './MenuItems'
import { Wallet } from './Wallet'
import NetworkSelect from './NetworkSelect'

export const HeaderMenu = ({ withoutEvents }) => (
  <div className="header-menu">
    <MenuItems withoutEvents={withoutEvents} />
    <Wallet />
    <NetworkSelect />
  </div>
)
