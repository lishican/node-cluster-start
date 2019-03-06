import "reflect-metadata";
import { EventEmitter } from "events";
import child_process, { ChildProcess } from "child_process";
import { Container } from "typedi";
import * as path from "path";
import cluster, { Worker } from "cluster";
// import cfork = require("cfork");

interface WorkerPlus extends Worker {
  disableRefork: boolean;
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

  private wokerMap: Map<string, any> = new Map();
  constructor(options: Option) {
    super();
    this.options = options;

    this.manger = Container.get(Manager);

    this.once("agent-start", data => {
      this.forkWorker();
    });

    process.nextTick(() => {
      this.forkAgent();
    });
  }

  forkNewWork(exec, name) {
    cluster.setupMaster({
      exec: exec,
      args: ["--use", name]
      // silent: true
    });
    cluster.fork();
  }

  forkWorker() {
    for (let i = 0; i < this.options.number; i++) {
      this.forkNewWork(this.options.work, "work");
    }

    this.forkNewWork(path.resolve(__dirname, "./common"), "common");
    cluster.on("fork", (worker: any) => {
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
    cluster.on("disconnect", (worker: WorkerPlus) => {
      console.log("worker disconnect", worker.process.pid);
    });
    cluster.on("exit", (worker, code, signal) => {
      // console.log("worker exit", worker, code, signal);
      if (code == 110) {
        this.forkNewWork(path.resolve(__dirname, "./common"), "common");
      }
    });
    cluster.on("listening", (worker, address) => {
      console.log(worker.process.pid, address);
    });
    cluster.on("online", worker => {
      console.log("worker online", worker.process.pid);
    });
  }

  forkAgent() {
    this.agent = child_process.fork(this.options.agent);
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
  console.log(
    "master\nheapUsed",
    process.memoryUsage().heapUsed / 1024 / 1024 + "m"
  );
  console.log("heapTotal", process.memoryUsage().heapTotal / 1024 / 1024 + "m");
  console.log("rss", process.memoryUsage().rss / 1024 / 1024 + "m");

  // if (process.memoryUsage().heapUsed / 1024 / 1024 > 7) {
  //   process.exit(110);
  // }
}, 2000);

export default BootStrap;
