import { Box, Button, Flex, Spinner, useToast } from '@chakra-ui/react';
import { Form, Formik, FormikHelpers } from 'formik';
import Router from 'next/router';
import { omit } from 'lodash';

import InputField from 'components/InputField';
import Wrapper from 'components/Wrapper';
import { MeDocument, MeQuery, RegisterInput, useRegisterMutation } from 'generated/graphql';
import { mapFieldErrors } from 'helpers/mapFieldErrors';
import { routes } from 'config';
import { useCheckAuth } from 'utils/useCheckAuth';

type Props = {};

type registerInputValues = {
  rePassword: string;
} & RegisterInput;

function Register({}: Props) {
  const toast = useToast();
  const initialValues: registerInputValues = { username: '', email: '', password: '', rePassword: '' };
  const { data: authData, loading: authLoading } = useCheckAuth();
  const [registerUser, { data: _registerUserData, loading: _registerUserLoading, error: _registerUserError }] = useRegisterMutation();

  const handleOnRegister = async (values: registerInputValues, { setErrors }: FormikHelpers<registerInputValues>) => {
    if (values.password !== values.rePassword) {
      setErrors({ rePassword: 'Mật khẩu không khớp' });
      return;
    }
    const response = await registerUser({
      variables: { registerInput: omit(values, 'rePassword') },
      update(cache, { data }) {
        if (data?.register.success) {
          cache.writeQuery<MeQuery>({ query: MeDocument, data: { me: data.register.user } });
        }
      },
    });
    if (response.data?.register.errors) {
      setErrors(mapFieldErrors(response.data?.register.errors));
    } else if (response.data?.register.success) {
      toast({
        title: 'Đăng ký thành công',
        status: 'success',
        duration: 1000,
        isClosable: true,
        position: 'top',
      });
      Router.push(routes.home);
    }
  };

  if (authLoading || (!authLoading && authData?.me)) {
    return (
      <Flex alignItems="center" justifyContent="center" w="100vw" h="100vh">
        <Spinner></Spinner>
      </Flex>
    );
  }

  return (
    <Wrapper size="small">
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
