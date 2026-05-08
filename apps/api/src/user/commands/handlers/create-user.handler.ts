import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CreateUserCommand } from '../create-user.command';
import { UserService } from '../../user.service';
import { UserMapper } from '../../user.mapper';
import { EmailAlreadyExistsException } from '../../exceptions/email-already-exists.exception';
import { UserPublic } from '@expence-tracker/shared-types';

@CommandHandler(CreateUserCommand)
export class CreateUserHandler implements ICommandHandler<CreateUserCommand, UserPublic> {
  constructor(private readonly userService: UserService) {}

  async execute(command: CreateUserCommand): Promise<UserPublic> {
    const existing = await this.userService.findByEmail(command.email);
    if (existing) {
      throw new EmailAlreadyExistsException();
    }
    const user = await this.userService.create({
      email: command.email,
      name: command.name,
      passwordHash: command.passwordHash,
    });
    return UserMapper.toPublic(user);
  }
}
