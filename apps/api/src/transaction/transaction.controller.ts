import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import type { TransactionListResponse, TransactionPublic, UserPublic } from '@expence-tracker/shared-types';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { CurrentUser } from '@/auth/decorators/current-user.decorator';
import { CreateTransactionCommand } from './commands/create-transaction.command';
import { UpdateTransactionCommand } from './commands/update-transaction.command';
import { DeleteTransactionCommand } from './commands/delete-transaction.command';
import { GetTransactionsByUserIdQuery } from './queries/get-transactions-by-user-id.query';
import { GetTransactionByIdAndUserIdQuery } from './queries/get-transaction-by-id-and-user-id.query';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { ListTransactionsQuery } from './dto/list-transactions.query';

@Controller('transactions')
@UseGuards(JwtAuthGuard)
export class TransactionController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@CurrentUser() user: UserPublic, @Body() dto: CreateTransactionDto): Promise<TransactionPublic> {
    return this.commandBus.execute(new CreateTransactionCommand(user.id, dto));
  }

  @Get()
  findAll(@CurrentUser() user: UserPublic, @Query() query: ListTransactionsQuery): Promise<TransactionListResponse> {
    return this.queryBus.execute(new GetTransactionsByUserIdQuery(user.id, query.month, query.year));
  }

  @Get(':id')
  findOne(@CurrentUser() user: UserPublic, @Param('id', ParseUUIDPipe) id: string): Promise<TransactionPublic> {
    return this.queryBus.execute(new GetTransactionByIdAndUserIdQuery(id, user.id));
  }

  @Patch(':id')
  update(
    @CurrentUser() user: UserPublic,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTransactionDto,
  ): Promise<TransactionPublic> {
    return this.commandBus.execute(new UpdateTransactionCommand(id, user.id, dto));
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@CurrentUser() user: UserPublic, @Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.commandBus.execute(new DeleteTransactionCommand(id, user.id));
  }
}
