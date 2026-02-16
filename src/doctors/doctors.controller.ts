import {
  Controller,
  Post,
  Patch,
  Get,
  UseGuards,
  Req,
  Body,
  Param,
  Query,
} from '@nestjs/common';

import { DoctorsService } from './doctors.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

import { Roles } from 'src/common/decorators/roles.decorator';
import { UserRole } from 'src/users/user.entity';
import { CreateDoctorDto } from './dto/create-doctor.dto';
import { RolesGuard } from 'src/common/guards/roles/roles.guard';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Doctors')
@ApiBearerAuth()
@Controller('doctors')
export class DoctorsController {
  constructor(private readonly doctorsService: DoctorsService) { }

  // 🩺 Doctor creates profile
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.DOCTOR)
  createDoctor(@Req() req, @Body() dto: CreateDoctorDto) {
    return this.doctorsService.create(req.user.userId, dto);
  }

  // ✅ Admin approves doctor
  @Patch(':id/approve')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  approveDoctor(@Param('id') id: number) {
    return this.doctorsService.approve(Number(id));
  }

  // 👥 Patients see approved doctors


  @Get('approved')
  getApprovedDoctors(
    @Query('specialization') specialization?: string,
  ) {
    return this.doctorsService.listApproved(specialization);
  }



  // 🛠 Admin sees pending doctors
  @Get('pending')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  getPendingDoctors() {
    return this.doctorsService.listPending();
  }
}
