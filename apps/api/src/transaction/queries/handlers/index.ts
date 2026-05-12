import { GetTransactionsByUserIdHandler } from './get-transactions-by-user-id.handler';
import { GetTransactionByIdAndUserIdHandler } from './get-transaction-by-id-and-user-id.handler';

export const QueryHandlers = [GetTransactionsByUserIdHandler, GetTransactionByIdAndUserIdHandler];
