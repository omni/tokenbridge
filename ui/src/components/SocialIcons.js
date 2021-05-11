import React from 'react'
import {
  AlternativeIconGithub,
  AlternativeIconTelegram,
  AlternativeIconTwitter,
  AlternativeIconBlog,
  AlternativeIconMedium,
  AlternativeIconFacebook,
  AlternativeIconReddit,
  IconGithub,
  IconPOA,
  IconTelegram,
  IconTwitter,
  IconFacebook,
  IconBlog,
  IconReddit,
  IconMedium,
  IconXDai
} from './social-icons'

export const SocialIcons = () => {
  const { REACT_APP_UI_STYLES } = process.env
  const useAlternativeIcons = REACT_APP_UI_STYLES === 'stake'
  const iconClass = useAlternativeIcons ? 'social-alternative-icons-item' : 'social-icons-item'

  const socialItems = [
    {
      icon: useAlternativeIcons ? <AlternativeIconTwitter /> : <IconTwitter />,
      link: 'https://twitter.com/PumaPay'
    },
    {
      icon: useAlternativeIcons ? <AlternativeIconFacebook /> : <IconFacebook />,
      link: 'https://www.facebook.com/PumaPayOfficial'
    },
    {
      icon: useAlternativeIcons ? <AlternativeIconTelegram /> : <IconTelegram />,
      link: 'https://t.me/PumaPay'
    },
    {
      icon: useAlternativeIcons ? <AlternativeIconMedium /> : <IconMedium />,
      link: 'https://medium.com/@pumapay'
    },
    {
      icon: useAlternativeIcons ? <AlternativeIconBlog /> : <IconBlog />,
      link: 'https://pumapay.io/blog'
    },
    {
      icon: useAlternativeIcons ? <AlternativeIconReddit /> : <IconReddit />,
      link: 'https://www.reddit.com/r/PumaPay/'
    },
    {
      icon: useAlternativeIcons ? <AlternativeIconGithub /> : <IconGithub />,
      link: 'https://github.com/pumapayio'
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
