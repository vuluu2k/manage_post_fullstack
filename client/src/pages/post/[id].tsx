import { Alert, AlertIcon, AlertTitle, Box, Button, Flex, Heading, Spinner } from '@chakra-ui/react';
import { GetStaticPaths, GetStaticProps } from 'next';
import { useRouter } from 'next/router';
import Layout from 'components/Layout';
import { PostDocument, PostIdsDocument, PostIdsQuery, PostQuery, usePostQuery } from 'generated/graphql';
import { addApolloState, initializeApollo } from 'lib/apolloClient';
import { limit } from '../index';
import NextLink from 'next/link';
import PostEditDeleteButtons from 'components/PostEditDeleteButtons';
import { routes } from 'config';

const Post = () => {
  const router = useRouter();
  const { data, loading, error } = usePostQuery({
    variables: { id: router.query.id as string },
  });

  if (loading)
    return (
      <Layout>
        <Flex justifyContent="center" alignItems="center" minH="100vh">
          <Spinner />
        </Flex>
      </Layout>
    );

  if (error || !data?.getPost)
    return (
      <Layout>
        <Alert status="error">
          <AlertIcon />
          <AlertTitle>{error ? error.message : 'Bài viết không tồn tại'}</AlertTitle>
        </Alert>
        <Box mt={4}>
          <NextLink href={routes.home}>
            <Button>Quay lại trang chủ</Button>
          </NextLink>
        </Box>
      </Layout>
    );

  return (
    <Layout>
      <Heading mb={4}>{data.getPost.title}</Heading>
      <Box mb={4}>{data.getPost.text}</Box>
      <Flex justifyContent="space-between" alignItems="center">
        <PostEditDeleteButtons postId={data.getPost.id} postUserId={data.getPost.userId.toString()} />
        <NextLink href={routes.home}>
          <Button>Quay lại trang chủ</Button>
        </NextLink>
      </Flex>
    </Layout>
  );
};

export const getStaticPaths: GetStaticPaths = async () => {
  // [
  //   { params: { id: '15'} },
  //   { params: { id: '16'} }
  // ]

  const apolloClient = initializeApollo();

  const { data } = await apolloClient.query<PostIdsQuery>({
    query: PostIdsDocument,
    variables: { limit },
  });
 
  return {
    paths: data.getPosts!.paginatedPosts.map(post => ({
      params: { id: `${post.id}` },
    })),
    fallback: 'blocking',
  };
};

export const getStaticProps: GetStaticProps<{ [key: string]: any }, { id: string }> = async ({ params }) => {
  const apolloClient = initializeApollo();

  await apolloClient.query<PostQuery>({
    query: PostDocument,
    variables: { id: params?.id },
  });

  return addApolloState(apolloClient, { props: {} });
};

export default Post;
