import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Repository,
  LessThan,
  MoreThan,
} from 'typeorm';
import { Availability } from './availability.entity';
import { Doctor } from '../doctors/doctor.entity';
import { CreateAvailabilityDto } from './create-availability.dto';

@Injectable()
export class AvailabilityService {
  constructor(
    @InjectRepository(Availability)
    private readonly availabilityRepo: Repository<Availability>,

    @InjectRepository(Doctor)
    private readonly doctorRepo: Repository<Doctor>,
  ) {}

  // 🩺 Doctor creates availability slot
  async create(doctorUserId: number, dto: CreateAvailabilityDto) {
    const start = new Date(dto.startTime);
    const end = new Date(dto.endTime);

    if (start >= end) {
      throw new BadRequestException(
        'End time must be after start time',
      );
    }

    const doctor = await this.doctorRepo.findOne({
      where: {
        user: { id: doctorUserId },
        isApproved: true,
      },
    });

    if (!doctor) {
      throw new BadRequestException(
        'Doctor not found or not approved',
      );
    }

    // 🔥 Prevent overlapping availability
    const overlapping = await this.availabilityRepo.findOne({
      where: {
        doctor: { id: doctor.id },
        startTime: LessThan(end),
        endTime: MoreThan(start),
      },
    });

    if (overlapping) {
      throw new BadRequestException(
        'Availability overlaps with existing slot',
      );
    }

    const slot = this.availabilityRepo.create({
      doctor,
      startTime: start,
      endTime: end,
    });

    return this.availabilityRepo.save(slot);
  }

  // 📅 Get availability for specific doctor (public)
  async getDoctorAvailability(doctorId: number) {
    const doctor = await this.doctorRepo.findOne({
      where: { id: doctorId },
    });

    if (!doctor) {
      throw new NotFoundException('Doctor not found');
    }

    return this.availabilityRepo.find({
      where: { doctor: { id: doctorId } },
      order: { startTime: 'ASC' },
    });
  }

  // 🗑 Doctor deletes availability slot
  async remove(slotId: number, doctorUserId: number) {
    const slot = await this.availabilityRepo.findOne({
      where: {
        id: slotId,
        doctor: { user: { id: doctorUserId } },
      },
    });

    if (!slot) {
      throw new NotFoundException(
        'Availability slot not found',
      );
    }

    await this.availabilityRepo.remove(slot);

    return { message: 'Availability removed successfully' };
  }
}
