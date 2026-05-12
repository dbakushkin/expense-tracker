import { CreateTransactionHandler } from './create-transaction.handler';
import { UpdateTransactionHandler } from './update-transaction.handler';
import { DeleteTransactionHandler } from './delete-transaction.handler';

export const CommandHandlers = [CreateTransactionHandler, UpdateTransactionHandler, DeleteTransactionHandler];
