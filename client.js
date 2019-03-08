const net = require("net");

const readline = require("readline");
const rl = readline.createInterface(process.stdin, process.stdout);
let sock = net.createConnection(
  {
    host: "127.0.0.1",
    port: 3000
  },
  () => {
    sock.on("data", data => {
      console.log("client receive data", data);
    });
  }
);
rl.on("line", data => {
  sock.write(Buffer.from(data));
});
