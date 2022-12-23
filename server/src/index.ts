require('dotenv').config();
import 'reflect-metadata';
import express from 'express';
import { DataSource } from 'typeorm';
import http from 'http';
import { User } from './entities/User';
import { Post } from './entities/Post';
import { Upvote } from './entities/Upvote';
import { ApolloServer } from 'apollo-server-express';
import { buildSchema } from 'type-graphql';
import { HelloResolver } from './resolvers/hello';
import cookieParser from 'cookie-parser';
import { ApolloServerPluginDrainHttpServer, ApolloServerPluginLandingPageGraphQLPlayground } from 'apollo-server-core';
import { Context } from './types/Context';
import { UserResolver } from './resolvers/user';
import mongoose from 'mongoose';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import { COOKIE_NAME, __prod__ } from './constants/index';
import { PostResolver } from './resolvers/post';
import { buildDataLoaders } from './utils/dataLoaders';

export const dataSource = new DataSource({
  type: 'postgres',
  database: 'reddit',
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  logging: true,
  synchronize: true,
  entities: [User, Post, Upvote],
});

const main = async () => {
  const app = express();
  const mongoUrl = `mongodb+srv://${process.env.DB_MONGODB_USER}:${process.env.DB_MONGODB_PASSWORD}@reddit.hseg0pb.mongodb.net/?retryWrites=true&w=majority`;
  const PORT = process.env.PORT || 4000;

  await mongoose.connect(mongoUrl);
  app.use(
    session({
      name: COOKIE_NAME,
      store: MongoStore.create({ mongoUrl: mongoUrl }),
      cookie: {
        maxAge: 1000 * 60 * 60,
        httpOnly: true,
        secure: __prod__,
        sameSite: 'lax',
      },
      secret: process.env.SESSION_SECRET_DEV_PROD as string,
      saveUninitialized: false,
      resave: false,
    })
  );

  // load entities, establish db connection, sync schema, etc.
  await dataSource.connect();

  app.use(express.json());
  app.use(cookieParser());

  const httpServer = http.createServer(app);

  const apolloServer = new ApolloServer({
    schema: await buildSchema({
      validate: false,
      resolvers: [HelloResolver, UserResolver, PostResolver],
    }),
    plugins: [ApolloServerPluginDrainHttpServer({ httpServer: httpServer }), ApolloServerPluginLandingPageGraphQLPlayground],
    context: ({ req, res }): Context => ({
      req,
      res,
      dataSource: dataSource,
      dataLoaders: buildDataLoaders(),
    }),
  });

  await apolloServer.start();

  apolloServer.applyMiddleware({ app, cors: { origin: 'http://localhost:3000', credentials: true } });

  await new Promise(resolve => httpServer.listen(PORT, resolve as () => void));

  console.log(`Server is running, GraphQL Playground available at http://localhost:${PORT}${apolloServer.graphqlPath}`);
};

main().catch(error => console.log('ERROR STARTING ERROR', error));
