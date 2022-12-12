import NavBar from 'components/NavBar';
import { PostsDocument, usePostsQuery } from 'generated/graphql';
import { addApolloState, initializeApollo } from 'lib/apolloClient';

const Index = () => {
  const {data:postsData,loading:postsLoading,error:postsError}=usePostsQuery()


  return <>
    <NavBar />
    {postsData?.getPosts.map(post=> <li>{post.title}</li> )}
  </>
};

export async function getStaticProps() {
  const apolloClient = initializeApollo();

  await apolloClient.query({
    query: PostsDocument,
  });

  return addApolloState(apolloClient, {
    props: {},
  });
}

export default Index;
