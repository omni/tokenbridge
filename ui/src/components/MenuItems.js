import React from 'react'
import { EventsIcon, StatusIcon, StatisticsIcon } from './menu-icons'
import { Link } from 'react-router-dom'

export const MenuItems = ({ onMenuToggle = null, withoutEvents }) => {
  const menuItems = [
    {
      hide: withoutEvents,
      icon: <EventsIcon />,
      link: '/events',
      text: 'Events'
    },
    {
      hide: false,
      icon: <StatusIcon />,
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
    return (
      <Link key={index} to={item.link} className="menu-items" onClick={onMenuToggle}>
        <span className="menu-items-icon">{item.icon}</span>
        <span className="menu-items-text">{item.text}</span>
      </Link>
    )
  })
}
