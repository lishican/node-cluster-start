import "reflect-metadata";
import { EventEmitter } from "events";
import child_process, { ChildProcess } from "child_process";
import * as path from "path";
import cluster, { Worker } from "cluster";
import Manager from "./lib/mannger";
import fs from "fs";
function logger(msg: string): void {
  console.log(msg);
}

interface WorkerPlus extends Worker {
  _tag?: string;
  Worker;
}

interface Option {
  work: string;
  common?: string;
  agent: string;
  number: number;
  restart: number;
}

const defer = setImmediate || process.nextTick;

class BootStrap extends EventEmitter {
  private agent: ChildProcess;
  private options: Option;
  private manger: Manager;
  private limit: number = 0;
  private isClosed: boolean = false;
  private isStarting: boolean = false;
  private log: (msg: string) => void;

  constructor(options: Option) {
    super();

    this.manger = new Manager();
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

    this.on("master-exit", () => {});
    this.on("app-cluser-start", () => {});
    this.on("app-cluser-start", () => {});
    this.on("app-agent-error", () => {});
    this.on("app-agent-exit", () => {});
    this.on("app-cluster-exit", () => {});
    this.on("app-cluster-start", () => {});
    this.on("app-cluster-online", () => {});
    this.on("message", data => {
      if (data.msg.cmd == "getOsInfo") {
        let respdata = this.manger.getWorkerMemoryUsage();
        cluster.workers[data.msg.id].send({
          data: respdata,
          reqId: data.msg.requestId
        });
      } else if (data.msg.cmd == "test") {
        // setTimeout(() => {
        //   cluster.workers[data.msg.id].send({
        //     data: "test data",
        //     reqId: data.msg.requestId
        //   });
        // }, 5000);
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

  send(from: string, to: string, msg: string, tag: string = "work") {
    if (to === "cluster") {
      this.sendToCluster(tag, msg, from);
    } else if (to == "agent") {
      this.sentToAgent(msg, from);
    } else if (to == "master") {
      this.emit("message", { msg, from });
    }
  }
  sendToCluster(tag: string, msg: any, from: string) {
    let workers = this.manger.findWorlerByTag(tag);
    for (let i = 0; i < workers.length; i++) {
      workers[i].send({
        from: from,
        msg: msg
      });
    }
  }
  sentToAgent(msg: any, from: string) {
    this.manger._agent.send({
      from: from,
      msg: msg
    });
  }

  killApp() {
    for (let id in cluster.workers) {
      let worker = cluster.workers[id];
      worker.kill();
    }

    this.agent.removeAllListeners();
  }

  onMasterExit() {
    this.emit("master-exit");
  }
  onSignal() {
    fs.unlinkSync("pid");
    this.isClosed = true;
    try {
      this.killApp();
      defer(() => {
        process.exit(0);
      });
    } catch (error) {
      process.exit(1);
    }
  }

  newWorker(execFile, name) {
    cluster.setupMaster({
      exec: execFile,
      args: ["--tag", name]
      // silent: true
    });
    cluster.fork();
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
    cluster.on("fork", (worker: any) => {
      worker._tag = worker.process.spawnargs[3];
      this.manger.setWorkder(worker.process.pid, worker);
      worker.on("message", msg => {
        this.send(msg.tag, msg.to, msg.data);
      });
    });
    cluster.on("disconnect", (worker: WorkerPlus) => {
      this.log(`worker ${worker._tag} disconnect`);
    });

    cluster.on("exit", (worker: WorkerPlus, code: any, signal) => {
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
    cluster.on("listening", (worker: WorkerPlus, address) => {
      this.emit("app-cluster-start");
      console.log(`worker ${worker._tag} ${worker.process.pid} islistening `);
    });
    cluster.on("online", (worker: WorkerPlus) => {
      this.emit("app-cluster-online");
      console.log(`worker ${worker._tag} ${worker.process.pid} online`);
    });
  }

  forkAgentApp() {
    this.agent = child_process.fork(this.options.agent);
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
  number: 3,
  restart: 20
});

export default BootStrap;
