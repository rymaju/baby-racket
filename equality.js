function loose (a, b) {
  console.log(a)

  if (a instanceof String && b instanceof String) {
    return a.valueOf() === b.valueOf()
  } else if (typeof a === 'object' && typeof b === 'object') {
    // to avoid a cyclic dependency, checking if a and b are objects is equivalent to checking if they are Structs
    return a.equals(b)
  } else {
    return a === b
  }
}

module.exports = loose
