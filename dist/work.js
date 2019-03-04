var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const gracefulExit = require("graceful-process");
const Koa = require("koa");
const cluster = require("cluster");
console.log(cluster.worker.process.pid);
console.log("worker2");
var graceful = require("graceful");
let app = new Koa();
app.use((ctx) => __awaiter(this, void 0, void 0, function* () {
    console.log(21);
    ctx.body = {
        name: "lishica"
    };
    process.send({
        to: "agent",
        id: process.pid,
        data: " ctx.request"
    });
}));
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
//# sourceMappingURL=work.js.map