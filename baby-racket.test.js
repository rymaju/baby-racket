const { evaluate, STANDARD_ENV } = require('./baby-racket')

test('(+ 2 2) -> 4', () => {
  expect(evaluate('(+ 2 2)')).toBe(4)
})

test('structs', () => {
  let env = STANDARD_ENV.clone()
  expect(evaluate('(define-struct person [name age])', { env })).toBe('')
  expect(evaluate('(make-person "ryan" 19)', { env })).toBe(
    '(make-person "ryan" 19)'
  )
  expect(evaluate('(define-struct person [name age])', { env })).toBe('')
})

test('local', () => {
  let env = STANDARD_ENV.clone()
  expect(
    evaluate(
      `(define (x y)
        (local [(define x 5) (define z (+ x 2))]
          (+ y x z)))`,
      { env }
    )
  ).toBe('')

  expect(evaluate(`(x 5)`, { env })).toBe(17)
})
