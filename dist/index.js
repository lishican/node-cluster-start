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
const typedi_1 = require("typedi");
const path = __importStar(require("path"));
const cluster_1 = __importDefault(require("cluster"));
class Manager {
    setAgent(agent) {
        this.agent = agent;
    }
}
class BootStrap extends events_1.EventEmitter {
    constructor(options) {
        super();
        this.wokerMap = new Map();
        this.options = options;
        this.manger = typedi_1.Container.get(Manager);
        this.once("agent-start", data => {
            this.forkWorker();
        });
        process.nextTick(() => {
            this.forkAgent();
        });
    }
    forkNewWork(exec, name) {
        cluster_1.default.setupMaster({
            exec: exec,
            args: ["--use", name]
            // silent: true
        });
        cluster_1.default.fork();
    }
    forkWorker() {
        for (let i = 0; i < this.options.number; i++) {
            this.forkNewWork(this.options.work, "work");
        }
        this.forkNewWork(path.resolve(__dirname, "./common"), "common");
        cluster_1.default.on("fork", (worker) => {
            worker.disableRefork = true;
            console.log(worker.id, worker.process.pid, worker.process.spawnargs[3]);
            this.wokerMap.set(worker.process.spawnargs[3], {
                pid: worker.process.pid,
                type: worker.process.spawnargs[3],
                worker: worker
            });
            // this.workerManager.setWorker(worker);
            worker.on("message", msg => {
                if (msg.to == "common") {
                    this.wokerMap.get("common").worker.send(msg);
                }
            });
        });
        cluster_1.default.on("disconnect", (worker) => {
            console.log("worker disconnect", worker.process.pid);
        });
        cluster_1.default.on("exit", (worker, code, signal) => {
            // console.log("worker exit", worker, code, signal);
            if (code == 110) {
                this.forkNewWork(path.resolve(__dirname, "./common"), "common");
            }
        });
        cluster_1.default.on("listening", (worker, address) => {
            console.log(worker.process.pid, address);
        });
        cluster_1.default.on("online", worker => {
            console.log("worker online", worker.process.pid);
        });
    }
    forkAgent() {
        this.agent = child_process_1.default.fork(this.options.agent);
        this.emit("agent-start", {
            agent: this.agent.pid
        });
        this.manger.setAgent(this.agent);
        this.agent.on("message", msg => {
            this.wokerMap.get("common").worker.send(msg);
        });
        // this.agent.on("error", msg => {
        //   console.log("----------------agent error", msg);
        // });
        // this.agent.on("exit", msg => {
        //   console.log("----------------agent exit", msg);
        // });
    }
}
new BootStrap({
    work: path.resolve(__dirname, "./work"),
    agent: path.resolve(__dirname, "./agent"),
    number: 2,
    restart: 20
});
setInterval(() => {
    console.log("master\nheapUsed", process.memoryUsage().heapUsed / 1024 / 1024 + "m");
    console.log("heapTotal", process.memoryUsage().heapTotal / 1024 / 1024 + "m");
    console.log("rss", process.memoryUsage().rss / 1024 / 1024 + "m");
    // if (process.memoryUsage().heapUsed / 1024 / 1024 > 7) {
    //   process.exit(110);
    // }
}, 2000);
exports.default = BootStrap;
//# sourceMappingURL=index.js.map