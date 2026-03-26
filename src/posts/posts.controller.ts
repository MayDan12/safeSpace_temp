import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  Request,
} from '@nestjs/common';
import { PostsService } from './posts.service';
import {
  CreatePostDto,
  UpdatePostDto,
  ToggleCommentsDto,
  ReportPostDto,
} from './dto/post.dto';
import { CreateCommentDto, ReportCommentDto } from './dto/comment.dto';
import { PaginationDto } from './dto/pagination.dto';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
} from '@nestjs/swagger';

interface RequestWithUser extends Request {
  user: {
    id: string;
    email: string;
    role: string;
  };
}

@ApiTags('posts')
@ApiBearerAuth()
@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Get()
  @ApiOperation({ summary: 'List public board posts (paginated)' })
  @ApiResponse({ status: 200, description: 'List of posts' })
  findAll(@Query() paginationDto: PaginationDto) {
    return this.postsService.findAllPosts(paginationDto);
  }

  @Post()
  @ApiOperation({ summary: 'Create a post' })
  @ApiResponse({ status: 201, description: 'Post created' })
  create(
    @Request() req: RequestWithUser,
    @Body() createPostDto: CreatePostDto,
  ) {
    return this.postsService.createPost(req.user.id, createPostDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get single post' })
  @ApiResponse({ status: 200, description: 'The post' })
  findOne(@Param('id') id: string) {
    return this.postsService.findOnePost(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Edit own post' })
  @ApiResponse({ status: 200, description: 'Post updated' })
  update(
    @Param('id') id: string,
    @Request() req: RequestWithUser,
    @Body() updatePostDto: UpdatePostDto,
  ) {
    return this.postsService.updatePost(id, req.user.id, updatePostDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete own post' })
  @ApiResponse({ status: 200, description: 'Post deleted' })
  remove(@Param('id') id: string, @Request() req: RequestWithUser) {
    return this.postsService.deletePost(id, req.user.id);
  }

  @Post(':id/support')
  @ApiOperation({ summary: 'Toggle "Support" reaction' })
  @ApiResponse({ status: 200, description: 'Support toggled' })
  toggleSupport(@Param('id') id: string) {
    return this.postsService.toggleSupport(id);
  }

  @Patch(':id/toggle-comments')
  @ApiOperation({ summary: 'Enable/disable comments on post' })
  @ApiResponse({ status: 200, description: 'Comments toggled' })
  toggleComments(
    @Param('id') id: string,
    @Request() req: RequestWithUser,
    @Body() toggleCommentsDto: ToggleCommentsDto,
  ) {
    return this.postsService.toggleComments(
      id,
      req.user.id,
      toggleCommentsDto.commentsEnabled,
    );
  }

  @Post(':id/report')
  @ApiOperation({ summary: 'Flag post for moderation' })
  @ApiResponse({ status: 201, description: 'Post reported' })
  report(
    @Param('id') id: string,
    @Request() req: RequestWithUser,
    @Body() reportPostDto: ReportPostDto,
  ) {
    return this.postsService.reportPost(id, req.user.id, reportPostDto);
  }

  @Get(':id/comments')
  @ApiOperation({ summary: 'List comments on a post' })
  @ApiResponse({ status: 200, description: 'List of comments' })
  findComments(@Param('id') id: string) {
    return this.postsService.findCommentsByPostId(id);
  }

  @Post(':id/comments')
  @ApiOperation({ summary: 'Add comment' })
  @ApiResponse({ status: 201, description: 'Comment added' })
  createComment(
    @Param('id') id: string,
    @Request() req: RequestWithUser,
    @Body() createCommentDto: CreateCommentDto,
  ) {
    return this.postsService.createComment(id, req.user.id, createCommentDto);
  }

  @Delete(':postId/comments/:commentId')
  @ApiOperation({ summary: 'Delete own comment' })
  @ApiResponse({ status: 200, description: 'Comment deleted' })
  removeComment(
    @Param('postId') postId: string,
    @Param('commentId') commentId: string,
    @Request() req: RequestWithUser,
  ) {
    return this.postsService.deleteComment(postId, commentId, req.user.id);
  }

  @Post(':postId/comments/:commentId/report')
  @ApiOperation({ summary: 'Flag comment' })
  @ApiResponse({ status: 201, description: 'Comment reported' })
  reportComment(
    @Param('postId') postId: string,
    @Param('commentId') commentId: string,
    @Request() req: RequestWithUser,
    @Body() reportCommentDto: ReportCommentDto,
  ) {
    return this.postsService.reportComment(
      postId,
      commentId,
      req.user.id,
      reportCommentDto,
    );
  }
}
