import { Box, Button } from '@chakra-ui/react';
import { Form, Formik, FormikHelpers } from 'formik';
import Router from 'next/router';
import { omit } from 'lodash';

import InputField from 'components/InputField';
import Wrapper from 'components/Wrapper';
import { RegisterInput, useRegisterMutation } from 'generated/graphql';
import { mapFieldErrors } from 'helpers/mapFieldErrors';

type Props = {};

type registerInputValues = {
  rePassword: string;
} & RegisterInput;

function Register({}: Props) {
  const initialValues: registerInputValues = { username: '', email: '', password: '', rePassword: '' };
  const [registerUser, { data: _registerUserData, loading: _registerUserLoading, error: _registerUserError }] = useRegisterMutation();

  const handleOnRegister = async (values: registerInputValues, { setErrors }: FormikHelpers<registerInputValues>) => {
    if (values.password !== values.rePassword) {
      setErrors({ rePassword: 'Mật khẩu không khớp' });
      return;
    }
    const response = await registerUser({ variables: { registerInput: omit(values, 'rePassword') } });
    if (response.data?.register.errors) {
      setErrors(mapFieldErrors(response.data?.register.errors));
    } else if (response.data?.register.success) {
      Router.push('/');
    }
  };

  return (
    <Wrapper>
      <Formik initialValues={initialValues} onSubmit={handleOnRegister}>
        {({ isSubmitting }) => {
          return (
            <Form>
              <InputField name="username" placeholder="Nhập tài khoản" label="Tài khoản" type="text" />
              <Box mt={4}>
                <InputField name="email" placeholder="Nhập Email" label="Email" type="text" />
              </Box>
              <Box mt={4}>
                <InputField name="password" placeholder="Nhập mật khẩu" label="Mật khẩu" type="password" />
              </Box>
              <Box mt={4}>
                <InputField name="rePassword" placeholder="Nhập Lặp lại mật khẩu" label="Lặp lại mật khẩu" type="password" />
              </Box>
              <Button type="submit" colorScheme="teal" mt={4} isLoading={isSubmitting}>
                Đăng ký
              </Button>
            </Form>
          );
        }}
      </Formik>
    </Wrapper>
  );
}

export default Register;
