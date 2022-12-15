import React, { ReactNode } from 'react';
import NavBar from './NavBar';
import Wrapper from './Wrapper';

type Props = {
  children: ReactNode;
};

function Layout({ children }: Props) {
  return (
    <>
      <NavBar></NavBar>
      <Wrapper>{children}</Wrapper>
    </>
  );
}

export default Layout;
