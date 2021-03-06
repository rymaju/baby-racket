const { evaluate, STANDARD_ENV, evaluateFile } = require('./baby-racket')

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

test('evaluateFile', () => {
  let env = STANDARD_ENV.clone()
  expect(
    evaluateFile(
      `(define fib
                      (lambda (n)
                          (if (< n 2)
                              1
                              (+ (fib (- n 1)) (fib (- n 2))))))
                    
        (fib 20)
        (check-expect (fib 20) 10946)`,
      { env }
    )
  ).toStrictEqual(['', 10946, ''])
})
