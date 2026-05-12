import type { UpdateTransactionRequest } from '@expence-tracker/shared-types';

export class UpdateTransactionCommand {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly data: UpdateTransactionRequest,
  ) {}
}
