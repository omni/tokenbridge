import React from 'react'
import { MenuItems } from './MenuItems'
import { Wallet } from './Wallet'
import NetworkSelect from './NetworkSelect'

export const HeaderMenu = ({ withoutEvents, displayEventsTab }) => (
  <div className="header-menu">
    <MenuItems withoutEvents={withoutEvents} displayEventsTab={displayEventsTab} />
    <Wallet />
    <NetworkSelect />
  </div>
)
