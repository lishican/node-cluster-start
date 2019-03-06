import gracefulExit = require("graceful-process");

console.log("我是秘书 agent", process.pid);
const agent = {
  ready() {
    console.log("ready agent");
    let count = 0;
    process.send({
      type: "agent-start",
      data: count,
      time: Date.now()
    });
    setTimeout(() => {
      process.send({
        to: "common",
        type: "agent-cron",
        data: count,
        time: Date.now()
      });
    }, 1000);
  },
  close() {
    console.log("13");
  },
  error() {
    process.exitCode = 1;
    process.kill(process.pid);
  }
};

process.on("message", data => {
  console.log("agent receive----");
  console.log(data);
});

agent.ready();

gracefulExit({
  logger: console,
  label: "agent_worker",
  beforeExit: () => agent.close()
});
