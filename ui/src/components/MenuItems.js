import React from 'react'
import { EventsIcon, StatusIcon, StatisticsIcon, AlternativeStatusIcon } from './menu-icons'
import { Link } from 'react-router-dom'

export const MenuItems = ({ onMenuToggle = null, withoutEvents, displayEventsTab }) => {
  const { REACT_APP_UI_STYLES } = process.env
  const menuItems = [
    {
      hide: withoutEvents || !displayEventsTab,
      icon: <EventsIcon />,
      link: '/events',
      text: 'Events'
    },
    {
      hide: false,
      icon: displayEventsTab ? <StatusIcon /> : <AlternativeStatusIcon />,
      link: '/status',
      text: 'Status'
    },
    {
      hide: withoutEvents,
      icon: <StatisticsIcon />,
      link: '/statistics',
      text: 'Statistics'
    }
  ]

  return menuItems.map((item, index) => {
    return item.hide ? null : (
      <Link
        key={index}
        to={item.link}
        className={`menu-items menu-items-${REACT_APP_UI_STYLES}`}
        onClick={onMenuToggle}
      >
        <span className="menu-items-icon">{item.icon}</span>
        <span className="menu-items-text">{item.text}</span>
      </Link>
    )
  })
}
