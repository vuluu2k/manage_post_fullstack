import { RegisterInput } from '../types/RegisterInput';

export const validateRegisterInput = (registerInput: RegisterInput) => {
  const { username, email, password } = registerInput;

  if (!email.includes('@'))
    return {
      message: 'Email không đúng định dạng',
      errors: [
        {
          field: 'email',
          message: 'Email không chữa kí tự @ ',
        },
      ],
    };
  if (username.length <= 2) {
    return {
      message: 'Tên người dùng tối thiểu là 2 kí tự',
      errors: [
        {
          field: 'username',
          message: `Tên người dùng có độ dài ${username.length} không hợp lệ`,
        },
      ],
    };
  }

  if (password.length < 8) {
    return {
      message: 'Mật khẩu tối thiểu là 8 kí tự',
      errors: [
        {
          field: 'password',
          message: `Mật khẩu có độ dài ${password.length} không hợp lệ`,
        },
      ],
    };
  }

  return null;
};
