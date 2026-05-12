export class GetTransactionsByUserIdQuery {
  constructor(
    public readonly userId: string,
    public readonly page?: number,
    public readonly limit?: number,
    public readonly month?: number,
    public readonly year?: number,
  ) {}
}
