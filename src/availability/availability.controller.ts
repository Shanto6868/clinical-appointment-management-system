import { Body, Controller, Get, Param, Post, Req, UseGuards } from "@nestjs/common";
import { AvailabilityService } from "./availability.service";
import { JwtAuthGuard } from "src/auth/jwt-auth.guard";
import { RolesGuard } from "src/common/guards/roles/roles.guard";
import { Roles } from "src/common/decorators/roles.decorator";
import { UserRole } from "src/users/user.entity";
import { CreateAvailabilityDto } from "./create-availability.dto";

@Controller('availability')
export class AvailabilityController {
  constructor(private service: AvailabilityService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.DOCTOR)
  create(@Req() req, @Body() dto: CreateAvailabilityDto) {
    return this.service.create(req.user.userId, dto);
  }

  @Get(':doctorId')
  get(@Param('doctorId') doctorId: number) {
    return this.service.getDoctorAvailability(+doctorId);
  }
}
