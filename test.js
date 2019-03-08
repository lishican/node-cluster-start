// const child_process = require("child_process");
// const fs = require("fs");

// let child = child_process.fork(
//   "./container.js",
//   [process.argv[2]],
//   {
//     silent: false,
//     detached: true,
//     cwd: process.cwd(),
//     stdio: ["ipc", "pipe", "pipe"],
//     slient: false
//   },
//   function(err, stdout, stderr) {
//     if (err) console.error(err);
//   }
// );

// child.stdout.on("data", data => {
//   console.log(data.toString());
// });

// child.on("exit", code => {
//   console.log(code);
// });
// child.on("error", err => {
//   console.log(err);
// });
// child.on("disconnect", () => {
//   console.log("disconnect");
// });

// child.on("message", msg => {
//   console.log(msg);
// });
// // child.unref();

// // setInterval(() => {}, 1e5);
// // child.on("message", data => {
// //   console.log(data);
// // });

// // let childPid = fs.writeFileSync("daemon.pid", child.pid, "utf8");

// // child.unref();

// // process.on("exit", () => {
// //   console.log("master exit; child process pid:" + childPid);
// // });

// // // setInterval(() => {}, 1e5);

// // const cluster = require("cluster");

// // cluster.setupMaster({
// //   exec: "./container.js",
// //   args: ["./test2.js"],
// //   silent: false
// // });
// // cluster.fork();

// // cluster.on("fork", worker => {
// //   console.log(worker.process.pid);
// //   worker.on("message", data => {
// //     console.log("data");
// //     console.log(data);
// //   });
// // });
// // cluster.unref()
