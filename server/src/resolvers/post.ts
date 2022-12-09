import { Arg, ID, Mutation, Query, Resolver, UseMiddleware } from 'type-graphql';
import { Post } from '../entities/Post';
import { checkAuth } from '../middlewares/checkAuth';
import { CreatePostInput } from '../types/CreatePostInput';
import { PostMutationResponse } from '../types/PostMutationResponse';
import { UpdatePostInput } from '../types/UpdatePostInput';

@Resolver()
export class PostResolver {
  @Mutation(_return => PostMutationResponse)
  async createPost(@Arg('createPostInput') createPostInput: CreatePostInput): Promise<PostMutationResponse> {
    const { title, text } = createPostInput;
    try {
      const newPost = Post.create({ title, text });
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

  @Query(_return => [Post])
  async getPosts(): Promise<Post[]> {
    return await Post.find();
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
  async updatePost(@Arg('updatePostInput') updatePostInput: UpdatePostInput): Promise<PostMutationResponse> {
    const { id, title, text } = updatePostInput;
    try {
      const existingPost = await Post.findOneBy({ id });
      if (!existingPost) return { code: 400, success: false, message: 'Không tìm thấy bài đăng này' };

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
  async deletePost(@Arg('id', _type => ID) id: number): Promise<PostMutationResponse> {
    try {
      const existingPost = await Post.findOneBy({ id });
      if (!existingPost)
        return {
          code: 400,
          success: false,
          message: 'Post not found',
        };

      // if (existingPost.userId !== req.session.userId) {
      // 	return { code: 401, success: false, message: 'Unauthorised' }
      // }

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
}
