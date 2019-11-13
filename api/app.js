const Koa = require('koa');
const Router = require('@koa/router');
const mount = require('koa-mount');
const graphqlHTTP = require('koa-graphql');
const { buildSchema } = require('graphql');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const Task = require('./models/task');
const User = require('./models/user');

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

		type User {
			_id: ID!
			email: String!
			password: String
		}

		input TaskCreateInput {
			title: String!
			description: String!
		}

		input UserCreateInput {
			email: String!
			password: String!
		}

		type RootQuery {
			tasks: [Task!]!
		}

		type RootMutation {
			createTask(taskCreateInput: TaskCreateInput): Task
			createUser(userCreateInput: UserCreateInput): User
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
					throw err;
				});
		},
		createTask: args => {
			const task = new Task({
				title: args.taskCreateInput.title,
				description: args.taskCreateInput.description,
				createdBy: '5dcbc7b6a28087287c00f709'
			});

			let createdTask;

			return task.save()
			.then(res => {
				createdTask = { ...res._doc };

				return User.findById('5dcbc7b6a28087287c00f709');
			}).then(user => {
				if (user == null) {
					throw new Error('User doesn\'t exists.');
				}

				user.createdTasks.push(task);

				return user.save();
			}).then(res => {
				return createdTask;
			}).catch(err => {
				console.log(err);
				throw err;
			});
		},
		createUser: args => {
			return User.findOne({ email: args.userCreateInput.email }).then(user => {
				if (user != null) {
					throw new Error('User exists already.');
				}

				return bcrypt.hash(args.userCreateInput.password, 12)
			})
			.then(hashedPassword => {
				const user = new User({
					email: args.userCreateInput.email,
					password: hashedPassword
				});

				return user.save();
			})
			.then(res => {
				return { ...res._doc, password: null, _id: res.id }
			})
			.catch(err => {
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