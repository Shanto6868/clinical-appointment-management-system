import { Injectable, NotFoundException, BadRequestException, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Doctor } from './doctor.entity';
import { User } from '../users/user.entity';
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';

@Injectable()
export class DoctorsService {
  constructor(
    @InjectRepository(Doctor)
    private readonly doctorRepo: Repository<Doctor>,

    @Inject(CACHE_MANAGER)
    private cacheManager: Cache,


    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) { }

  // 1️⃣ Doctor creates their profile
  async create(userId: number, body: { specialization: string }) {
    // Check if user exists
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    // Check if doctor already exists
    const existing = await this.doctorRepo.findOne({ where: { user: { id: userId } } });
    if (existing) throw new BadRequestException('Doctor profile already exists');

    const doctor = this.doctorRepo.create({
      user,
      specialization: body.specialization,
      isApproved: false, // default pending approval
    });

    return this.doctorRepo.save(doctor);
  }

  // 2️⃣ Admin approves doctor
  async approve(doctorId: number) {
    const doctor = await this.doctorRepo.findOne({ where: { id: doctorId }, relations: ['user'] });
    if (!doctor) throw new NotFoundException('Doctor not found');

    doctor.isApproved = true;
    return this.doctorRepo.save(doctor);
  }

  // 3️⃣ List all approved doctors (for patients)
  async listApproved(specialization?: string) {
    const where: any = { isApproved: true };

    if (specialization) {
      where.specialization = specialization;
    }

    const doctors = await this.doctorRepo.find({ where });
    await this.cacheManager.set('approved_doctors', doctors, 60);
    return doctors;
  }




  // 4️⃣ Optional: List all pending doctors (for admin dashboard)
  async listPending() {
    return this.doctorRepo.find({
      where: { isApproved: false },
      relations: ['user'],
    });
  }
}
