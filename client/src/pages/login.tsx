import { Box, Button } from '@chakra-ui/react';
import { Form, Formik, FormikHelpers } from 'formik';
import Router from 'next/router';

import InputField from 'components/InputField';
import Wrapper from 'components/Wrapper';
import { LoginInput, MeDocument, MeQuery, useLoginMutation } from 'generated/graphql';
import { mapFieldErrors } from 'helpers/mapFieldErrors';
import { useToast } from '@chakra-ui/react';
import { routes } from 'config';

type Props = {};

type loginInputValues = LoginInput;

function Login({}: Props) {
  const toast = useToast();
  const initialValues: loginInputValues = { usernameOrEmail: '', password: '' };
  const [loginUser, { data: _loginUserData, loading: _loginUserLoading, error: _loginUserError }] = useLoginMutation();

  const handleOnLogin = async (values: loginInputValues, { setErrors }: FormikHelpers<loginInputValues>) => {
    const response = await loginUser({
      variables: { loginInput: values },
      update(cache, { data }) {
        // const meData = cache.readQuery({ query: MeDocument });

        if (data?.login.success) {
          cache.writeQuery<MeQuery>({ query: MeDocument, data: { me: data.login.user } });
        }
      },
    });
    if (response.data?.login.errors) {
      setErrors(mapFieldErrors(response.data?.login.errors));
    } else if (response.data?.login.success) {
      toast({
        title: 'Đăng nhập thành công',
        status: 'success',
        duration: 1000,
        isClosable: true,
        position: 'top',
      });
      Router.push(routes.home);
    }
  };

  return (
    <Wrapper>
      <Formik initialValues={initialValues} onSubmit={handleOnLogin}>
        {({ isSubmitting }) => {
          return (
            <Form>
              <InputField name="usernameOrEmail" placeholder="Nhập tài khoản" label="Tài khoản" type="text" />

              <Box mt={4}>
                <InputField name="password" placeholder="Nhập mật khẩu" label="Mật khẩu" type="password" />
              </Box>

              <Button type="submit" colorScheme="teal" mt={4} isLoading={isSubmitting}>
                Đăng nhập
              </Button>
            </Form>
          );
        }}
      </Formik>
    </Wrapper>
  );
}

export default Login;