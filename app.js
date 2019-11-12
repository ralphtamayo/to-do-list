const Koa = require('koa');
const Router = require('@koa/router');
const mount = require('koa-mount');
const graphqlHTTP = require('koa-graphql');
const { buildSchema } = require('graphql');

const bodyParser = require('koa-bodyparser');

const app = new Koa();
const router = new Router();

app.use(bodyParser())
	.use(router.routes())
	.use(router.allowedMethods())
;

app.use(mount('/api', graphqlHTTP({
	graphiql: true,
	schema: buildSchema(`
		type RootQuery {
			tasks: [String!]!
		}

		type RootMutation {
			createTask(name: String): String
		}

		schema {
			query: RootQuery
			mutation: RootMutation
		}
	`),
	rootValue: {
		tasks: () => {
			return ['Prepare ingredients', 'Cook meal'];
		},
		createTask: (task) => {
			return task.name;
		}
	}
})));

router.get('/', (ctx, next) => {
	ctx.body = 'Hello world';
});

app.listen(3000);