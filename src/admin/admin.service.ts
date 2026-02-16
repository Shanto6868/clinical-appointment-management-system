import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Appointment } from '../appointments/appointment.entity';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(Appointment)
    private appointmentRepo: Repository<Appointment>,
  ) {}

  async appointmentsPerDay() {
    return this.appointmentRepo.query(`
      SELECT DATE("createdAt") as date,
             COUNT(*) as count
      FROM appointment
      GROUP BY DATE("createdAt")
      ORDER BY date ASC
    `);
  }

  async statusCount() {
    return this.appointmentRepo.query(`
      SELECT status, COUNT(*) as count
      FROM appointment
      GROUP BY status
    `);
  }
  
}
