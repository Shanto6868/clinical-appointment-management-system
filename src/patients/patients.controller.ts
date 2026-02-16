import {
  Controller,
  Post,
  UseGuards,
  Req,
  Body,
} from '@nestjs/common';

import { PatientsService } from './patients.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UserRole } from 'src/users/user.entity';
import { CreatePatientDto } from './dto/create-patient.dto';
import { RolesGuard } from 'src/common/guards/roles/roles.guard';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Patients')
@ApiBearerAuth()
@Controller('patients')
export class PatientsController {
  constructor(private readonly patientsService: PatientsService) { }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PATIENT)
  createPatient(@Req() req, @Body() dto: CreatePatientDto) {
    return this.patientsService.create(req.user.userId, dto);
  }
}
