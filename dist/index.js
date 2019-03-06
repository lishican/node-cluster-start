"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const events_1 = require("events");
const child_process_1 = __importDefault(require("child_process"));
const path = __importStar(require("path"));
const cluster_1 = __importDefault(require("cluster"));
const mannger_1 = __importDefault(require("./lib/mannger"));
const fs_1 = __importDefault(require("fs"));
function logger(msg) {
    console.log(msg);
}
const defer = setImmediate || process.nextTick;
class BootStrap extends events_1.EventEmitter {
    constructor(options) {
        super();
        this.limit = 0;
        this.isClosed = false;
        this.isStarting = false;
        this.manger = new mannger_1.default();
        this.log = logger;
        this.options = options;
        this.once("agent-start", () => {
            this.forkWorkerApp();
        });
        process.once("SIGINT", this.onSignal.bind(this, "SIGINT"));
        // kill(3) Ctrl-\
        process.once("SIGQUIT", this.onSignal.bind(this, "SIGQUIT"));
        // kill(15) default
        process.once("SIGTERM", this.onSignal.bind(this, "SIGTERM"));
        process.once("exit", this.onMasterExit.bind(this));
        this.on("master-exit", () => { });
        this.on("app-cluser-start", () => { });
        this.on("app-cluser-start", () => { });
        this.on("app-agent-error", () => { });
        this.on("app-agent-exit", () => { });
        this.on("app-cluster-exit", () => { });
        this.on("app-cluster-start", () => { });
        this.on("app-cluster-online", () => { });
        this.on("message", data => {
            if (data.msg.cmd == "getOsInfo") {
                let respdata = this.manger.getWorkerMemoryUsage();
                cluster_1.default.workers[data.msg.id].send({
                    data: respdata,
                    reqId: data.msg.requestId
                });
            }
            console.log("master receive", data);
        });
        // setInterval(() => {
        // console.log(this.manger.getWorkerMemoryUsage());
        // console.log(this.manger.listWorkerIds());
        // fs.writeFileSync("pid", this.manger.listWorkerIds(), "utf-8");
        // }, 2000);
        defer(() => {
            this.forkAgentApp();
        });
    }
    send(from, to, msg, tag = "work") {
        if (to === "cluster") {
            this.sendToCluster(tag, msg, from);
        }
        else if (to == "agent") {
            this.sentToAgent(msg, from);
        }
        else if (to == "master") {
            this.emit("message", { msg, from });
        }
    }
    sendToCluster(tag, msg, from) {
        let workers = this.manger.findWorlerByTag(tag);
        for (let i = 0; i < workers.length; i++) {
            workers[i].send({
                from: from,
                msg: msg
            });
        }
    }
    sentToAgent(msg, from) {
        this.manger._agent.send({
            from: from,
            msg: msg
        });
    }
    killApp() {
        for (let id in cluster_1.default.workers) {
            let worker = cluster_1.default.workers[id];
            worker.kill();
        }
        this.agent.removeAllListeners();
    }
    onMasterExit() {
        this.emit("master-exit");
    }
    onSignal() {
        fs_1.default.unlinkSync("pid");
        this.isClosed = true;
        try {
            this.killApp();
            defer(() => {
                process.exit(0);
            });
        }
        catch (error) {
            process.exit(1);
        }
    }
    newWorker(execFile, name) {
        cluster_1.default.setupMaster({
            exec: execFile,
            args: ["--tag", name]
            // silent: true
        });
        cluster_1.default.fork();
    }
    isCanClustefork() {
        return this.limit < this.options.restart;
    }
    forkWorkerApp() {
        for (let i = 0; i < this.options.number; i++) {
            this.newWorker(this.options.work, "work");
        }
        // 初始化通用的cluster
        this.newWorker(this.options.common, "commom");
        cluster_1.default.on("fork", (worker) => {
            worker._tag = worker.process.spawnargs[3];
            this.manger.setWorkder(worker.process.pid, worker);
            worker.on("message", msg => {
                this.send(msg.tag, msg.to, msg.data);
            });
        });
        cluster_1.default.on("disconnect", (worker) => {
            this.log(`worker ${worker._tag} disconnect`);
        });
        cluster_1.default.on("exit", (worker, code, signal) => {
            this.emit("app-cluster-exit", {
                worker,
                code
            });
            this.log(`worker ${worker._tag} exit code ${code} signal ${signal}`);
            this.manger.deleteWorker(worker.process.pid);
            if (this.isCanClustefork()) {
                this.newWorker(this.options[worker._tag], worker._tag);
            }
        });
        cluster_1.default.on("listening", (worker, address) => {
            this.emit("app-cluster-start");
            this.log(`worker ${worker._tag} ${worker.process.pid} islistening address ${address}`);
        });
        cluster_1.default.on("online", (worker) => {
            this.emit("app-cluster-online");
            this.log(`worker ${worker._tag} ${worker.process.pid} online`);
        });
    }
    forkAgentApp() {
        this.agent = child_process_1.default.fork(this.options.agent);
        this.emit("agent-start", {
            agent: this.agent.pid
        });
        this.manger.setAgent(this.agent);
        this.agent.on("message", msg => {
            this.send("agent", msg.to, msg.data);
        });
        this.agent.on("error", err => {
            this.emit("app-agent-error", err);
        });
        this.agent.on("exit", msg => {
            this.emit("app-agent-exit", msg);
        });
    }
}
new BootStrap({
    work: path.resolve(__dirname, "./work"),
    common: path.resolve(__dirname, "./common"),
    agent: path.resolve(__dirname, "./agent"),
    number: 2,
    restart: 20
});
exports.default = BootStrap;
//# sourceMappingURL=index.js.map