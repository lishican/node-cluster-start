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
const cfork = require("cfork");
class Manager {
    setAgent(agent) {
        this.agent = agent;
    }
}
class BootStrap extends events_1.EventEmitter {
    constructor(options) {
        super();
        this.options = options;
        this.manger = typedi_1.Container.get(Manager);
        this.on("one", data => {
            console.log(data);
        });
        this.once("agent-start", data => {
            console.log(data);
            this.forkWorker();
        });
        process.nextTick(() => {
            this.forkAgent();
        });
    }
    forkWorker() {
        cfork({
            exec: this.options.work,
            count: this.options.number
        });
        cluster_1.default.on("fork", (worker) => {
            worker.disableRefork = true;
            // this.workerManager.setWorker(worker);
            worker.on("message", msg => {
                if (typeof msg === "string")
                    msg = { action: msg, data: msg };
                msg.from = "app";
                // this.messenger.send(msg);
            });
        });
        cluster_1.default.on("disconnect", (worker) => {
            console.log(worker.process.pid);
        });
        cluster_1.default.on("exit", (worker, code, signal) => {
            console.log(worker, code, signal);
        });
        cluster_1.default.on("listening", (worker, address) => {
            console.log(worker.process.pid, address);
        });
    }
    forkAgent() {
        this.agent = child_process_1.default.fork(this.options.agent);
        this.emit("agent-start", {
            agent: this.agent.pid
        });
        this.manger.setAgent(this.agent);
        this.agent.on("message", msg => {
            console.log("----------------agent exit", msg);
        });
        this.agent.on("error", msg => {
            console.log("----------------agent exit", msg);
        });
        this.agent.on("exit", msg => {
            console.log("----------------agent exit", msg);
        });
    }
}
let app = new BootStrap({
    work: path.resolve(__dirname, "./work"),
    agent: path.resolve(__dirname, "./agent"),
    number: 3,
    restart: 20
});
app.emit("one", { data: 1 });
exports.default = BootStrap;
//# sourceMappingURL=index.js.map