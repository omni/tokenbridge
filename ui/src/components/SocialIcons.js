import React from 'react'
import {
  AlternativeIconGithub,
  AlternativeIconTelegram,
  AlternativeIconTwitter,
  IconGithub,
  IconPOA,
  IconTelegram,
  IconTwitter,
  IconXDai
} from './social-icons'

export const SocialIcons = () => {
  const { REACT_APP_UI_STYLES } = process.env
  const useAlternativeIcons = REACT_APP_UI_STYLES === 'stake'
  const iconClass = useAlternativeIcons ? 'social-alternative-icons-item' : 'social-icons-item'

  const socialItems = [
    {
      icon: useAlternativeIcons ? <IconXDai /> : <IconPOA />,
      link: useAlternativeIcons ? 'https://xdaichain.com/' : 'https://poa.network'
    },
    {
      icon: useAlternativeIcons ? <AlternativeIconTwitter /> : <IconTwitter />,
      link: useAlternativeIcons ? 'https://twitter.com/xdaichain' : 'https://twitter.com/poanetwork'
    },
    {
      icon: useAlternativeIcons ? <AlternativeIconTelegram /> : <IconTelegram />,
      link: useAlternativeIcons ? 'https://t.me/xdaistable' : 'https://t.me/poa_network'
    },
    {
      icon: useAlternativeIcons ? <AlternativeIconGithub /> : <IconGithub />,
      link: useAlternativeIcons ? 'https://github.com/xdaichain' : 'https://github.com/poanetwork/tokenbridge'
    }
  ]

  return (
    <div className="social-icons">
      {socialItems.map((item, index) => {
        return (
          <a key={index} href={item.link} target="_blank" rel="noopener noreferrer" className={iconClass}>
            {item.icon}
          </a>
        )
      })}
    </div>
  )
}
