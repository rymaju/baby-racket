const looseEquals = require('./equality')

class Struct {
  constructor (name, fields, values) {
    this.name = name
    this.fields = {}

    for (let i = 0; i < fields.length; i++) {
      this.fields[fields[i]] = values[i]
    }
  }

  equals (other) {
    if (other === this) {
      return true
    }

    if (!(other instanceof Struct) || other.name !== this.name) {
      return false
    }

    for (const key in this.fields) {
      if (!looseEquals(this.fields[key], other.fields[key])) {
        return false
      }
    }
    return true
  }

  get (field) {
    return this.fields[field]
  }
}

module.exports = Struct
