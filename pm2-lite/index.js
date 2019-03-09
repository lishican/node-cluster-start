const http = require("http");

const fs = require("fs");



let stdout = fs.createWriteStream('./app.log', { flags : 'a' });

process.stdout.write = (write => {
  return (string, encoding, fd) => {
    stdout.write(string.toString())
    process.send({
      cmd: "log:",
      data: string.toString()
    });
  };
})(process.stdout.write);

let app = http
  .createServer((req, res) => {
    res.end(process.argv[3]);

  })
  .listen(process.argv[5]);

if (typeof process.send == "function") {
  process.send({
    cmd: "213"
  });
}



process.on('uncaughtException',(err)=>{
  console.log(err)
  app.connection = false
  app.close(()=>{
    process.exit(1)
  })
})

process.on('SIGTERM',()=>{
  console.log('我被关掉啦')
})