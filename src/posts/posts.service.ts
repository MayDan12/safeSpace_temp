import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePostDto, UpdatePostDto, ReportPostDto } from './dto/post.dto';
import { CreateCommentDto, ReportCommentDto } from './dto/comment.dto';
import { PaginationDto } from './dto/pagination.dto';
import { ReportTargetType } from 'generated/prisma';

@Injectable()
export class PostsService {
  constructor(private prisma: PrismaService) {}

  async createPost(userId: string, createPostDto: CreatePostDto) {
    return this.prisma.post.create({
      data: {
        ...createPostDto,
        authorId: userId,
      },
    });
  }

  async findAllPosts(paginationDto: PaginationDto) {
    const { page, limit } = paginationDto;
    const skip = (page - 1) * limit;

    const [posts, total] = await Promise.all([
      this.prisma.post.findMany({
        where: { isHidden: false },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          author: {
            select: {
              id: true,
              pseudonym: true,
              role: true,
            },
          },
          _count: {
            select: { comments: true },
          },
        },
      }),
      this.prisma.post.count({ where: { isHidden: false } }),
    ]);

    return {
      data: posts.map((post) => {
        if (post.isAnonymous) {
          return { ...post, author: null };
        }
        return post;
      }),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOnePost(id: string) {
    const post = await this.prisma.post.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            pseudonym: true,
            role: true,
          },
        },
        _count: {
          select: { comments: true },
        },
      },
    });

    if (!post || post.isHidden) {
      throw new NotFoundException('Post not found');
    }

    if (post.isAnonymous) {
      return { ...post, author: null };
    }

    return post;
  }

  async updatePost(id: string, userId: string, updatePostDto: UpdatePostDto) {
    const post = await this.prisma.post.findUnique({ where: { id } });
    if (!post) throw new NotFoundException('Post not found');
    if (post.authorId !== userId) throw new ForbiddenException('Not your post');

    return this.prisma.post.update({
      where: { id },
      data: updatePostDto,
    });
  }

  async deletePost(id: string, userId: string) {
    const post = await this.prisma.post.findUnique({ where: { id } });
    if (!post) throw new NotFoundException('Post not found');
    if (post.authorId !== userId) throw new ForbiddenException('Not your post');

    return this.prisma.post.delete({ where: { id } });
  }

  async toggleSupport(id: string) {
    const post = await this.prisma.post.findUnique({ where: { id } });
    if (!post) throw new NotFoundException('Post not found');

    // In a real app, you might want to track who supported which post
    // but the schema only has a supportCount field.
    return this.prisma.post.update({
      where: { id },
      data: {
        supportCount: {
          increment: 1,
        },
      },
    });
  }

  async toggleComments(id: string, userId: string, commentsEnabled: boolean) {
    const post = await this.prisma.post.findUnique({ where: { id } });
    if (!post) throw new NotFoundException('Post not found');
    if (post.authorId !== userId) throw new ForbiddenException('Not your post');

    return this.prisma.post.update({
      where: { id },
      data: { commentsEnabled },
    });
  }

  async reportPost(id: string, userId: string, reportPostDto: ReportPostDto) {
    const post = await this.prisma.post.findUnique({ where: { id } });
    if (!post) throw new NotFoundException('Post not found');

    return this.prisma.report.create({
      data: {
        reason: reportPostDto.reason,
        reporterId: userId,
        targetType: ReportTargetType.POST,
        postId: id,
      },
    });
  }

  async findCommentsByPostId(postId: string) {
    const comments = await this.prisma.comment.findMany({
      where: { postId, isHidden: false },
      orderBy: { createdAt: 'asc' },
      include: {
        author: {
          select: {
            id: true,
            pseudonym: true,
            role: true,
          },
        },
      },
    });

    return comments.map((comment) => {
      if (comment.isAnonymous) {
        return { ...comment, author: null };
      }
      return comment;
    });
  }

  async createComment(
    postId: string,
    userId: string,
    createCommentDto: CreateCommentDto,
  ) {
    const post = await this.prisma.post.findUnique({ where: { id: postId } });
    if (!post) throw new NotFoundException('Post not found');
    if (!post.commentsEnabled) {
      throw new ForbiddenException('Comments are disabled for this post');
    }

    return this.prisma.comment.create({
      data: {
        ...createCommentDto,
        postId,
        authorId: userId,
      },
    });
  }

  async deleteComment(postId: string, commentId: string, userId: string) {
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
    });
    if (!comment) throw new NotFoundException('Comment not found');
    if (comment.postId !== postId) {
      throw new BadRequestException('Comment does not belong to this post');
    }
    if (comment.authorId !== userId) {
      throw new ForbiddenException('Not your comment');
    }

    return this.prisma.comment.delete({ where: { id: commentId } });
  }

  async reportComment(
    postId: string,
    commentId: string,
    userId: string,
    reportCommentDto: ReportCommentDto,
  ) {
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
    });
    if (!comment) throw new NotFoundException('Comment not found');

    return this.prisma.report.create({
      data: {
        reason: reportCommentDto.reason,
        reporterId: userId,
        targetType: ReportTargetType.COMMENT,
        commentId: commentId,
      },
    });
  }
}
