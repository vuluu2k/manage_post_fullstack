import { Upvote } from './../entities/Upvote';
import { UserInputError } from 'apollo-server-express';
import { Arg, Ctx, FieldResolver, ID, Int, Mutation, Query, registerEnumType, Resolver, Root, UseMiddleware } from 'type-graphql';
import { LessThan } from 'typeorm';
import { Post } from '../entities/Post';
import { User } from '../entities/User';
import { checkAuth } from '../middlewares/checkAuth';
import { Context } from '../types/Context';
import { CreatePostInput } from '../types/CreatePostInput';
import { PaginatedPosts } from '../types/PaginatedPosts';
import { PostMutationResponse } from '../types/PostMutationResponse';
import { UpdatePostInput } from '../types/UpdatePostInput';
import { VoteType } from '../types/VoteType';

registerEnumType(VoteType, {
  name: 'VoteType', // this one is mandatory
  // description: 'The basic directions', // this one is optional
});

@Resolver(_of => Post)
export class PostResolver {
  @FieldResolver(_return => String)
  textSnippet(@Root() root: Post) {
    return root.text.slice(0, 50);
  }

  @FieldResolver(_return => User)
  async user(@Root() root: Post, @Ctx() { dataLoaders: { userLoader } }: Context) {
    return await userLoader.load(root.userId);
  }

  @FieldResolver(_return => Int)
  async voteType(@Root() root: Post, @Ctx() { req, dataLoaders: { voteTypeLoader } }: Context) {
    if (!req.session.userId) return 0;
    // const existingVote = await Upvote.findOne({ where: { postId: root.id, userId: req.session.userId } });
    const existingVote = await voteTypeLoader.load({ postId: root.id, userId: req.session.userId });
    return (existingVote && existingVote?.value) || 0;
  }

  @Mutation(_return => PostMutationResponse)
  async createPost(@Arg('createPostInput') createPostInput: CreatePostInput, @Ctx() { req }: Context): Promise<PostMutationResponse> {
    const { title, text } = createPostInput;
    try {
      const newPost = Post.create({ title, text, userId: req.session.userId });
      await newPost.save();

      return {
        code: 200,
        success: true,
        message: 'Tạo bài đăng thành công',
        post: newPost,
      };
    } catch (error) {
      console.log(error);
      return {
        code: 500,
        success: false,
        message: `Server Internal Error ${error.message}`,
      };
    }
  }

  @Query(_return => PaginatedPosts, { nullable: true })
  async getPosts(@Arg('limit', _type => Int) limit: number, @Arg('cursor', { nullable: true }) cursor?: string): Promise<PaginatedPosts | null> {
    try {
      const totalPostCount = await Post.count();
      const realLimit = Math.min(10, limit);

      const findOptions: { [key: string]: any } = {
        order: {
          createdAt: 'DESC',
        },
        take: realLimit,
      };

      let lastPost: Post[] = [];
      if (cursor) {
        findOptions.where = { createdAt: LessThan(cursor) };

        lastPost = await Post.find({ order: { createdAt: 'ASC' }, take: 1 });
      }

      const posts = await Post.find(findOptions);

      return {
        totalCount: totalPostCount,
        cursor: posts[posts.length - 1].createdAt,
        hasMore: cursor ? posts[posts.length - 1].createdAt.toString() !== lastPost[0].createdAt.toString() : posts.length !== totalPostCount,
        paginatedPosts: posts,
      };
    } catch (error) {
      console.log(error);
      return null;
    }
  }

  @Query(_return => Post, { nullable: true })
  async getPost(@Arg('id', _type => ID) id: number): Promise<Post | null> {
    try {
      const post = await Post.findOneBy({ id });
      return post;
    } catch (error) {
      console.log(error);
      return null;
    }
  }

  @Mutation(_return => PostMutationResponse)
  async updatePost(@Arg('updatePostInput') updatePostInput: UpdatePostInput, @Ctx() { req }: Context): Promise<PostMutationResponse> {
    const { id, title, text } = updatePostInput;
    try {
      const existingPost = await Post.findOneBy({ id });
      if (!existingPost) return { code: 400, success: false, message: 'Không tìm thấy bài đăng này' };
      if (existingPost.userId !== req.session.userId) {
        return { code: 401, success: false, message: 'Bạn không có quyền trên bài đăng này' };
      }

      existingPost.title = title;
      existingPost.text = text;
      existingPost.save();

      return { code: 200, success: true, message: 'Cập nhật thành công', post: existingPost };
    } catch (error) {
      console.log(error);
      return {
        code: 500,
        success: false,
        message: `Server Internal Error ${error.message}`,
      };
    }
  }

  @Mutation(_return => PostMutationResponse)
  @UseMiddleware(checkAuth)
  async deletePost(@Arg('id', _type => ID) id: number, @Ctx() { req }: Context): Promise<PostMutationResponse> {
    try {
      const existingPost = await Post.findOneBy({ id });
      if (!existingPost)
        return {
          code: 400,
          success: false,
          message: 'Post not found',
        };

      if (existingPost.userId !== req.session.userId) {
        return { code: 401, success: false, message: 'Bạn không có quyền trên bài đăng này' };
      }

      // await Upvote.delete({postId: id})

      await Post.delete({ id });

      return { code: 200, success: true, message: 'Post deleted successfully', post: existingPost };
    } catch (error) {
      console.log(error);
      return {
        code: 500,
        success: false,
        message: `Server Internal Error ${error.message}`,
      };
    }
  }

  @Mutation(_return => PostMutationResponse)
  @UseMiddleware(checkAuth)
  async vote(
    @Arg('postId', _type => Int) postId: number,
    @Arg('voteType', _type => VoteType) voteType: VoteType,
    @Ctx() context: Context
  ): Promise<PostMutationResponse> {
    const { req, dataSource } = context;

    return await dataSource.transaction(async transactionalEntityManager => {
      let post = await transactionalEntityManager.findOne(Post, { where: { id: postId } });
      if (!post) {
        throw new UserInputError(`Không thấy bài đăng có id: ${postId}`);
      }

      const existingVote = await transactionalEntityManager.findOne(Upvote, { where: { postId: postId, userId: req.session.userId } });

      if (existingVote) {
        if (existingVote.value === voteType) {
          return {
            code: 400,
            success: false,
            message: `Bạn đã vote ${voteType === 1 ? 'up' : 'down'}`,
          };
        }
        await transactionalEntityManager.save(Upvote, {
          ...existingVote,
          value: voteType,
        });
      } else {
        const newVote = transactionalEntityManager.create(Upvote, {
          userId: req.session.userId,
          postId: postId,
          value: voteType,
        });

        await transactionalEntityManager.save(newVote);
      }

      const handlePoint = existingVote ? voteType * 2 : voteType;

      post.points = post.points + handlePoint;
      post = await transactionalEntityManager.save(post);

      return {
        code: 200,
        success: true,
        message: 'Vote thành công',
        post: post,
      };
    });
  }
}
