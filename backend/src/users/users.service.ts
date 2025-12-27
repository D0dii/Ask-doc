import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email } });
  }

  async create(userData: Partial<User>): Promise<User> {
    const user = this.usersRepository.create(userData);
    return this.usersRepository.save(user);
  }

  async upsertByEmail(userData: Partial<User>): Promise<User> {
    if (!userData.email) {
      throw new Error('Email is required to upsert a user');
    }

    const existing = await this.findByEmail(userData.email);

    if (existing) {
      const merged = this.usersRepository.merge(existing, userData);
      return this.usersRepository.save(merged);
    }

    return this.create(userData);
  }

  async findOne(id: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { id } });
  }
}
