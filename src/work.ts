const gracefulExit = require("graceful-process");

const Koa = require("koa");
const cluster = require("cluster");
var graceful = require("graceful");
console.log("我是工作的", process.pid);

let app = new Koa();
app.use(async ctx => {
  console.log(21);
  ctx.body = {
    name: "lishica"
  };
  process.send({
    to: "agent",
    id: process.pid,
    data: " ctx.request"
  });
});
app.listen(3000);
app.on("error", err => {
  console.log("app err");
  console.log(err);
  process.kill(process.pid, 0);
});

setInterval(() => {
  process.send({
    to: "common",
    type: "logger",
    data: process.pid + "这个是logger"
  });
}, 3000);

gracefulExit({
  logger: console,
  label: "agent_worker",
  beforeExit: () => {
    console.log("我要退出啦");
  }
});

// servers.forEach(function (server) {
//   if (server instanceof http.Server) {
//     server.on('request', function (req, res) {
//       // Let http server set `Connection: close` header, and close the current request socket.
//       req.shouldKeepAlive = false;
//       res.shouldKeepAlive = false;
//       if (!res._header) {
//         res.setHeader('Connection', 'close');
//       }
//     });
//   }
// });
process.on("unhandledRejection", (reason, p) => {
  console.log("未处理的 rejection：", p, "原因：", reason);
  // 记录日志、抛出错误、或其他逻辑。
});

/* process.on('SIGINT', () => {
  console.info('SIGINT signal received.')

  // Stops the server from accepting new connections and finishes existing connections.
  server.close(function (err) {
    // if error, log and exit with error (1 code)
    if (err) {
      console.error(err)
      process.exit(1)
    }

    // close your database connection and exit with success (0 code)
    // for example with mongoose
    mongoose.connection.close(function () {
      console.log('Mongoose connection disconnected')
      process.exit(0)
    })
  })
}) */