import {
  Controller,
  Post,
  Get,
  UseGuards,
  Req,
  Body,
  Param,
  Patch,
} from '@nestjs/common';

import { AppointmentsService } from './appointments.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UserRole } from 'src/users/user.entity';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Appointments')
@ApiBearerAuth()
@Controller('appointments')
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) { }

  // 🧍 Patient books appointment
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PATIENT)
  book(@Req() req, @Body() dto: CreateAppointmentDto) {
    return this.appointmentsService.book(req.user.userId, dto);
  }

  // 🩺 Doctor views appointments
  @Get('doctor')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.DOCTOR)
  getDoctorAppointments(@Req() req) {
    return this.appointmentsService.getDoctorAppointments(req.user.userId);
  }

  // 🧍 Patient views appointments
  @Get('patient')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PATIENT)
  getPatientAppointments(@Req() req) {
    return this.appointmentsService.getPatientAppointments(req.user.userId);
  }

  @Patch(':id/confirm')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.DOCTOR)
  confirm(@Param('id') id: number, @Req() req) {
    return this.appointmentsService.confirm(id, req.user.userId);
  }

  @Patch(':id/cancel')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PATIENT, UserRole.DOCTOR)
  cancel(@Param('id') id: number, @Req() req) {
    return this.appointmentsService.cancel(id, req.user.userId);
  }


}
