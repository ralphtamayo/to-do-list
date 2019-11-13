const Koa = require('koa');
const Router = require('@koa/router');
const mount = require('koa-mount');
const graphqlHTTP = require('koa-graphql');
const { buildSchema } = require('graphql');
const mongoose = require('mongoose');

const Task = require('./models/event');

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
		type Task {
			_id: ID!
			title: String!
			description: String!
		}

		input TaskCreateInput {
			title: String!
			description: String!
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
			return Task.find()
				.then(res => {
					return res.map(task => {
						return { ...task._doc };
					});
				}).catch(err => {
					console.log(err);
				});
		},
		createTask: (args) => {
			const task = new Task({
				title: args.taskCreateInput.title,
				description: args.taskCreateInput.description
			});

			return task.save()
			.then(res => {
				console.log('Task saved successfully');

				return { ...res._doc };
			})
			.catch(err => {
				console.log(err);
				throw err;
			});
		}
	}
})));

router.get('/', (ctx, next) => {
	ctx.body = 'Hello world';
});

mongoose.connect(
	`mongodb+srv://${ process.env.db_user }:${ process.env.db_password }@to-do-list-fwj7v.mongodb.net/${ process.env.db_name }?retryWrites=true&w=majority`
).then(() => {
	app.listen(3000);
}).catch(err => {
	console.log(err);
});