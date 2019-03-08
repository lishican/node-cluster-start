const net = require("net");

var ignore = [
  "ECONNREFUSED",
  "ECONNRESET",
  "ETIMEDOUT",
  "EHOSTUNREACH",
  "ENETUNREACH",
  "ENETDOWN",
  "EPIPE",
  "ENOENT"
];
let server = net.createServer(socket => {
  socket
    .on("data", data => {
      console.log("server receive", data + "".toString());
    })
    .on("error", err => {
      console.log(err.code);
    });

  socket.on("connect", () => {
    console.log("2132131");
  });
});

server.listen(3000);

console.log(server.address());
