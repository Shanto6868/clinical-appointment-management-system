import { Controller, Get, UseGuards } from "@nestjs/common";
import { Appointment } from "src/appointments/appointment.entity";
import { JwtAuthGuard } from "src/auth/jwt-auth.guard";
import { Roles } from "src/common/decorators/roles.decorator";
import { RolesGuard } from "src/common/guards/roles/roles.guard";
import { User, UserRole } from "src/users/user.entity";
import { Repository } from "typeorm";
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Admin')
@ApiBearerAuth()
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminController {
  adminService: any;
  constructor(
    private userRepo: Repository<User>,
    private appointmentRepo: Repository<Appointment>,
  ) { }

  @Get('stats')
  async stats() {
    const users = await this.userRepo.count();
    const appointments = await this.appointmentRepo.count();

    return {
      totalUsers: users,
      totalAppointments: appointments,
    };
  }

  @Get('appointments')
  getAllAppointments() {
    return this.appointmentRepo.find();
  }

  @Get('analytics/appointments-per-day')
  async appointmentsPerDay() {
    return this.adminService.appointmentsPerDay();
  }

  @Get('analytics/status-count')
  async statusCount() {
    return this.adminService.statusCount();
  }



}
