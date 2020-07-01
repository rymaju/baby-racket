// Heavily inspired by https://norvig.com/lispy.html
// Ryan Jung : June 30th, 2020
// mini-racket: a mini Racket implementation in Javascript

//TODO: add clean tokens a bit better, get rid of whitespace characters like \t and \n
const Env = require('./env')
const STANDARD_ENV = require('./environments').STANDARD_ENV
let testCount = 0

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
    .replace(/\[/g, '(')
    .replace(/\]/g, ')')
    .replace(/\(/g, ' ( ')
    .replace(/\)/g, ' ) ')
    .replace(/\`/g, ' ` ')
    .replace(/\'/g, " ' ")
    .replace(/\,/g, ' , ')
    .split(' ')
    .filter(v => v !== '')

  //console.log(splitInput)
  const tokenTree = treeify(splitInput)
  return tokenTree
}

function treeify (tokens) {
  //console.log(tokens)

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
      // should only pass if it is stricly true
      if (branch[0] === 'else' || eval(branch[0], env) === true) {
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
    const actual = prettify(root[1])
    const expected = prettify(root[2])
    const actualVal = prettify(eval(root[1], env))
    const exptVal = prettify(eval(root[2], env))
    testCount++
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
  } else {
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

function evaluate (exp, env) {
  testCount = 0
  return eval(tokenize(exp), env)
}

function evaluate (exp) {
  testCount = 0
  return eval(tokenize(exp), STANDARD_ENV)
}

function prettify (exp) {
  return prettify(exp, true)
}

function prettify (exp, firstCall) {
  if (exp instanceof Array) {
    return (
      (firstCall ? "'" : '') +
      '(' +
      exp.map(e => prettify(e, false)).join(' ') +
      ')'
    )
  } else if (exp instanceof Function) {
    return '#<procedure>'
  } else if (exp === true) {
    return '#t'
  } else if (exp === false) {
    return '#f'
  } else {
    return exp
  }
}

// console.log(tokenize('(1 2 3 (4 5 (6 7)))'))
// console.log(tokenize('(+ 1 2 (+ 6 5) 2)'))
// console.log(evaluate('(+ 1 2 (+ 6 5) 2)'))
// console.log(evaluate('((lambda (x) x) 1)'))
// console.log(evaluate('((lambda (x) (+ x ((lambda (x) x) 2))) 5)'))
// console.log(evaluate('((lambda (x) x) (+ 1 1))'))
// console.log(evaluate('(list (define x 1) x)'))
// console.log(evaluate('(list (define x (define x 4)) x)'))
// console.log(evaluate('(list (define (x a b c) (+ a b c)) (x 1 2 3))'))
//console.log(tokenize('`(1 2 3 ,x . ,y)'))

// function runREPL () {
//   const readline = require('readline').createInterface({
//     input: process.stdin,
//     output: process.stdout
//   })
//   let env = STANDARD_ENV
//   let loop = env => {
//     readline.question('> ', answer => {
//       console.log(evaluate(answer, env))
//       loop(env)
//     })
//   }
//   loop(env)
// }

// runREPL()

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
  prettyEvaluate: x => prettify(evaluate(x)),
  evaluate,
  prettify
}
