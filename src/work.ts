const gracefulExit = require("graceful-process");

const Koa = require("koa");
const cluster = require("cluster");
console.log(cluster.worker.process.pid);
console.log("worker2");
var graceful = require("graceful");

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

gracefulExit({
  logger: console,
  label: "agent_worker",
  beforeExit: () => {
    console.log("我要退出啦");
  }
});
