class Validation {
  toBeNumberOrUndefined(value, valueName) {
    if (!['undefined', 'number'].includes(typeof value)) {
      throw new Error(`${valueName} should be type of number or undefined but got ${typeof value}`)
    }
  }
}

export const validation = new Validation()
