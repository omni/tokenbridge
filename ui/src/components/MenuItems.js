import React from 'react'
import {
  EventsIcon,
  StatusIcon,
  DocumentIcon,
  StatisticsIcon,
  AlternativeStatusIcon,
  AlternativeStatisticsIcon
} from './menu-icons'
import { Link } from 'react-router-dom'
import { Wallet } from './Wallet'

export const MenuItems = ({ selected, onMenuToggle = null, withoutEvents, displayEventsTab }) => {
  const { REACT_APP_UI_STYLES } = process.env
  const menuItems = [
    {
      hide: withoutEvents || !displayEventsTab,
      icon: <EventsIcon />,
      link: '/events',
      text: 'Events',
      isTargetBlank: false,
      selected: selected === '/events'
    },
    {
      hide: true,
      icon: displayEventsTab ? <StatusIcon /> : <AlternativeStatusIcon />,
      link: '/status',
      text: 'Status',
      isTargetBlank: false,
      selected: selected === '/status'
    },
    {
      hide: true,
      icon: displayEventsTab ? <StatisticsIcon /> : <AlternativeStatisticsIcon />,
      link: '/statistics',
      text: 'Statistics',
      isTargetBlank: false,
      selected: selected === '/statistics'
    },
    {
      isWallet: true
    },
    {
      hide: false,
      icon: <DocumentIcon />,
      link: 'https://docs.pumapay.io/home/pumapay-bridge/',
      isTargetBlank: true,
      text: 'Documentation',
      selected: selected === '/documents'
    }
  ]

  return menuItems.map((item, index) => {
    const selectedLabel = item.selected ? 'selected' : ''

    if (item.isWallet) {
      return <Wallet key={index} />
    } else if (!item.hide) {
      return item.isTargetBlank ? (
        <a
          target="_blank"
          rel="noopener noreferrer"
          key={index}
          href={item.link}
          className={`menu-items menu-items-${REACT_APP_UI_STYLES}`}
        >
          <span className={`menu-items-icon menu-items-icon-${selectedLabel}`}>{item.icon}</span>
          <span className={`menu-items-text menu-items-text-${selectedLabel}`}>{item.text}</span>
        </a>
      ) : (
        <Link
          key={index}
          to={item.link}
          className={`menu-items menu-items-${REACT_APP_UI_STYLES}`}
          onClick={() => onMenuToggle(item.link)}
        >
          <span className={`menu-items-icon menu-items-icon-${selectedLabel}`}>{item.icon}</span>
          <span className={`menu-items-text menu-items-text-${selectedLabel}`}>{item.text}</span>
        </Link>
      )
    } else {
      return null
    }
  })
}
