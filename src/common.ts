import cluster from "cluster";

console.log(`我是大家的进程:${process.pid},标签：${process.argv[3]}`);
setInterval(() => {}, 1e5);
let list = [];
process.on("message", data => {
  console.log("common cluster receive mesg:", data);
  let fns = list.filter(v => v.id == data.reqId);
  list = list.filter(v => v.id != data.reqId);
  fns[0] && fns[0].fn(data);
});
function timeout(time) {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve({
        rCode: 1,
        msg: "timeout"
      });
    }, time);
  });
}
async function sendMsgWithPromise(cmd) {
  let requestId = new Date().valueOf();
  process.send({
    to: "master",
    tag: "common",
    data: {
      requestId: requestId,
      cmd: cmd,
      pid: process.pid,
      id: cluster.worker.id
    }
  });
  return Promise.race([
    new Promise(resolve => {
      list.push({
        id: requestId,
        fn: resolve
      });
    }),
    timeout(1000)
  ]);
}

setTimeout(() => {
  sendMsgWithPromise("getOsInfo").then(resp => {
    console.log("-----getOsInfo", resp);
  });
}, 3000);
setTimeout(() => {
  sendMsgWithPromise("test").then(resp => {
    console.log("-----test", resp);
  });
}, 3000);

// setInterval(() => {}, 1e3);

// let sum = 0;
// function cpu() {
//   let i = 0;
//   while (i < 9000000) {
//     i++;
//     sum += i;
//   }
// }

// process.on("message", data => {
//   console.log("common worker recive msg");
//   console.log(data);
// });
// (function() {
//   // 记录Promise链的长度
//   var i = 0;
//   function run() {
//     return new Promise(function(resolve) {
//       // 每增加10000个Promise打印一次内存使用情况
//       if (i % 10000 === 0) console.log(i);
//       i++;
//       // 模拟一个异步操作
//       setTimeout(function() {
//         // 100000个Promise之后退出
//         if (i === 10000 * 10) return resolve();
//         // 如果resolve的参数是一个Promise，外层Promise将接管这个Promise的状态，构成嵌套Promise
//         resolve(run());
//       }, 0);
//     }).then(function() {});
//   }
//   run();
// })();
// setInterval(() => {
//   console.log(
//     "common\nheapUsed",
//     process.memoryUsage().heapUsed / 1024 / 1024 + "m"
//   );
//   console.log("heapTotal", process.memoryUsage().heapTotal / 1024 / 1024 + "m");
//   console.log("rss", process.memoryUsage().rss / 1024 / 1024 + "m");

//   // if (process.memoryUsage().heapUsed / 1024 / 1024 > 7) {
//   //   process.exit(110);
//   // }
// }, 2000);
