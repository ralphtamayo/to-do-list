const Koa = require('koa');
const Router = require('@koa/router');
const mount = require('koa-mount');
const graphqlHTTP = require('koa-graphql');
const { buildSchema } = require('graphql');

const bodyParser = require('koa-bodyparser');

const app = new Koa();
const router = new Router();

const tasks = [];

app.use(bodyParser())
	.use(router.routes())
	.use(router.allowedMethods())
;

app.use(mount('/api', graphqlHTTP({
	graphiql: true,
	schema: buildSchema(`
		type Task {
			_id: ID!
			title: String!
			description: String!
			createdAt: String!
		}

		input TaskCreateInput {
			title: String!
			description: String!
			createdAt: String!
		}

		type RootQuery {
			tasks: [Task!]!
		}

		type RootMutation {
			createTask(taskCreateInput: TaskCreateInput): Task
		}

		schema {
			query: RootQuery
			mutation: RootMutation
		}
	`),
	rootValue: {
		tasks: () => {
			return tasks;
		},
		createTask: (args) => {
			const task = {
				_id: Math.random().toString(),
				title: args.taskCreateInput.title,
				description: args.taskCreateInput.description,
				createdAt: args.taskCreateInput.date
			};

			tasks.push(task);
			return task;
		}
	}
})));

router.get('/', (ctx, next) => {
	ctx.body = 'Hello world';
});

app.listen(3000);