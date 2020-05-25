import React from 'react'
import { EventsIcon, StatusIcon, StatisticsIcon, AlternativeStatusIcon } from './menu-icons'
import { Link } from 'react-router-dom'

export const MenuItems = ({ selected, onMenuToggle = null, withoutEvents, displayEventsTab }) => {
  const { REACT_APP_UI_STYLES } = process.env
  const menuItems = [
    {
      hide: withoutEvents || !displayEventsTab,
      icon: <EventsIcon />,
      link: '/events',
      text: 'Events',
      selected: selected === '/events'
    },
    {
      hide: false,
      icon: displayEventsTab ? <StatusIcon /> : <AlternativeStatusIcon />,
      link: '/status',
      text: 'Status',
      selected: selected === '/status'
    },
    {
      hide: withoutEvents,
      icon: <StatisticsIcon />,
      link: '/statistics',
      text: 'Statistics',
      selected: selected === '/statistics'
    }
  ]

  return menuItems.map((item, index) => {
    const selectedLabel = item.selected ? 'selected' : ''
    return item.hide ? null : (
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
  })
}
