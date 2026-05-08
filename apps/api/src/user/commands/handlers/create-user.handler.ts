import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { User } from '@prisma/client';
import { CreateUserCommand } from '../create-user.command';
import { UserService } from '../../user.service';
import { EmailAlreadyExistsException } from '../../exceptions/email-already-exists.exception';

@CommandHandler(CreateUserCommand)
export class CreateUserHandler implements ICommandHandler<CreateUserCommand, User> {
  constructor(private readonly userService: UserService) {}

  async execute(command: CreateUserCommand): Promise<User> {
    const existing = await this.userService.findByEmail(command.email);
    if (existing) {
      throw new EmailAlreadyExistsException();
    }
    return this.userService.create({
      email: command.email,
      name: command.name,
      passwordHash: command.passwordHash,
    });
  }
}
