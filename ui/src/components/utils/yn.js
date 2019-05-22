const yn = input => {
  input = String(input).trim()

  if (/^(?:y|yes|true|1)$/i.test(input)) {
    return true
  }

  if (/^(?:n|no|false|0)$/i.test(input)) {
    return false
  }

  return false
}

export default yn
