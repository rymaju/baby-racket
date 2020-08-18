const br = require('./baby-racket')

function runREPL () {
  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  })
  const env = br.STANDARD_ENV.clone()

  const loop = env => {
    readline.question('> ', answer => {
      console.log(br.evaluate(answer, { env }))
      loop(env)
    })
  }
  loop(env)
}

runREPL()
