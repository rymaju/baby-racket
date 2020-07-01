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
    this.env[v] = w
  }
}

module.exports = Env
