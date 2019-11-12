const Koa = require('koa');
const bodyParser = require('koa-bodyparser');

const app = new Koa();

app.use(bodyParser());

app.use(async ctx => {
	ctx.body = 'Hello Worlds';
});

app.listen(3000);