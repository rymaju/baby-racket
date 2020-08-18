const reservedKeywords = require('./reservedKeywords')

class Env {
  constructor (env = {}, outer = null) {
    this.env = env
    this.outer = outer
  }

  find (v) {
    if (this.env[v] !== undefined) {
      return this.env
    } else if (this.outer !== null) {
      return this.outer.find(v)
    } else {
      return undefined
    }
  }

  get (v) {
    return this.env[v]
  }

  set (v, w) {
    if (reservedKeywords.includes(v)) {
      throw new Error(
        v +
          ' is a reserved keyword, and cannot be used as an argument/definiton name.'
      )
    }
    this.env[v] = w
  }

  clone () {
    const clonedOuter = this.outer !== null ? this.outer.clone() : null

    return new Env(Object.assign({}, this.env), clonedOuter)
  }
}

module.exports = Env
