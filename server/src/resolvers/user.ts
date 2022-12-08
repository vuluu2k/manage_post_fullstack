import { validateRegisterInput } from './../utils/validateRegisterInput';
import { Context } from '../types/Context';
import { Resolver, Mutation, Arg, Ctx } from 'type-graphql';
import argon2 from 'argon2';
import { User } from '../entities/User';
import { UserMutationResponse } from '../types/UserMutationResponse';
import { RegisterInput } from '../types/RegisterInput';
import { LoginInput } from '../types/LoginInput';
import { COOKIE_NAME } from '../constants';

@Resolver()
export class UserResolver {
  @Mutation(_return => UserMutationResponse)
  async register(@Arg('registerInput') registerInput: RegisterInput, @Ctx() { req }: Context): Promise<UserMutationResponse> {
    const validateRegisterInputErrors = validateRegisterInput(registerInput);
    if (validateRegisterInputErrors !== null) return { code: 400, success: false, ...validateRegisterInputErrors };

    try {
      const { username, email, password } = registerInput;
      const existingUser = await User.findOne({ where: [{ username }, { email }] });
      if (existingUser)
        return {
          code: 400,
          success: false,
          message: 'Tài khoản đã tồn tại',
          errors: [
            {
              field: existingUser.username === username ? 'username' : 'email',
              message: `${existingUser.username === username ? 'tài khoản' : 'email'} đã tồn tại`,
            },
          ],
        };

      const hashPassword = await argon2.hash(password);

      const newUser = User.create({ email: email, username: username, password: hashPassword });
      await newUser.save();

      req.session.userId = newUser.id;

      return {
        code: 200,
        success: true,
        message: 'Đăng ký thành công',
        user: newUser,
      };
    } catch (error) {
      console.log(error);
      return {
        code: 500,
        success: false,
        message: `Server Internal Error ${error.message}`,
      };
    }
  }

  @Mutation(_return => UserMutationResponse)
  async login(@Arg('loginInput') loginInput: LoginInput, @Ctx() context: Context): Promise<UserMutationResponse> {
    try {
      const { usernameOrEmail, password } = loginInput;
      const { req } = context;
      const existingUser = await User.findOne({ where: [{ username: usernameOrEmail }, { email: usernameOrEmail }] });

      if (!existingUser)
        return {
          code: 400,
          success: false,
          message: 'Mật khẩu hoặc tài khoản không tồn tại',
        };
      const checkPassword = await argon2.verify(existingUser.password, password);

      if (!checkPassword)
        return {
          code: 400,
          success: false,
          message: 'Mật khẩu hoặc tài khoản không chính xác',
          errors: [{ field: 'password', message: 'Mật khẩu hoặc tài khoản không chính xác' }],
        };

      req.session.userId = existingUser.id;

      return { code: 200, success: true, message: 'Đăng nhập thành công', user: existingUser };
    } catch (error) {
      console.log(error);
      return {
        code: 500,
        success: false,
        message: `Server Internal Error ${error.message}`,
      };
    }
  }

  @Mutation(_return => Boolean)
  logout(@Ctx() { req, res }: Context): Promise<Boolean> {
    return new Promise((resolve, _reject) => {
      res.clearCookie(COOKIE_NAME);
      req.session.destroy(error => {
        if (error) {
          console.log('DESTROY SESSION ERROR', error);
          resolve(false);
        } else resolve(true);
      });
    });
  }
}
