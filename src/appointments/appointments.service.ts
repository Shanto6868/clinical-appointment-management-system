import {
    Injectable,
    BadRequestException,
    NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { Appointment, AppointmentStatus } from './appointment.entity';
import { Patient } from '../patients/patient.entity';
import { Doctor } from '../doctors/doctor.entity';
import { Availability } from '../availability/availability.entity';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { AuditService } from '../audit/audit.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationsGateway } from '../notifications/notifications.gateway';

@Injectable()
export class AppointmentsService {


    constructor(
        @InjectRepository(Appointment)
        private appointmentRepo: Repository<Appointment>,

        @InjectRepository(Patient)
        private patientRepo: Repository<Patient>,

        @InjectRepository(Doctor)
        private doctorRepo: Repository<Doctor>,

        @InjectRepository(Availability)
        private availabilityRepo: Repository<Availability>,

        private auditService: AuditService,
        private notificationsService: NotificationsService,
        private notificationsGateway: NotificationsGateway,
    ) { }

    async book(patientUserId: number, dto: CreateAppointmentDto) {
        const patient = await this.patientRepo.findOne({
            where: { user: { id: patientUserId } },
            relations: ['user'],
        });

        if (!patient) throw new NotFoundException('Patient profile not found');

        const doctor = await this.doctorRepo.findOne({
            where: { id: dto.doctorId, isApproved: true },
            relations: ['user'],
        });

        if (!doctor) throw new BadRequestException('Doctor not available');

        const startTime = new Date(dto.appointmentTime);
        const now = new Date();

        // 0. Date Validation
        if (startTime < new Date(now.getTime() + 30 * 60000)) {
            throw new BadRequestException('Appointments must be booked at least 30 minutes in advance');
        }

        const duration = dto.duration || 30; // Default 30 minutes
        const endTime = new Date(startTime.getTime() + duration * 60000);

        // 1. Availability Check
        // Find a slot that fully covers [startTime, endTime]
        const availableSlot = await this.availabilityRepo.findOne({
            where: {
                doctor: { id: doctor.id },
                startTime: LessThanOrEqual(startTime),
                endTime: MoreThanOrEqual(endTime),
            },
        });

        if (!availableSlot) {
            throw new BadRequestException(
                'Doctor is not available at this time',
            );
        }

        // 2. Conflict Check
        // Check if any existing appointment overlaps with the requested time
        const conflictingAppointment = await this.appointmentRepo
            .createQueryBuilder('appointment')
            .where('appointment.doctorId = :doctorId', { doctorId: doctor.id })
            .andWhere('appointment.status IN (:...statuses)', {
                statuses: [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED],
            })
            .andWhere(
                '(appointment.appointmentTime < :endTime AND appointment.endTime > :startTime)',
                { startTime, endTime },
            )
            .getOne();

        if (conflictingAppointment) {
            throw new BadRequestException('Time slot is already booked');
        }

        const appointment = this.appointmentRepo.create({
            patient,
            doctor,
            appointmentTime: startTime,
            endTime: endTime,
            status: AppointmentStatus.PENDING,
        });

        const savedAppointment = await this.appointmentRepo.save(appointment);

        // Notify Patient
        await this.notificationsService.sendEmail(
            patient.user.email,
            'Appointment Pending Approval',
            `Your appointment with Dr. ${doctor.user.name} is booked for ${startTime}. Status: PENDING.`,
        );

        // Notify Doctor
        // Notify Doctor (Real-time)
        this.notificationsGateway.sendToUser(
            doctor.user.id.toString(),
            'new_appointment',
            { appointmentId: savedAppointment.id, patientName: patient.user.name },
        );

        return savedAppointment;
    }

    async getDoctorAppointments(doctorUserId: number) {
        return this.appointmentRepo.find({
            where: { doctor: { user: { id: doctorUserId } } },
        });
    }

    async getPatientAppointments(patientUserId: number) {
        return this.appointmentRepo.find({
            where: { patient: { user: { id: patientUserId } } },
        });
    }

    async confirm(appointmentId: number, doctorUserId: number) {
        const appointment = await this.appointmentRepo.findOne({
            where: {
                id: appointmentId,
                doctor: { user: { id: doctorUserId } },
            },
            relations: ['doctor', 'doctor.user', 'patient', 'patient.user'],
        });

        if (!appointment) {
            throw new NotFoundException('Appointment not found');
        }

        appointment.status = AppointmentStatus.CONFIRMED;
        const savedAppointment = await this.appointmentRepo.save(appointment);

        await this.auditService.log(
            doctorUserId,
            'CONFIRMED_APPOINTMENT',
            'Appointment',
        );

        // Notify Patient
        // Notify Patient (Real-time)
        this.notificationsGateway.sendToUser(
            appointment.patient.user.id.toString(),
            'appointment_confirmed',
            { appointmentId: savedAppointment.id, doctorName: appointment.doctor.user.name },
        );

        return savedAppointment;
    }

    async cancel(appointmentId: number, userId: number) {
        const appointment = await this.appointmentRepo.findOne({
            where: [
                { id: appointmentId, patient: { user: { id: userId } } },
                { id: appointmentId, doctor: { user: { id: userId } } },
            ],
            relations: ['patient', 'patient.user', 'doctor', 'doctor.user'],
        });

        if (!appointment) {
            throw new NotFoundException('Appointment not found');
        }

        appointment.status = AppointmentStatus.CANCELLED;
        const savedAppt = await this.appointmentRepo.save(appointment);

        // Notify both parties
        const subject = 'Appointment Cancelled';
        const msg = `Appointment on ${appointment.appointmentTime} has been cancelled.`;

        await this.notificationsService.sendEmail(appointment.patient.user.email, subject, msg);
        await this.notificationsService.sendEmail(appointment.doctor.user.email, subject, msg);

        // Real-time notifications
        this.notificationsGateway.sendToUser(appointment.patient.user.id.toString(), 'appointment_cancelled', { id: appointmentId });
        this.notificationsGateway.sendToUser(appointment.doctor.user.id.toString(), 'appointment_cancelled', { id: appointmentId });

        return savedAppt;
    }
}
