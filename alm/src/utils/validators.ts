const validatorSignatureCache: { [key: string]: boolean } = {}

export const getValidatorSignatureCache = (key: string) => validatorSignatureCache[key]
export const setValidatorSignatureCache = (key: string, value: boolean) => (validatorSignatureCache[key] = value)
