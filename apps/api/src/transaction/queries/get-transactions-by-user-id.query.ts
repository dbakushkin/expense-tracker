export class GetTransactionsByUserIdQuery {
  constructor(
    public readonly userId: string,
    public readonly month?: number,
    public readonly year?: number,
  ) {}
}
