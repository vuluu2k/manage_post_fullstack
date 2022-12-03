// import { Context } from '../types/Context'
import { Resolver, Mutation, Arg } from 'type-graphql';
import argon2 from 'argon2';
import { User } from '../entities/User';

@Resolver()
export class UserResolver {
  @Mutation(_returns => User, { nullable: true })
  async register(@Arg('email') email: string, @Arg('username') username: string, @Arg('password') password: string): Promise<User | null> {
    try {
      const existingUser = await User.findOne({ where: [{ username }, { email }] });
      if (existingUser) return null;

      const hashPassword = await argon2.hash(password);

      const newUser = User.create({ email: email, username: username, password: hashPassword });
      await newUser.save();

      return newUser;
    } catch (error) {
      console.log(error);
      return null;
    }
  }
}
