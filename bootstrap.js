const cfork = require("cfork");
const cluster = require("cluster");
const sendmessage = require("sendmessage");

const child_process = require("child_process");
const works = new Map();

class MessageManger {
  constructor() {}
  send(data) {
    console.log("send");
    console.log(data);
    if (data.to == "work") {
      this.sendToAppWorker(data);
    } else if (data.to == "agent") {
      this.sendToAgentWorker(data);
    } else if (data.to == "master") {
      console.log("master recieve", data);
    }
  }
  sendToAppWorker(data) {
    for (const id in cluster.workers) {
      const worker = cluster.workers[id];
      sendmessage(worker, data);
    }
  }
  sendToAgentWorker(data) {
    sendmessage(agent, data);
  }
  sendToParent(data) {
    process.send(data);
  }
}
let message = new MessageManger();

// Agent
let agent = child_process.fork("./agent.js");
agent.on("message", msg => {
  if (msg.type == "agent-start") {
    StartWorker();
  } else {
    message.send(msg);
  }
});
agent.on("error", msg => {});
agent.once("exit", msg => {
  console.log("----------------agent exit");
});
// Work
function StartWorker() {
  console.log("开启work");
  cfork({
    exec: "./app.js",
    count: 2
  });
  cluster.on("fork", worker => {
    works.set(worker.process.pid, worker);
    console.warn("[worker:%d]  start", worker.process.pid);
    worker.on("message", msg => {
      message.send(msg);
    });
  });
  cluster.on("disconnect", worker => {
    console.log("workd disconet");
  });
  cluster.once("exit", (worker, code, signal) => {
    console.log("workd exit");
  });
}

function killAgent() {
  agent.removeAllListeners();
  agent.kill(0);
}

function killAppWork() {
  for (let id in cluster.workers) {
    let worker = cluster.workers[id];
    worker.disableRefork = true;
    worker.kill("SIGTERM");
    process.kill(worker.process.pid, 0);
    worker.on("exit", () => {});
  }
}
setInterval(() => {
  console.log(Object.keys(cluster.workers));
}, 2000);

setTimeout(() => {
  killAgent();
  killAppWork();
}, 300);

// --max-http-header-size=size
// --prof
