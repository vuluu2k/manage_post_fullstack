import { Box, Button, Flex, Heading, Spinner, Text } from '@chakra-ui/react';
import NextLink from 'next/link';

import Layout from 'components/Layout';
import { PostsDocument, useMeQuery, usePostsQuery } from 'generated/graphql';
import { addApolloState, initializeApollo } from 'lib/apolloClient';
import PostEditDeleteButtons from 'components/PostEditDeleteButtons';
import { NetworkStatus } from '@apollo/client';
import { GetStaticProps } from 'next';
import UpVoteSection from 'components/UpVoteSection';

export const limit = 5;

const Index = () => {
  const {
    data: postsData,
    loading: postsLoading,
    error: _postsError,
    fetchMore: postFetchMore,
    networkStatus: postNetworkStatus,
  } = usePostsQuery({
    variables: { limit: limit },
    // component re-render when network status changed
    notifyOnNetworkStatusChange: true,
  });
  const { data: meData, loading: _meLoading, error: _meError } = useMeQuery();

  const handleLoadMorePosts = () => {
    postFetchMore({ variables: { cursor: postsData?.getPosts?.cursor } });
  };

  const loadingMorePosts = postNetworkStatus === NetworkStatus.fetchMore;

  return (
    <Layout>
      {postsLoading && !loadingMorePosts ? (
        <Flex alignItems="center" justifyContent="center" h="100vh">
          <Spinner></Spinner>
        </Flex>
      ) : (
        postsData?.getPosts?.paginatedPosts.map((post, index) => {
          return (
            <Flex key={`${index}${post.id}`} mt={4} p={5} shadow="md" borderWidth="1px">
              <UpVoteSection post={post} />
              <Box flex={1}>
                <NextLink href={`/post/${post.id}`}>
                  <Heading fontSize="xl">{post.title}</Heading>
                </NextLink>
                <Text>Đăng bởi {post.user.username}</Text>
                <Flex alignItems="center">
                  <Text mt={4}>{post.textSnippet}</Text>
                  {meData?.me?.id === post.user.id && (
                    <Box ml="auto">
                      <PostEditDeleteButtons postId={post.id} postUserId={String(meData?.me?.id)} />
                    </Box>
                  )}
                </Flex>
              </Box>
            </Flex>
          );
        })
      )}

      {postsData?.getPosts?.hasMore && (
        <Flex>
          <Button m="auto" my={8} isLoading={loadingMorePosts} onClick={handleLoadMorePosts}>
            {loadingMorePosts ? 'Đang tải...' : 'Xem thêm'}
          </Button>
        </Flex>
      )}
    </Layout>
  );
};

export const getStaticProps: GetStaticProps = async () => {
  const apolloClient = initializeApollo();

  await apolloClient.query({
    query: PostsDocument,
    variables: {
      limit: limit,
    },
  });

  return addApolloState(apolloClient, {
    props: {},
  });
};

export default Index;
