import React from 'react'
import { MenuItems } from './MenuItems'
import { Wallet } from './Wallet'
import NetworkSelect from './NetworkSelect'

export const HeaderMenu = ({ selected, withoutEvents, displayEventsTab, onMenuToggle }) => (
  <div className="header-menu">
    <MenuItems
      selected={selected}
      withoutEvents={withoutEvents}
      displayEventsTab={displayEventsTab}
      onMenuToggle={onMenuToggle}
    />
    <Wallet />
    <NetworkSelect />
  </div>
)
