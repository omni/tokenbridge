export const DISCLAIMER_KEY = 'bridge-ui-app-disclaimer'

export const setItem = (key, data) => {
  localStorage.setItem(key, data)
}

export const getItem = key => {
  return localStorage.getItem(key)
}
