import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as nodemailer from 'nodemailer';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/user.entity';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
    private jwtService: JwtService,
  ) { }

  // 🔐 Generate 6 digit OTP
  private generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // 📧 Send Email
  private async sendEmail(email: string, subject: string, text: string) {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      to: email,
      subject,
      text,
    });
  }

  // 📝 REGISTER WITH OTP
  async register(dto: RegisterDto) {
    const existing = await this.userRepo.findOne({
      where: { email: dto.email },
    });

    if (existing) {
      throw new BadRequestException('Email already exists');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const otp = this.generateOtp();

    const user = this.userRepo.create({
      ...dto,
      password: hashedPassword,
      otp,
      otpExpiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 min
      isVerified: false,
    });

    await this.userRepo.save(user);

    await this.sendEmail(
      user.email,
      'Verify your email',
      `Your OTP is ${otp}`
    );

    return { message: 'Registered. Check email for OTP.' };
  }

  // ✅ VERIFY OTP
  async verifyOtp(email: string, otp: string) {
    const user = await this.userRepo.findOne({ where: { email } });

    if (!user || user.otp !== otp) {
      throw new BadRequestException('Invalid OTP');
    }

    if (!user.otpExpiresAt || new Date() > user.otpExpiresAt) {
      throw new BadRequestException('OTP expired');
    }

    user.isVerified = true;
    user.otp = null;
    user.otpExpiresAt = null;

    await this.userRepo.save(user);

    return { message: 'Email verified successfully' };
  }

  // 🔄 RESEND OTP
  async resendOtp(email: string) {
    const user = await this.userRepo.findOne({ where: { email } });

    if (!user) throw new BadRequestException('User not found');

    if (user.isVerified)
      throw new BadRequestException('User already verified');

    const otp = this.generateOtp();

    user.otp = otp;
    user.otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await this.userRepo.save(user);

    await this.sendEmail(email, 'Resend OTP', `Your new OTP is ${otp}`);

    return { message: 'OTP resent successfully' };
  }

  // 🔑 LOGIN
  async login(email: string, password: string) {
    const user = await this.userRepo.findOne({ where: { email } });
    if (!user) throw new UnauthorizedException('Invalid credentials');

    if (!user.isVerified)
      throw new UnauthorizedException('Email not verified');

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throw new UnauthorizedException('Invalid credentials');

    const payload = { sub: user.id, role: user.role };

    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  // 🔁 REQUEST PASSWORD RESET
  async requestPasswordReset(email: string) {
    const user = await this.userRepo.findOne({ where: { email } });

    if (!user) throw new BadRequestException('User not found');

    const otp = this.generateOtp();

    user.resetOtp = otp;
    user.resetOtpExpiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await this.userRepo.save(user);

    await this.sendEmail(
      email,
      'Password Reset OTP',
      `Your password reset OTP is ${otp}`
    );

    return { message: 'Password reset OTP sent' };
  }

  // 🔐 RESET PASSWORD
  async resetPassword(email: string, otp: string, newPassword: string) {
    const user = await this.userRepo.findOne({ where: { email } });

    if (!user || user.resetOtp !== otp)
      throw new BadRequestException('Invalid OTP');

    if (!user.resetOtpExpiresAt || new Date() > user.resetOtpExpiresAt)
      throw new BadRequestException('OTP expired');

    user.password = await bcrypt.hash(newPassword, 10);
    user.resetOtp = null;
    user.resetOtpExpiresAt = null;

    await this.userRepo.save(user);

    return { message: 'Password reset successful' };
  }
}
