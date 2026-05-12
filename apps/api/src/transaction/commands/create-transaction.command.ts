import type { CreateTransactionRequest } from '@expence-tracker/shared-types';

export class CreateTransactionCommand {
  constructor(
    public readonly userId: string,
    public readonly data: CreateTransactionRequest,
  ) {}
}
