module.exports = `

(define (var? x) (vector? x))

(define (var x) (vector x))

(define empty-s '()) 

(define (walk v s)
  (let [(a (and (var? v) (assv v s)))]
    (cond
      [(pair? a)(walk (cdr a) s)]
      [else v])))

(define (occurs? x v s)
  (let [(v (walk v s))]
    (cond
      [(var? v) (eqv? v x)]
      [(pair? v)
       (or (occurs? x (car v) s)
           (occurs? x (cdr v) s))]
      [else #f])))

(define (ext-s x v s)
  (cond
    [(occurs? x v s) #f]
    [else (cons \`(,x . ,v) s)]))

(define (unify u v s)
  (let [(u (walk u s)) (v (walk v s))]
    (cond
      [(eqv? u v) s]
      [(var? u) (ext-s u v s)]
      [(var? v) (ext-s v u s)]
      [(and (pair? u) (pair? v))
       (let [(s (unify (car u) (car v) s))]
         (and s
              (unify (cdr u) (cdr v) s)))]
      [else #f])))

(define (== u v)
  (lambda (s)
    (let [(s (unify u v s))]
      (if s \`(,s) '()))))

(define succeed
  (lambda (s)
    \`(,s)))

(define fail
  (lambda (s)
    \`()))

(define (append-inf s-inf t-inf)
  (cond
    [(null? s-inf) t-inf]
    [(pair? s-inf)
     (cons (car s-inf)
           (append-inf (cdr s-inf) t-inf))]
    [else (lambda ()
            (append-inf t-inf (s-inf)))]))

(define (disj2 g1 g2)
  (lambda (s)
    (append-inf (g1 s) (g2 s))))

(define (nevero)
  (lambda (s)
    (lambda ()
      ((nevero) s))))

(define (alwayso)
  (lambda (s)
    (lambda ()
      ((disj2 succeed (alwayso)) s))))

(define (take-inf n s-inf)
  (cond
    [(and n (zero? n)) '()]
    [(null? s-inf) '()]
    [(pair? s-inf)
     (cons (car s-inf)
           (take-inf (and n (- n 1))
                      (cdr s-inf)))]
    [else (take-inf n (s-inf))]))

(define (append-map-inf g s-inf)
  (cond
    [(null? s-inf) '()]
    [(pair? s-inf)
     (append-inf (g (car s-inf))
                 (append-map-inf g (cdr s-inf)))]
    [else (lambda ()
            (append-map-inf g (s-inf)))]))


(define (conj2 g1 g2)
  (lambda (s)
    (append-map-inf g2 (g1 s))))

(define (call/fresh name f)
  (f (var name)))

(check-equal? (take-inf 1 ((call/fresh 'kiwi (lambda (fruit) (== fruit 'plum))) empty-s))
              \`(((,(var 'kiwi) . plum))))


(define (reify-name n)
  (string->symbol
   (string-append "_"
                  (number->string n))))

(define (walk* v s)
  (let [(v (walk v s))]
    (cond
      [(var? v) v]
      [(pair? v)
       (cons
        (walk* (car v) s)
        (walk* (cdr v) s))]
      [else v])))


(define (reify-s v r)
  (let [(v (walk v r))]
    (cond
      [(var? v)
       (let [(n (length r))]
         (let [(rn (reify-name n))]
           (cons \`(,v . ,rn) r)))]
      [(pair? v)
       (let [(r (reify-s (car v) r))]
             (reify-s (cdr v) r))]
      [else r])))

(define (reify v)
  (lambda (s)
    (let [(v (walk* v s))]
      (let [(r (reify-s v empty-s))]
        (walk* v r)))))


(define (run-goal n g)
  (take-inf n (g empty-s)))

(define (ifte g1 g2 g3)
  (lambda (s)
     (let loop ([s-inf (g1 s)])
       (cond
         [(null? s-inf) (g3 s)]
         [(pair? s-inf)
          (append-map-inf g2 s-inf)]
         [else (lambda ()
                      (loop (s-inf)))]))))

(define (once g)
  (lambda (s)
         (let loop ([s-inf (g s)])
           (cond
             [(null? s-inf) '()]
             [(pair? s-inf)
              (cons (car s-inf) '())]
             [else (lambda ()
                     (loop (s-inf)))]))))


(defrel (conso f r out)
  (== (cons f r) out))


(defrel (caro l out)
  (fresh (r)
         (conso out r l)))

(defrel (cdro l out)
  (fresh (f)
         (conso f out l)))

(defrel (nullo l)
  (conde
   [(== l '())]))

(defrel (appendo l t out)
  (conde
   [(nullo l)(== t out)]
   [(fresh (a d res)
           (conso a d l)
           (conso a res out)
           (appendo d t res))]))

(defrel (conso f r out)
  (== (cons f r) out))


(defrel (caro l out)
  (fresh (r)
         (conso out r l)))

(defrel (cdro l out)
  (fresh (f)
         (conso f out l)))

(defrel (nullo l)
  (conde
   [(== l '())]))

(defrel (appendo l t out)
  (conde
   [(nullo l)(== t out)]
   [(fresh (a d res)
           (conso a d l)
           (conso a res out)
           (appendo d t res))]))

`
//(run 5 (q w e) (appendo q w e))