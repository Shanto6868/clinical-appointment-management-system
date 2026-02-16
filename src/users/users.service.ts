import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';

@Injectable()
export class UsersService {
    create(arg0: { email: string; password: string; }) {
        throw new Error('Method not implemented.');
    }
    constructor(
        @InjectRepository(User)
        private userRepo: Repository<User>,
    ) { }

    async updateProfileImage(userId: number, filename: string) {
        const user = await this.userRepo.findOne({
            where: { id: userId },
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        user.profileImage = `uploads/${filename}`;

        await this.userRepo.save(user);

        return {
            message: 'Profile image updated',
            imageUrl: `http://localhost:3001/uploads/${filename}`,
            
        };
    }
}
