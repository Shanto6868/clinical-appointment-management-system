import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles/roles.guard';
import { Roles } from './common/decorators/roles.decorator';
import { UserRole } from './users/user.entity';

@Controller()
export class AppController {
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get('admin-only')
  adminOnly(@Req() req) {
    return {
      message: 'Welcome Admin',
      user: req.user,
    };
  }
}
