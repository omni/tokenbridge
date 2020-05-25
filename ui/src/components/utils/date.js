const DAY_DIF_CONSTANTS = {
  threeDays: 259200000,
  oneWeek: 604800000
}

export const getDateColor = date => {
  const now = new Date()
  const diff = now - date

  if (diff < DAY_DIF_CONSTANTS.threeDays) {
    return 'green'
  } else if (diff < DAY_DIF_CONSTANTS.oneWeek) {
    return 'yellow'
  } else {
    return 'red'
  }
}
