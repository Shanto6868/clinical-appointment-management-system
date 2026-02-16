import { IsInt, IsString, Min } from 'class-validator';

export class CreatePatientDto {
  @IsInt()
  @Min(0)
  age: number;

  @IsString()
  gender: string;
}
