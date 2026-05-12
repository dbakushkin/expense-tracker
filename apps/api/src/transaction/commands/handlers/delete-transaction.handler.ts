import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DeleteTransactionCommand } from '../delete-transaction.command';
import { TransactionService } from '../../transaction.service';

@CommandHandler(DeleteTransactionCommand)
export class DeleteTransactionHandler implements ICommandHandler<DeleteTransactionCommand, void> {
  constructor(private readonly service: TransactionService) {}

  async execute(cmd: DeleteTransactionCommand): Promise<void> {
    await this.service.delete(cmd.id, cmd.userId);
  }
}
