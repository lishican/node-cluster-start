const net = require("net");
const child_process = require("child_process");
const fs = require("fs");
const path = require("path");
const { Writable } = require("stream");
const { Stream, decode, encode } = require("amp");

function pingDaemon() {
  let socket = net.createConnection({
    host: "127.0.0.1",
    port: 6722
  });
  socket.setTimeout(3000);
  socket.on("timeout", data => {
    lanchDaemon();
  });
}

// if(process.argv[2]=='start'){

//   lanchDaemon();
// }else{
//   process.kill(fs.readFileSync('./pid','utf8'),'SIGINT')
// }

function lanchDaemon() {
  let out = fs.openSync("./app.log", "a");
  let err = fs.openSync("./error.log", "a");
  let clild = child_process.spawn("node", ["./daemon.js"], {
    env: {
      testy: 123
    },
    stdio: ["ipc", out, err],
    detached: true,
    silent: false,
    windowsHide: true
  });
  clild.once("message", data => {
    console.log("daemon receive ", data);
    clild.disconnect();
  });
  clild.unref();
}

function getSockets(sp, cb) {
  try {
    socket = fs.readdirSync(sp);
    console.log(socket);
    cb(socket);
  } catch (error) {
    console.log(error.code);
    console.log(error.message);
    fs.mkdirSync(sp);
    fs.chmodSync(sp, 775);
    let socket = fs.readdirSync(sp);
    cb(socket);
  }
}

let server = net.createServer(socket => {
  console.log("socket in");
  socket.end("hellow");
  let parse = new Stream();
  socket.pipe(parse);
  parse.on("data", data => {
    console.log("server receive", decode(data).toString());
  });
  // socket.on('data',data=>{
  //   console.log('server receive',data.toString())
  // })
});
let sock = path.join("./sock/", "daemon");

if (process.platform == "win32") {
  // 解决window eaccess 原因不知道
  fs.openSync(sock, "w");
  sock = "\\\\.\\pipe\\" + sock;
}

server.listen(sock);

console.log();

let client = new net.Socket();
getSockets("./sock", data => {
  console.log(path.join("./sock/", data[0]));
  let sp = path.join("./sock/", data[0]);
  if (process.platform == "win32") {
    sp = "\\\\.\\pipe\\" + sp;
  }
  client.connect(sp);
  client.write(encode([Buffer.from("231939129")]));
  client.on("data", data => {
    console.log(data.toString());
  });
});
