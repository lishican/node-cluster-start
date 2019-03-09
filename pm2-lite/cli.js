const net = require("net");
const child_process = require("child_process");
const fs = require("fs");

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


if(process.argv[2]=='start'){

  lanchDaemon();
}else{
  process.kill(fs.readFileSync('./pid','utf8'),'SIGINT')
}
setTimeout(() => {
  process.exit(0);
}, 500);
function lanchDaemon() {
  let clild = child_process.spawn("node", ["./daemon.js"], {
    env: {
      testy: 123
    },
    stdio: ["ipc", null, null],
    detached: true,
    silent: false,
    windowsHide: true
  });

  // clild.on('message',data=>{
  //   console.log('daemon receive ',data)
  // })
  clild.unref();


}
