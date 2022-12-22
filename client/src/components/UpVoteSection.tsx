import { ChevronDownIcon, ChevronUpIcon } from '@chakra-ui/icons';
import { Flex, IconButton } from '@chakra-ui/react';
import { useState } from 'react';
import { PostWithUserInfoFragment, useVoteMutation, VoteType } from '../generated/graphql';

interface UpvoteSectionProps {
  post: PostWithUserInfoFragment;
}

enum VoteTypeValues {
  UpVote = 1,
  DownVote = -1,
}

const UpvoteSection = ({ post }: UpvoteSectionProps) => {
  const [vote, { loading }] = useVoteMutation();

  const [loadingState, setLoadingState] = useState<'upvote-loading' | 'downvote-loading' | 'not-loading'>('not-loading');

  const upvote = async (postId: string) => {
    setLoadingState('upvote-loading');
    await vote({
      variables: { voteType: VoteType.UpVote, postId: parseInt(postId) },
    });
    setLoadingState('not-loading');
  };

  const downvote = async (postId: string) => {
    setLoadingState('downvote-loading');
    await vote({
      variables: { voteType: VoteType.DownVote, postId: parseInt(postId) },
    });
    setLoadingState('not-loading');
  };

  return (
    <Flex direction="column" alignItems="center" mr={4}>
      <IconButton
        icon={<ChevronUpIcon />}
        aria-label="upvote"
        onClick={post.voteType === VoteTypeValues.UpVote ? undefined : upvote.bind(this, post.id)}
        isLoading={loading && loadingState === 'upvote-loading'}
        colorScheme={post.voteType === VoteTypeValues.UpVote ? 'green' : undefined}
      />
      {post.points}
      <IconButton
        icon={<ChevronDownIcon />}
        aria-label="downvote"
        onClick={post.voteType === VoteTypeValues.DownVote ? undefined : downvote.bind(this, post.id)}
        isLoading={loading && loadingState === 'downvote-loading'}
        colorScheme={post.voteType === VoteTypeValues.DownVote ? 'red' : undefined}
      />
    </Flex>
  );
};

export default UpvoteSection;
