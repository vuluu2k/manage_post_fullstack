require('dotenv').config();
import 'reflect-metadata';
import express from 'express';
import { DataSource } from 'typeorm';

const dataSource = new DataSource({
  type: 'postgres',
  database: 'reddit',
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  logging: true,
  synchronize: true,
  // entities: [User],
});

const main = async () => {
  // load entities, establish db connection, sync schema, etc.
  await dataSource.connect();

  const PORT = process.env.PORT || 4000;
  const app = express();

  // app.use(express.json());
  // app.use(cookieParser());
  // app.use('/refresh_token', refreshTokenRouter);

  // const httpServer = http.createServer(app);

  // const apolloServer = new ApolloServer({
  //   schema: await buildSchema({
  //     validate: false,
  //     resolvers: [GreetingResolver, UserResolver],
  //   }),
  //   plugins: [
  //     ApolloServerPluginDrainHttpServer({ httpServer: httpServer }),
  //     ApolloServerPluginLandingPageGraphQLPlayground,
  //   ],
  //   context: ({ req, res }): Pick<Context, 'req' | 'res'> => ({
  //     req,
  //     res,
  //   }),
  // });

  // await apolloServer.start();

  // apolloServer.applyMiddleware({ app, cors: { origin: 'http://localhost:3000', credentials: true } });

  // await new Promise((resolve) => httpServer.listen(PORT, resolve as () => void));

  // console.log(`Server is running, GraphQL Playground available at http://localhost:${PORT}${apolloServer.graphqlPath}`);

  app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
};

main().catch(error => console.log('ERROR STARTING ERROR', error));
