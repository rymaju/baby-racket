const Env = require('./env')
const Vector = require('./vector')
const looseEquals = require('./equality')

const STANDARD_ENV = new Env({
  'string->symbol': x => {
    return x.toString()
  },
  sub1: n => {
    return n - 1
  },
  add1: n => {
    return n + 1
  },
  'zero?': n => {
    return n === 0
  },
  '+': (...args) => {
    let sum = 0
    for (const item of args) {
      sum += item
    }
    return sum
  },
  '-': (...args) => {
    let sum = args[0]
    for (let i = 1; i < args.length; i++) {
      sum -= args[i]
    }
    return sum
  },
  '*': (...args) => {
    let product = 1
    for (const item of args) {
      product *= item
    }
    return product
  },
  '/': (...args) => {
    let quotient = args[0]
    for (let i = 1; i < args.length; i++) {
      if (args[i] === 0) {
        throw Error('Division by 0 is not allowed.')
      }
      quotient /= args[i]
    }
    return quotient
  },
  '%': (a, b) => {
    return a % b
  },
  '<': (a, b) => {
    return a < b
  },
  '>': (a, b) => {
    return a > b
  },
  '<=': (a, b) => {
    return a <= b
  },
  '>=': (a, b) => {
    return a >= b
  },
  '=': (a, b) => {
    return a === b
  },
  not: a => {
    return !a
  },
  list: (...args) => {
    return args
  },
  cons: (first, rest) => {
    return [first, ...rest]
  },
  car: list => {
    return list[0]
  },
  cdr: list => {
    const rest = list.slice(1)
    // check if it is a proper list or a pairing
    if (rest.length === 2 && rest[0] === '.') {
      return rest[1]
    }
    return rest
  },
  first: list => {
    return list[0]
  },
  rest: list => {
    return list.slice(1)
  },
  empty: [],
  'list?': list => {
    return list instanceof Array
  },
  'cons?': list => {
    return list instanceof Array && list.length > 0
  },
  'pair?': list => {
    return list instanceof Array && list.length > 0
  },
  'null?': list => {
    return list instanceof Array && list.length === 0
  },
  'empty?': list => {
    return list instanceof Array && list.length === 0
  },
  length: l => l.length,
  append: (...args) => {
    let ret = []
    for (const list of args) {
      ret = ret.concat(list)
    }
    return ret
  },
  and: (a, b) => {
    if (a === false || b === false) return false
    return b
  },
  or: (a, b) => {
    return a || b
  },
  abs: Math.abs,
  acos: Math.acos,
  asin: Math.asin,
  atan: Math.atan,
  ceiling: Math.ceil,
  cos: Math.cos,
  cosh: Math.cosh,
  e: Math.E,
  'even?': x => x % 2 === 0,
  exp: Math.exp,
  expt: Math.pow,
  floor: Math.floor,
  log: Math.log,
  max: Math.max,
  min: Math.min,
  modulo: (a, b) => a % b,
  'negative?': x => x < 0,
  'number->string': x => new String(x),
  'number?': x => !isNaN(x),
  'odd?': x => x % 2 === 1,
  pi: Math.PI,
  'positive?': x => x > 0,
  quotient: Math.floorDiv,
  round: Math.round,
  sgn: Math.sign,
  sin: Math.sin,
  sinh: Math.sinh,
  sqr: x => Math.pow(x, 2),
  sqrt: Math.sqrt,
  tan: Math.tan,
  'boolean=?': (a, b) => a === b,
  'boolean?': x => x === true || x === false,
  'false?': x => x === false,
  'symbol->string': x => x,
  'symbol=?': (x, y) => x === y,
  'symbol?': x => typeof x === 'string' && !(x instanceof String),
  assoc: (x, l) => {
    for (let i = 0; i < l.length; i++) {
      const pair = l[i]
      if (looseEquals(pair[0], x)) {
        return pair
      }
    }
    return false
  },
  assv: (x, l) => {
    for (let i = 0; i < l.length; i++) {
      const pair = l[i]
      if (pair[0] === x) {
        return pair
      }
    }
    return false
  },
  assq: (x, l) => {
    for (const pair of l) {
      if (pair[0] === x) {
        return pair
      }
    }
    return false
  },
  'list-ref': (x, l) => {
    return l[x]
  },
  'make-list': (n, x) => {
    const ret = []
    for (let i = 0; i < n; i++) {
      ret.push(x)
    }
    return ret
  },
  member: (x, l) => l.includes(x),
  'member?': (x, l) => l.includes(x),
  remove: (x, l) => {
    const ret = [].concat(l)
    const idx = ret.indexOf(x)
    if (idx >= 0) {
      return ret.splice(idx, 1)
    }
    return ret
  },
  'remove-all': (x, l) => l.filter(v => v !== x),
  reverse: l => l.reverse(),
  explode: s => s.explode(),
  'string->number': x => Number(x),
  'string-append': (...args) => {
    let out = ''
    for (const element of args) {
      if (!(element instanceof String)) {
        throw new TypeError(element + ' is not a String')
      }
      out += element
    }
    return new String(out)
  },
  'string=?': looseEquals,
  'string?': x => typeof x === 'string',
  substring: (s, i, j) => s.substring(i, j),
  'equal?': looseEquals,
  'eqv?': (a, b) => {
    return a === b
  },
  identity: x => x,
  map: (f, l) => l.map(f),
  andmap: (f, l) => l.every(f),
  ormap: (f, l) => l.any(f),
  foldl: (f, init, l) => l.reduce(f, init),
  foldr: (f, init, l) => l.reduceRight(f, init),
  filter: (f, l) => l.filter(f),
  vector: (...args) => new Vector(args),
  'vector?': x => x instanceof Vector,
  'list->vector': l => new Vector(l)
})

module.exports = { STANDARD_ENV }
