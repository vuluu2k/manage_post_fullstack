import DataLoader from 'dataloader';
import { In } from 'typeorm';
import { Upvote } from '../entities/Upvote';
import { User } from '../entities/User';

const batchGetUsers = async (userIds: number[]) => {
  const users = await User.findBy({ id: In(userIds) });
  return userIds.map(userId => users.find(user => user.id === userId));
};

interface VoteTypeCondition {
  postId: number;
  userId: number;
}

const batchGetVoteTypes = async (voteTypeConditions: VoteTypeCondition[]) => {
  const postIds = voteTypeConditions.map((voteTypeCondition: VoteTypeCondition) => voteTypeCondition.postId);
  const userIds = voteTypeConditions.map((voteTypeCondition: VoteTypeCondition) => voteTypeCondition.userId);

  const voteTypes = await Upvote.findBy({ postId: In(postIds), userId: In(userIds) });
  return voteTypeConditions.map((voteTypeCondition: VoteTypeCondition) =>
    voteTypes.find(voteType => voteType.postId === voteTypeCondition.postId && voteType.userId === voteTypeCondition.userId)
  );
};

export const buildDataLoaders = () => ({
  userLoader: new DataLoader<number, User | undefined>(userIds => batchGetUsers(userIds as number[])),
  voteTypeLoader: new DataLoader<VoteTypeCondition, Upvote | undefined>(voteTypeConditions =>
    batchGetVoteTypes(voteTypeConditions as VoteTypeCondition[])
  ),
});
