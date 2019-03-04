import "reflect-metadata";
import { EventEmitter } from "events";
import child_process, { ChildProcess } from "child_process";
import { Container } from "typedi";
import * as path from "path";
import cluster, { Worker } from "cluster";
import cfork = require("cfork");


interface WorkerPlus extends Worker{
  disableRefork:boolean
}

interface Option {
  work: string;
  agent: string;
  number: number;
  restart: number;
}

class Manager {
  agent: any;

  setAgent(agent) {
    this.agent = agent;
  }
}

class BootStrap extends EventEmitter {
  private agent: ChildProcess;
  private options: Option;
  manger: Manager;
  constructor(options: Option) {
    super();
    this.options = options;

    this.manger = Container.get(Manager);

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

    cluster.on("fork", (worker:WorkerPlus) => {
      worker.disableRefork = true;
      // this.workerManager.setWorker(worker);
      worker.on("message", msg => {
        if (typeof msg === "string") msg = { action: msg, data: msg };
        msg.from = "app";
        // this.messenger.send(msg);
      });
    });
    cluster.on("disconnect", (worker: WorkerPlus) => {
      
      console.log(worker.process.pid);
    });
    cluster.on("exit", (worker, code, signal) => {
      console.log(worker, code, signal);
    });
    cluster.on("listening", (worker, address) => {
      console.log(worker.process.pid, address);
    });
  }

  forkAgent() {
    this.agent = child_process.fork(this.options.agent);
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

export default BootStrap;
