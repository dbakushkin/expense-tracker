export class GetCategoryByIdAndUserIdQuery {
  constructor(
    public readonly id: string,
    public readonly userId: string,
  ) {}
}
