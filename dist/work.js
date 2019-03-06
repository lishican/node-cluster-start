var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
setInterval(() => { }, 1e5);
process.on("message", data => {
    console.log(`我是工作进程:${process.pid},标签：${process.argv[3]} \n `, data);
});
// setTimeout(() => {
//   process.exit(110);
// }, 3000);
// process.send({
//   to: "agent",
//   data: {
//     cmd: "logger",
//     data: new Date().toLocaleDateString()
//   }
// });
// const gracefulExit = require("graceful-process");
const Koa = require("koa");
const http = require("http");
// const cluster = require("cluster");
// var graceful = require("graceful");
// console.log("我是工作的", process.pid);
let app = new Koa();
app.use((ctx) => __awaiter(this, void 0, void 0, function* () {
    // console.log(`我是工作进程:${process.pid},标签：${process.argv[3]} \n `);
    ctx.body = {
        name: "lishica"
    };
}));
let server = http.createServer(app.callback()).listen(3000);
function heapWatch() {
    (function () {
        // 记录Promise链的长度
        var i = 0;
        function run() {
            return new Promise(function (resolve) {
                // 每增加10000个Promise打印一次内存使用情况
                if (i % 10000 === 0)
                    console.log(i);
                i++;
                // 模拟一个异步操作
                setTimeout(function () {
                    // 100000个Promise之后退出
                    if (i === 10000 * 10)
                        return resolve();
                    // 如果resolve的参数是一个Promise，外层Promise将接管这个Promise的状态，构成嵌套Promise
                    resolve(run());
                }, 0);
            }).then(function () { });
        }
        run();
    })();
    let timer = setInterval(() => {
        console.log("heapUsed", process.memoryUsage().heapUsed / 1024 / 1024 + "m");
        if (process.memoryUsage().heapUsed > 10 * 1024 * 1024) {
            process.exit(120);
            clearInterval(timer);
        }
    }, 200);
}
process.on("exit", code => {
    console.log(`我是工作进程:${process.pid},标签：${process.argv[3]},退出码: ${code}`);
    server.close();
});
// setInterval(() => {
//   process.send({
//     to: "common",
//     type: "logger",
//     data: process.pid + "这个是logger"
//   });
// }, 3000);
// gracefulExit({
//   logger: console,
//   label: "agent_worker",
//   beforeExit: () => {
//     console.log("我要退出啦");
//   }
// });
// // servers.forEach(function (server) {
// //   if (server instanceof http.Server) {
// //     server.on('request', function (req, res) {
// //       // Let http server set `Connection: close` header, and close the current request socket.
// //       req.shouldKeepAlive = false;
// //       res.shouldKeepAlive = false;
// //       if (!res._header) {
// //         res.setHeader('Connection', 'close');
// //       }
// //     });
// //   }
// // });
// process.on("unhandledRejection", (reason, p) => {
//   console.log("未处理的 rejection：", p, "原因：", reason);
//   // 记录日志、抛出错误、或其他逻辑。
// });
// /* process.on('SIGINT', () => {
//   console.info('SIGINT signal received.')
//   // Stops the server from accepting new connections and finishes existing connections.
//   server.close(function (err) {
//     // if error, log and exit with error (1 code)
//     if (err) {
//       console.error(err)
//       process.exit(1)
//     }
//     // close your database connection and exit with success (0 code)
//     // for example with mongoose
//     mongoose.connection.close(function () {
//       console.log('Mongoose connection disconnected')
//       process.exit(0)
//     })
//   })
// }) */
//# sourceMappingURL=work.js.map