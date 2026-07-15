import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
} from '@nestjs/swagger';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { Request } from 'express';

@ApiTags('reviews')
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Submit a review',
    description:
      'Rate and review a food item (customer auth required). One review per item per customer.',
  })
  create(@Req() req: Request, @Body() dto: CreateReviewDto) {
    const userId = (req as any).user?.userId;
    return this.reviewsService.create(userId, dto);
  }

  @Get('item/:foodItemId')
  @ApiOperation({
    summary: 'Get item reviews',
    description:
      'Returns all reviews with average rating for a food item. Public endpoint.',
  })
  @ApiParam({ name: 'foodItemId', description: 'Food item ID (UUID)' })
  findByItem(@Param('foodItemId') foodItemId: string) {
    return this.reviewsService.findByItem(foodItemId);
  }
}
