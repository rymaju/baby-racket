// Heavily inspired by https://norvig.com/lispy.html
// Ryan Jung : June 30th, 2020
// mini-racket: a mini Racket implementation in Javascript
const Vector = require('./vector')
const Env = require('./env')
const Struct = require('./struct')

const STANDARD_ENV = require('./environments').STANDARD_ENV
let testCount = 0
let expandedCons = true

/**
 * breaks the string into tokens
 * @param {String} rawInput
 */
function tokenize (rawInput) {
  // makes a tree of tokens
  // if youre a value, then youre on this level of the tree
  // if youre a (, then you mark the start of a new level, so recursively call treeify
  const splitInput = rawInput
    .replace(/\n/g, ' ')
    .replace(/\t/g, ' ')
    .replace(/\r/g, ' ')
    .replace(/"/g, ' " ')
    .replace(/\[/g, '(')
    .replace(/\]/g, ')')
    .replace(/\(/g, ' ( ')
    .replace(/\)/g, ' ) ')
    .replace(/`/g, ' ` ')
    .replace(/'/g, " ' ")
    .replace(/,/g, ' , ')
    .split(' ')
    .filter(v => v !== '')

  const tokenTree = treeify(splitInput)
  return tokenTree
}

function treeify (tokens) {
  if (tokens.length === 0) {
    return undefined
  }

  const token = tokens.shift()
  if (token === '(') {
    const list = []

    while (tokens.length > 0 && tokens[0] !== ')') {
      list.push(treeify(tokens))
    }
    tokens.shift()
    return list
  } else if (token === ')') {
    throw new Error('Unexpected end of file.')
  } else if (token === '"') {
    const words = []

    while (tokens.length > 0 && tokens[0] !== '"') {
      words.push(tokens[0])
      tokens.shift()
    }
    tokens.shift()
    return new String(words.join(' '))
  } else if (token === '#') {
    let vector = []
    vector.push('vector')
    vector = vector.concat(treeify(tokens))
    return vector
  } else if (token === "'") {
    const quote = []
    quote.push('quote')
    quote.push(treeify(tokens))
    return quote
  } else if (token === '`') {
    const quasiquote = []
    quasiquote.push('quasiquote')
    quasiquote.push(treeify(tokens))
    return quasiquote
  } else if (token === ',') {
    const unquote = []
    unquote.push('unquote')
    unquote.push(treeify(tokens))
    return unquote
  } else {
    if (!isNaN(token)) {
      // its a number
      return parseFloat(token)
    } else if (token === '#t' || token === 'true') {
      return true
    } else if (token === '#f' || token === 'false') {
      return false
    } else {
      return token
    }
  }
}

function evalExpr (root, env) {
  if (env === undefined || !(env instanceof Env)) {
    throw new Error('Environment was not defined!')
  }

  if (typeof root === 'string') {
    const frame = env.find(root)
    if (frame === undefined) {
      throw Error(`${root} is undefined!`)
    } else {
      return frame[root]
    }
  } else if (!(root instanceof Array)) {
    // must be a literal
    return root
  } else if (root[0] === 'cond') {
    // root[1...n] are branches,
    // each branch is a pair whose first is an exp and rest is an exp
    // if the first exp evaluates to true then return the evaluated rest exp
    //
    for (let i = 1; i < root.length; i++) {
      const branch = root[i]
      // should only pass if it is not false
      if (branch[0] === 'else' || evalExpr(branch[0], env) !== false) {
        return evalExpr(branch[1], env)
      }
    }
  } else if (root[0] === 'let') {
    if (root[1] instanceof Array) {
      const bindings = root[1]
      const exp = root[2]
      const newFrame = {}
      for (const binding of bindings) {
        newFrame[binding[0]] = evalExpr(binding[1], env)
      }
      return evalExpr(exp, new Env(newFrame, env))
    } else {
      const funcName = root[1]
      const initArgs = root[2]
      const exp = root[3]

      const params = initArgs.map(pair => pair[0])
      const initialVals = initArgs.map(pair => evalExpr(pair[1], env))
      const func = makeLambda(params, exp, env)
      env.set(funcName, func)
      return func(...initialVals)
    }
  } else if (root[0] === 'quote') {
    return root[1]
  } else if (root[0] === 'unquote') {
    return evalExpr(root[1], env)
  } else if (root[0] === 'quasiquote') {
    return unquote(root[1], env)
  } else if (root[0] === 'if') {
    const test = root[1]
    const branch1 = root[2]
    const branch2 = root[3]

    if (evalExpr(test, env)) {
      return evalExpr(branch1, env)
    } else {
      return evalExpr(branch2, env)
    }
  } else if (root[0] === 'check-equal?') {
    testCount++
    const actual = prettify(root[1])
    const expected = prettify(root[2])
    let actualVal
    let exptVal
    try {
      actualVal = prettify(evalExpr(root[1], env))
      exptVal = prettify(evalExpr(root[2], env))
    } catch (err) {
      throw new Error(
        `Test ${testCount} Failed\nat (check-equal? ${actual} ${expected})\nactual:   ${actualVal}\nexpected: ${exptVal} `
      )
    }
    if (actualVal === exptVal) {
      return undefined
    } else {
      throw new Error(
        `Test ${testCount} Failed\nat (check-equal? ${actual} ${expected})\nactual:   ${actualVal}\nexpected: ${exptVal} `
      )
    }
  } else if (root[0] === 'define') {
    const symbol = root[1]

    // only check definition at this environment frame
    if (env.get(symbol) !== undefined) {
      throw new Error(`${symbol} is already defined as ${env.get(symbol)}`)
    }

    const exp = root[2]
    if (symbol instanceof Array) {
      const name = symbol[0]
      const params = symbol.slice(1)
      env.set(name, makeLambda(params, exp, env))
    } else {
      env.set(symbol, evalExpr(exp, env))
    }
    return undefined
  } else if (root[0] === 'lambda') {
    const params = root[1]
    const exp = root[2]
    return params, exp, env
  } else if (root[0] === 'define-struct') {
    const name = root[1]
    const fields = root[2]
    env.set(`make-${name}`, (...args) => {
      return new Struct(name, fields, args)
    })

    env.set(`${name}?`, struct => {
      return struct instanceof Struct && struct.name === name
    })

    env.set(`${name}=?`, (struct1, struct2) => {
      return struct1.equals(struct2)
    })

    for (const field of fields) {
      env.set(`${name}-${field}`, struct => {
        return struct.get(field)
      })
    }
  } else if (root[0] === 'local') {
    //local definitions (local [(define x y) (define a b) ...] exp)
    const definitions = root[1]
    const exp = root[2]

    let newEnv = new Env({}, env)

    for (const defintion of definitions) {
      if (defintion[0] !== 'define') {
        throw new Error(
          `Local defintion incomplete, expected a "define", got ${defintion[0]}`
        )
      }
      evalExpr(defintion, newEnv)
    }

    return evalExpr(exp, newEnv)
  } else {
    const proc = evalExpr(root[0], env)
    const args = root.slice(1).map(arg => evalExpr(arg, env))

    if (!(proc instanceof Function)) {
      throw new TypeError(root[0] + ':' + proc + ' isnt a function.')
    }
    return proc(...args)
  }
}

function makeLambda (params, exp, env) {
  return (...args) => {
    const newFrame = {}
    for (let i = 0; i < args.length; i++) {
      newFrame[params[i]] = args[i]
    }
    return evalExpr(exp, new Env(newFrame, env))
  }
}

function evaluate (exp, options = {}) {
  testCount = 0

  const env = options.env || STANDARD_ENV.clone()

  return evalExpr(tokenize(exp), env)
}

function prettify (exp, expandCons = false) {
  expandedCons = expandCons
  return prettifyHelper(exp, true)
}

function prettifyHelper (exp, firstCall = true) {
  if (exp === undefined) {
    return ''
  } else if (exp instanceof Array) {
    if (expandedCons) {
      return printCons(exp)
    } else {
      return (
        (firstCall ? "'" : '') +
        '(' +
        exp.map(e => prettifyHelper(e, false)).join(' ') +
        ')'
      )
    }
  } else if (exp instanceof Function) {
    return '#<procedure>'
  } else if (exp instanceof Struct) {
    let values = ''
    for (const field of Object.keys(exp.fields)) {
      values += ' '
      values += prettifyHelper(exp.fields[field], false)
    }

    return `(make-${exp.name}${values})`
  } else if (exp instanceof Vector) {
    return (firstCall ? "'" : '') + '#' + prettify(exp.list, false)
  } else if (exp === true) {
    return '#t'
  } else if (exp === false) {
    return '#f'
  } else if (exp instanceof String) {
    return `"${exp.toString()}"`
  } else if (typeof exp === 'string') {
    return (firstCall ? "'" : '') + exp
  } else {
    return exp
  }
}

function unquote (root, env) {
  if (root instanceof Array) {
    if (root[0] === 'unquote') {
      return evalExpr(root[1], env)
    }
    return root.map(v => unquote(v, env))
  }
  return root
}

function printCons (l) {
  if (l.length === 0) {
    return 'empty'
  }
  return `(cons ${prettifyHelper(l[0], false)} ${printCons(l.slice(1))})`
}

module.exports = {
  evaluate: (exp, options = { env: STANDARD_ENV.clone() }) =>
    prettify(evaluate(exp, options), !!options.expandCons),
  STANDARD_ENV,
  Env
}
