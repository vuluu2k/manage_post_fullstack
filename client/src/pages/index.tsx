import { Box, Flex, Heading, Spinner, Text } from '@chakra-ui/react';
import NextLink from 'next/link';

import Layout from 'components/Layout';
import { PostsDocument, useMeQuery, usePostsQuery } from 'generated/graphql';
import { addApolloState, initializeApollo } from 'lib/apolloClient';
import PostEditDeleteButtons from 'components/PostEditDeleteButtons';

const Index = () => {
  const { data: postsData, loading: postsLoading, error: postsError } = usePostsQuery({ variables: { limit: 5 } });
  const { data: meData, loading: meLoading, error: meError } = useMeQuery();

  return (
    <Layout>
      {postsLoading ? (
        <Flex alignItems="center" justifyContent="center" h="100vh">
          <Spinner></Spinner>
        </Flex>
      ) : (
        postsData?.getPosts?.paginatedPosts.map(post => {
          return (
            <Flex key={post.id} mt={4} p={5} shadow="md" borderWidth="1px">
              <Box flex={1}>
                <NextLink href={`/post/${post.id}`}>
                  <Heading fontSize="xl">{post.title}</Heading>
                </NextLink>
                <Text>Đăng bởi {post.user.username}</Text>
                <Flex alignItems="center">
                  <Text mt={4}>{post.textSnippet}</Text>
                  <Box ml="auto">
                    <PostEditDeleteButtons postId={post.id} postUserId={String(meData?.me?.id)} />
                  </Box>
                </Flex>
              </Box>
            </Flex>
          );
        })
      )}
    </Layout>
  );
};

export async function getStaticProps() {
  const apolloClient = initializeApollo();

  await apolloClient.query({
    query: PostsDocument,
    variables: {
      limit: 5,
    },
  });

  return addApolloState(apolloClient, {
    props: {},
  });
}

export default Index;
