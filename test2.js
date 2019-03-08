const Koa = require("koa");

let app = new Koa();

app.use(async ctx => {
  process.send("dsada");
  ctx.body = "text2";
});
app.listen(3000);

console.log("test");
console.log(__dirname);
console.log(__filename);
