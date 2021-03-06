[![npm version](https://badge.fury.io/js/baby-racket.svg)](https://badge.fury.io/js/baby-racket)

# [baby-racket](https://github.com/rymaju/baby-racket)

A subset of Racket created entirely in Javascript without external dependencies. The goal of this project is to create a suitable substitute language for Racket's Student Languages.

Currently implemented:
- Numbers & Arithmetic
- Structs
- Vectors
- Strings
- Symbols
- Booleans
- Proper lists
- Recursion
- Lambdas
- Local definitions
- Conditional branching (cond, if)
- check-expect / check-equal?


## [**Link to In-Browser IDE**](https://baby-racket.netlify.app)

NOTE: 
- this project no longer supports the "mykanren" implementation of minikanren as of version 2.0.0
- check-expect actually functions more like check-equal? and both refer to the same function under the hood

TODO:
- Proper string parsing so " this string " doesnt get parsed as "this string". (see .split(' '))

```
import {prettyEvaluate, evaluate, prettify, STANDARD_ENV} from 'baby-racket';

prettyEvaluate("'((+ 1 1) (* 4 4))") // -> '(2 16)

evaluate("'((+ 1 1) (\* 4 4))") // -> [2, 16]
prettify(evaluate("'((+ 1 1) (\* 4 4))")) // -> '(2 16) : equivalent to prettyEvaluate

// custom env
let myEnv = STANDARD_ENV.clone()

... do things with myEnv ...

// with custom environment and minikanren mode on
evaluate("'((+ 1 1) (\* 4 4))" , {env: myEnv})

// if you want to evaluate an entire file instead of a single expression, use evaluateFile
// you will get an array of each expression in the file in order of appearance
evaluateFile("(+ 1 1) (+ 1 1)", {env: myEnv}) // -> [2, 2]

```
