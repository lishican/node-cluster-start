const EventEmitter = require("events");
const {Readable }= require('stream')

const fs = require("fs");
const path = require("path");
const net = require("net");
const cluster = require("cluster");
const child_process = require("child_process");

let script = path.resolve(__dirname, "./index.js");

class Daemon extends EventEmitter {
  constructor(props) {
    super();
    this.processList = new Map();
    this.pid = 0;
  }

  excuteApp(script, mode, instantNumber = 1) {
    console.log(script, mode, (instantNumber = 1));
    if (mode == "cluster") {
      cluster.setupMaster({
        exec: script,
        args: ["--name", "daemon", "--port", "5001"],
        windowsHide: true
      });
      cluster.fork();

      cluster.on("fork", worker => {
        console.log("fork", worker.process.pid);
        this.pid++;
        this.processList.set(this.pid, { pid: worker.process.pid, worker });
      });

      cluster.on("message", (worker, message) => {
        console.log(
          "worker " + worker.process.pid + " receive message\n",
          message
        );
      });
      cluster.on("exit", code => {
        console.log("exit", code);
        this.processList.delete(1);
      });
    }
  }
  excuteCmd(str, cb) {
    if (str == "start") {
      cb("app start ok");
      dm.excuteApp(script, "cluster", 1);
    } else if (str == "list") {
      let list = Array.from(this.processList.keys()).map(v=>{
        return {
          id:v,
          pid:this.processList.get(v).pid
        }
      })
      cb(JSON.stringify(list));
    } else if (str == "stop") {
      this.processList.get(1).worker.kill('SIGINT')
    } else if (str == "monit") {
      let list = Array.from(this.processList.keys()).map(v=>{
        let worker = this.processList.get(v).worker
        console.log(worker.process)
        return {
          id:v,
          id:this.processList.get(v).pid,
          memoryUsage:process.memoryUsage()
        }
      })
      cb(JSON.stringify(list))

    }
  }
}

let dm = new Daemon();

if(process.env.testy==123){
  dm.excuteApp(script, "cluster", 5);
}

// dm.excuteApp(script, "cluster", 5);

let server = net.createServer();
server.on("connection", socket => {
  socket.on("data", data => {
    data = data.toString();
    console.log("receive", data);
    dm.excuteCmd(data, resp => {
      console.log(resp);
      socket.write(Buffer.from(resp));
    });
  });
});

server.listen(6722);
if(typeof process.send == 'function'){
  process.send('daemon:ready')
}
fs.writeFileSync('pid',process.pid)
module.exports = Daemon;
