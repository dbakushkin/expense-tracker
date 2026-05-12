export class GetTransactionByIdAndUserIdQuery {
  constructor(
    public readonly id: string,
    public readonly userId: string,
  ) {}
}
