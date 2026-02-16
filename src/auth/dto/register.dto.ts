import { IsEnum, IsNotEmpty, MinLength } from 'class-validator';
import { UserRole } from '../../users/user.entity';

export class RegisterDto {
    @IsNotEmpty()
    name:string;
    
    @IsNotEmpty()
    email:string;

    @IsNotEmpty()
    @MinLength(8)
    password: string;

    @IsEnum(UserRole)
    role:UserRole;
}