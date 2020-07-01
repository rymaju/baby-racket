const Env = require('./env')

const STANDARD_ENV = new Env({
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
    for (item of args) {
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
    for (item of args) {
      product *= item
    }
    return product
  },
  '/': (...args) => {
    let quotient = args[0]
    for (let i = 1; i < args.length; i++) {
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
    return list.slice(1)
  },
  first: list => {
    return list[0]
  },
  rest: list => {
    return list.slice(1)
  },
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
    return list === []
  },
  'empty?': list => {
    return list === []
  },
  append: (...args) => {
    let ret = []
    for (list of args) {
      ret = ret.concat(list)
    }
    return ret
  },
  and: (a, b) => {
    return a && b
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
  'number->string': x => x + '',
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
  'boolean->string': x => x + '',
  'boolean=?': (a, b) => a === b,
  'boolean?': x => x === true || x === false,
  'false?': x => x === false,
  'symbol->string': x => x,
  'symbol=?': (x, y) => x === y,
  'symbol?': x => typeof x === 'string' && x.split(' ').length === 1,
  assoc: (x, l) => {
    for (pair of l) {
      if (pair[0] === x) {
        return pair
      }
    }
    return false
  },
  assq: (x, l) => {
    for (pair of l) {
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
    let ret = []
    for (let i = 0; i < n; i++) {
      ret.push(x)
    }
    return ret
  },
  member: (x, l) => l.includes(x),
  'member?': (x, l) => l.includes(x),
  remove: (x, l) => {
    let ret = [].concat(l)
    let idx = ret.indexOf(x)
    if (idx >= 0) {
      return ret.splice(idx, 1)
    }
    return ret
  },
  'remove-all': (x, l) => l.filter(v => v !== x),
  reverse: l => reverse(l),
  explode: s => s.explode(),
  'string->number': x => Number(x),
  'string-append': (...args) => args.join(''),
  'string=?': (a, b) => a === b,
  'string?': x => typeof x === 'string',
  substring: (s, i, j) => s.substring(i, j),
  'equal?': (a, b) => a === b,
  'eqv?': (a, b) => a === b,
  identity: x => x,
  map: (f, l) => l.map(f),
  andmap: (f, l) => l.every(f),
  ormap: (f, l) => l.any(f),
  foldl: (f, init, l) => l.reduce(f, init),
  foldr: (f, init, l) => l.reduceRight(f, init),
  filter: (f, l) => l.filter(f)
})

module.exports = { STANDARD_ENV }
