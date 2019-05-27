import React from 'react'
import { IconGithub, IconPOA, IconTelegram, IconTwitter } from './social-icons'

export const SocialIcons = () => {
  const socialItems = [
    {
      icon: <IconPOA />,
      link: 'https://poa.network'
    },
    {
      icon: <IconTwitter />,
      link: 'https://twitter.com/poanetwork'
    },
    {
      icon: <IconTelegram />,
      link: 'https://t.me/poa_network'
    },
    {
      icon: <IconGithub />,
      link: 'https://github.com/poanetwork/tokenbridge'
    }
  ]

  return (
    <div className="social-icons">
      {socialItems.map((item, index) => {
        return (
          <a key={index} href={item.link} target="_blank" className="social-icons-item">
            {item.icon}
          </a>
        )
      })}
    </div>
  )
}
