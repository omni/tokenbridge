import React from 'react'
import { useContext } from 'react'
import { ThemeContext } from 'styled-components'

export const LeftArrow = () => {
  const themeContext = useContext(ThemeContext)
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      version="1.1"
      id="mdi-arrow-left"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill={themeContext.fontColor}
    >
      <path d="M20,11V13H8L13.5,18.5L12.08,19.92L4.16,12L12.08,4.08L13.5,5.5L8,11H20Z" />
    </svg>
  )
}
