// Heavily inspired by https://norvig.com/lispy.html
// Ryan Jung : June 30th, 2020
// mini-racket: a mini Racket implementation in Javascript
const Vector = require('./vector')
const Env = require('./env')
let STANDARD_ENV = require('./environments').STANDARD_ENV
let testCount = 0
let kanren = true

/**
 * breaks the string into tokens
 * @param {String} rawInput
 */
function tokenize (rawInput) {
  //makes a tree of tokens
  // if youre a value, then youre on this level of the tree
  // if youre a (, then you mark the start of a new level, so recursively call treeify
  // console.log(rawInput)
  const splitInput = rawInput
    .replace(/\n/g, ' ')
    .replace(/\t/g, ' ')
    .replace(/\r/g, ' ')
    .replace(/\"/g, ' " ')
    .replace(/\[/g, '(')
    .replace(/\]/g, ')')
    .replace(/\(/g, ' ( ')
    .replace(/\)/g, ' ) ')
    .replace(/\`/g, ' ` ')
    .replace(/\'/g, " ' ")
    .replace(/\,/g, ' , ')
    .split(' ')
    .filter(v => v !== '')

  // console.log(splitInput)
  const tokenTree = treeify(splitInput)
  // console.log(tokenTree)
  return tokenTree
}

function treeify (tokens) {
  //console.log(tokens)
  if (tokens.length == 0) {
    return undefined
  }

  const token = tokens.shift()
  switch (token) {
    case '(':
      const list = []

      while (tokens.length > 0 && tokens[0] != ')') {
        list.push(treeify(tokens))
      }
      tokens.shift()
      return list
    case ')':
      throw new Error('Unexpected end of file.')
    case '"':
      const words = []

      while (tokens.length > 0 && tokens[0] != '"') {
        words.push(tokens[0])
        tokens.shift()
      }
      tokens.shift()
      //console.log('runs')
      return new String(words.join(' '))
    case '#':
      let vector = []
      vector.push('vector')
      vector = vector.concat(treeify(tokens))
      return vector
    case "'":
      let quote = []
      quote.push('quote')
      quote.push(treeify(tokens))
      return quote
    case '`':
      let quasiquote = []
      quasiquote.push('quasiquote')
      quasiquote.push(treeify(tokens))
      return quasiquote
    case ',':
      let unquote = []
      unquote.push('unquote')
      unquote.push(treeify(tokens))
      return unquote

    default:
      if (!isNaN(token)) {
        //its a number
        return parseFloat(token)
      } else if (token == '#t' || token == 'true') {
        return true
      } else if (token == '#f' || token == 'false') {
        return false
      } else {
        return token
      }
  }
}

function eval (root, env) {
  //console.log(root)
  if (env === undefined || !(env instanceof Env)) {
    console.log(env)
    throw new Error('environment was not defined!')
  }
  //console.log(root)

  //console.log(root instanceof String)
  if (typeof root === 'string') {
    const frame = env.find(root)
    if (frame === undefined) {
      return root
    } else {
      return frame[root]
    }
  } else if (!(root instanceof Array)) {
    //must be a literal
    return root
  } else if (root[0] == 'cond') {
    // root[1...n] are branches,
    // each branch is a pair whose first is an exp and rest is an exp
    // if the first exp evaluates to true then return the evaluated rest exp
    //
    for (let i = 1; i < root.length; i++) {
      const branch = root[i]
      // should only pass if it is not false
      if (branch[0] === 'else' || eval(branch[0], env) !== false) {
        return eval(branch[1], env)
      }
    }
  } else if (root[0] == 'let') {
    if (root[1] instanceof Array) {
      const bindings = root[1]
      const exp = root[2]
      const newFrame = {}
      for (binding of bindings) {
        newFrame[binding[0]] = eval(binding[1], env)
      }
      return eval(exp, new Env(newFrame, env))
    } else {
      const funcName = root[1]
      const initArgs = root[2]
      const exp = root[3]

      const params = initArgs.map(pair => pair[0])
      const initialVals = initArgs.map(pair => eval(pair[1], env))
      const func = makeLambda(params, exp, env)
      env.set(funcName, func)
      return func(...initialVals)
    }
  } else if (root[0] == 'quote') {
    return root[1]
    //how to do quasi quote?
    // search through tree until unquote?? then eval??
  } else if (root[0] == 'unquote') {
    return eval(root[1], env)
  } else if (root[0] == 'quasiquote') {
    return unquote(root[1], env)
  } else if (root[0] === 'if') {
    const test = root[1]
    const branch1 = root[2]
    const branch2 = root[3]

    if (eval(test, env)) {
      return eval(branch1, env)
    } else {
      return eval(branch2, env)
    }
  } else if (root[0] === 'check-equal?') {
    testCount++
    const actual = prettify(root[1])
    const expected = prettify(root[2])
    let actualVal
    let exptVal
    try {
      actualVal = prettify(eval(root[1], env))
      exptVal = prettify(eval(root[2], env))
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
    const exp = root[2]
    if (symbol instanceof Array) {
      const name = symbol[0]
      const params = symbol.slice(1)
      env.set(name, makeLambda(params, exp, env))
    } else {
      env.set(symbol, eval(exp, env))
    }
    return undefined
  } else if (root[0] === 'lambda') {
    const params = root[1]
    const exp = root[2]
    return makeLambda(params, exp, env)
  }
  //------------------MINIKANREN---------------------
  else if (root[0] == 'disj') {
    if (root.length == 1) {
      return eval('#u', env)
    } else if (root.length == 2) {
      return eval(root[1], env)
    } else {
      return eval(
        ['disj2', root[1], eval(['disj', ...root.slice(2)], env)],
        env
      )
    }
  } else if (kanren && root[0] == 'conj') {
    if (root.length == 1) {
      return eval(['==', true, true], env)
    } else if (root.length == 2) {
      return eval(root[1], env)
    } else {
      return eval(
        ['conj2', root[1], eval(['conj', ...root.slice(2)], env)],
        env
      )
    }
  } else if (kanren && root[0] == 'defrel') {
    const params = root[1]
    const goals = root.slice(2)
    eval(
      [
        'define',
        params,
        ['lambda', ['s'], ['lambda', [], [['conj', ...goals], 's']]]
      ],
      env
    )
  } else if (kanren && root[0] == 'run') {
    const n = root[1]
    const query = root[2]
    const goals = root.slice(3)

    console.log('root: ' + root)
    console.log(goals)

    if (query instanceof Array) {
      console.log(query)
      console.log(query.includes('_q'))
      if (query.includes('_q')) {
        throw new Error(
          '_q is a protected query name! Please pick another name.'
        )
      }

      let quotedQuery = ['quasiquote', query.map(v => ['unquote', v])]
      console.log(
        prettify([
          'run',
          n,
          '_q',
          ['fresh', query, ['==', '_q', quotedQuery]],
          ...goals
        ])
      )
      return eval(
        ['run', n, '_q', ['fresh', query, ['==', '_q', quotedQuery], ...goals]],
        env
      )
    } else {
      return eval(
        [
          'let',
          [[query, ['var', ['quote', query]]]],
          ['map', ['reify', query], ['run-goal', n, ['conj', ...goals]]]
        ],
        env
      )
    }
  } else if (kanren && root[0] == 'run*') {
    return eval(['run', false, root[1], ...root.slice(2)], env)
  } else if (kanren && root[0] == 'fresh') {
    const freshVars = root[1]
    const goals = root.slice(2)
    const freshFrame = {}

    for (let x of freshVars) {
      freshFrame[x] = eval(['var', x], env)
    }
    return eval(['conj', ...goals], new Env(freshFrame, env))
  } else if (kanren && root[0] == 'conde') {
    const cond = ['disj']
    for (let i = 1; i < root.length; i++) {
      cond.push(['conj', ...root[i]])
    }
    return eval(cond, env)
  } else if (kanren && root[0] == 'conda') {
    const goals = root[1]
    if (root.length == 2) {
      return eval(['conj', ...goals], env)
    } else {
      const g0 = goals[0]
      const ln = root[3]
      const rest = root.slice(4)
      return eval(
        ['ifte', g0, ['conj', ...goals.slice(1)], ['conda', ln, ...rest]],
        env
      )
    }
  } else if (kanren && root[0] == 'condu') {
    const goals = root[1]
    return eval(
      ['conda', [['once', goals[0]], ...goals.slice(1)], ...root.slice(2)],
      env
    )
  } else if (kanren && root[0] == '#s') {
    return eval(['==', true, true], env)
  } else if (kanren && root[0] == '#u') {
    return eval(['==', true, false], env)
  }
  //----------------------END---------------------
  else {
    const proc = eval(root[0], env)
    const args = root.slice(1).map(arg => eval(arg, env))

    if (!(proc instanceof Function)) {
      throw new TypeError(root[0] + ':' + proc + ' isnt a function.')
    }
    return proc(...args)
  }
}

function makeLambda (params, exp, env) {
  return (...args) => {
    let newFrame = {}
    for (let i = 0; i < args.length; i++) {
      newFrame[params[i]] = args[i]
    }
    return eval(exp, new Env(newFrame, env))
  }
}

function evaluate (exp, options = {}) {
  testCount = 0

  let env = options.env ||  STANDARD_ENV.clone()
  console.log(options)
  kanren = options.kanren ? true : false
  console.log(kanren)

  if (kanren) {
    eval(tokenize('(list ' + require('./minikanren') + ')'), env)
  }

  return eval(tokenize(exp), env)
}

function prettify (exp) {
  return prettify(exp, true)
}

function prettify (exp, firstCall = true) {
  if (exp == undefined) {
    return ''
  } else if (exp instanceof Array) {
    return (
      (firstCall ? "'" : '') +
      '(' +
      exp.map(e => prettify(e, false)).join(' ') +
      ')'
    )
  } else if (exp instanceof Function) {
    return '#<procedure>'
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
      return eval(root[1], env)
    }
    return root.map(v => unquote(v, env))
  }
  return root
}

module.exports = {
  prettyEvaluate: (...args) => prettify(evaluate(...args)),
  evaluate,
  prettify,
  STANDARD_ENV
}
