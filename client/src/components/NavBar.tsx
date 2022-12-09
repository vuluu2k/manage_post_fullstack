import {
  Avatar,
  AvatarBadge,
  Box,
  Button,
  Flex,
  Heading,
  Popover, PopoverContent,
  PopoverTrigger,
  Spinner
} from '@chakra-ui/react';
import Link from 'next/link';

import { routes } from 'config';
import { MeDocument, MeQuery, useLogoutMutation, useMeQuery } from 'generated/graphql';

type Props = {};

function NavBar({}: Props) {
  const { data: meData, loading: meLoading, error: _meError } = useMeQuery();
  const [logout, { data: _logoutData, loading: _logoutLoading, error: _logoutError }] = useLogoutMutation();

  const handleOnLogout = () => {
    logout({
      update(cache, { data }) {
        if (data?.logout) cache.writeQuery<MeQuery>({ query: MeDocument, data: { me: null } });
      },
    });
  };

  if (meLoading)
    return (
      <Flex w="100vw" h="100vh" justifyContent="center" alignItems="center">
        <Spinner thickness="4px" speed="0.65s" emptyColor="gray.200" color="blue.500" size="xl" />;
      </Flex>
    );

  return (
    <Box bg="tan" p={4}>
      <Flex maxW={800} justifyContent="space-between" m="auto" alignItems="center">
        <Heading>Blogger</Heading>
        <Box>
          <Flex alignItems="center">
            {(meData?.me && (
              <Popover>
                <PopoverTrigger>
                  <Avatar>
                    <AvatarBadge boxSize="1.25em" bg="green.500" />
                  </Avatar>
                </PopoverTrigger>
                <PopoverContent p={2}>
                  <Button>Thông tin tài khoản</Button>
                  <Button mt={2} onClick={handleOnLogout}>
                    Đăng xuất
                  </Button>
                </PopoverContent>
              </Popover>
            )) || (
              <>
                <Link href={routes.login} style={{ marginRight: 4 }}>
                  Đăng nhập
                </Link>
                <Link href={routes.register}>Đăng ký</Link>
              </>
            )}
          </Flex>
        </Box>
      </Flex>
    </Box>
  );
}

export default NavBar;
