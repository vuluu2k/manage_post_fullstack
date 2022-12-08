import React from 'react';
import { Formik, Form } from 'formik';
import { FormControl, FormLabel, Input } from '@chakra-ui/react';

type Props = {};

interface registerInputValues {
  username: string;
  password: string;
}

function register({}: Props) {
  const initialValues: registerInputValues = { username: '', password: '' };

  const handleOnRegister = values => {};

  return (
    <Formik initialValues={initialValues} onSubmit={handleOnRegister}>
      {({ values, handleChange }) => {
        return (
          <Form>
            <FormControl>
              <FormLabel htmlFor="username">Tài khoản</FormLabel>
              <Input id="username" placeholder="Nhập tên tài khoản" value={values.username} onChange={handleChange} />
            </FormControl>
          </Form>
        );
      }}
    </Formik>
  );
}

export default register;
