import { Module } from '@nestjs/common';
import { DoctorsService } from './doctors.service';
import { DoctorsController } from './doctors.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Doctor } from './doctor.entity';
import { UsersModule } from '../users/users.module';
import { User } from '../users/user.entity';
import { NotificationsModule } from 'src/notifications/notifications.module';
import { CacheModule } from '@nestjs/cache-manager'; // ADD THIS IMPORT

@Module({
  imports: [
    TypeOrmModule.forFeature([Doctor, User]), 
    UsersModule, 
    NotificationsModule,
    CacheModule.register(), // ADD THIS LINE
  ],
  providers: [DoctorsService],
  controllers: [DoctorsController]
})
export class DoctorsModule { }