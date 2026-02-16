import { IsDateString, IsInt, IsOptional, Min } from 'class-validator';

export class CreateAppointmentDto {
  @IsInt()
  doctorId: number;

  @IsDateString()
  appointmentTime: string;

  @IsOptional()
  @IsInt()
  @Min(15)
  duration?: number; // duration in minutes
}
