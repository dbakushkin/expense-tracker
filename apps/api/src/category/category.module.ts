import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { CategoryController } from './category.controller';
import { CategoryService } from './category.service';
import { CommandHandlers } from './commands/handlers';
import { QueryHandlers } from './queries/handlers';

@Module({
  imports: [CqrsModule],
  controllers: [CategoryController],
  providers: [CategoryService, ...CommandHandlers, ...QueryHandlers],
})
export class CategoryModule {}
