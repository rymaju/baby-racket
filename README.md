[![npm version](https://badge.fury.io/js/baby-racket.svg)](https://badge.fury.io/js/baby-racket)

# baby-racket

A subset of Racket created entirely in Javascript without external dependencies. The goal of this project is to create a suitable substitute language for Racket's Student Languages and the Scheme used in The Reasoned Schemer Second Edition.

Tabs and comments are not supported within `evaluate` yet, but can easily be added externally (see IDE below).

[**Link to In-Browser IDE**](https://baby-racket.netlify.app)

```
import {prettyEvaluate, evaluate, prettify} from 'baby-racket';


prettyEvaluate("'((+ 1 1) (* 4 4))") // -> '(2 16)

evaluate("'((+ 1 1) (\* 4 4))") // -> [2, 16]
prettify(evaluate("'((+ 1 1) (\* 4 4))")) // -> '(2 16) : equivalent to prettyEvaluate
```
