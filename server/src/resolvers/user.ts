import { validateRegisterInput } from './../utils/validateRegisterInput';
import { Context } from '../types/Context';
import { Resolver, Mutation, Arg, Ctx, Query, FieldResolver, Root } from 'type-graphql';
import argon2 from 'argon2';
import { User } from '../entities/User';
import { UserMutationResponse } from '../types/UserMutationResponse';
import { RegisterInput } from '../types/RegisterInput';
import { LoginInput } from '../types/LoginInput';
import { COOKIE_NAME } from '../constants';
import { ForgotPasswordInput } from '../types/ForgotPasswordInput';
import { sendEmail } from '../utils/sendEmail';
import { TokenModel } from '../models/Token';
import { v4 as uuidv4 } from 'uuid';
import { ChangePasswordInput } from '../types/ChangePasswordInput';

@Resolver(_of => User)
export class UserResolver {
  @FieldResolver(_type => String, { nullable: true })
  async email(@Root() root: User, @Ctx() { req }: Context): Promise<String> {
    return root.id === req.session.userId ? root.email : '';
  }

  @Query(_return => User, { nullable: true })
  async me(@Ctx() { req }: Context): Promise<User | null> {
    if (!req.session.userId) return null;

    return await User.findOneBy({ id: req.session.userId });
  }

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
          errors: [{ field: 'password', message: 'Mật khẩu hoặc tài khoản không chính xác' }],
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

  @Mutation(_return => Boolean)
  async forgotPassword(@Arg('forgotPasswordInput') forgotPasswordInput: ForgotPasswordInput): Promise<boolean> {
    const { email } = forgotPasswordInput;
    const existingUser = await User.findOneBy({ email: email });

    if (!existingUser) return true;

    await TokenModel.findOneAndDelete({ userId: `${existingUser.id}` });

    const resetToken = uuidv4();

    const hashedResetToken = await argon2.hash(resetToken);

    await new TokenModel({ userId: `${existingUser.id}`, token: hashedResetToken }).save();

    await sendEmail(
      email,
      `<a href="http://localhost:3000/change-password?token=${resetToken}&userId=${existingUser.id}">Bấm vào đường đây để thay đổi mật khẩu</a>`
    );

    return true;
  }

  @Mutation(_return => UserMutationResponse)
  async changePassword(
    @Arg('token') token: string,
    @Arg('userId') userId: string,
    @Arg('changePasswordInput') changePasswordInput: ChangePasswordInput,
    @Ctx() { req }: Context
  ): Promise<UserMutationResponse> {
    try {
      const { newPassword } = changePasswordInput;
      if (newPassword.length < 8)
        return {
          code: 400,
          success: false,
          message: 'Mật khẩu tối thiểu là 8 kí tự',
          errors: [
            {
              field: 'newPassword',
              message: `Mật khẩu có độ dài ${newPassword.length} không hợp lệ`,
            },
          ],
        };

      const resetPasswordTokenRecord = await TokenModel.findOne({ userId: userId });
      const resetPasswordTokenValid = resetPasswordTokenRecord && (await argon2.verify(resetPasswordTokenRecord.token, token));

      if (!resetPasswordTokenRecord || !resetPasswordTokenValid)
        return {
          code: 400,
          success: false,
          message: 'Token không hợp lệ / hết hạn',
          errors: [
            {
              field: 'token',
              message: 'Token không hợp lệ / hết hạn',
            },
          ],
        };

      const userIdNum = parseInt(userId);
      const existingUser = await User.findOneBy({ id: userIdNum });

      if (!existingUser)
        return {
          code: 400,
          success: false,
          message: 'Tài khoản không còn tồn tại',
          errors: [
            {
              field: 'token',
              message: 'Tài khoản không còn tồn tại',
            },
          ],
        };

      const updatedPassword = await argon2.hash(newPassword);

      await User.update({ id: userIdNum }, { password: updatedPassword });
      await resetPasswordTokenRecord.deleteOne();

      req.session.userId = existingUser.id;

      return {
        code: 200,
        success: true,
        message: 'Thay đổi mật khẩu thành công',
        user: existingUser,
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
}
