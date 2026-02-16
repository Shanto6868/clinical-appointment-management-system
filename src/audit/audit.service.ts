import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { AuditLog } from "./audit-log.entity";
import { Repository } from "typeorm";

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private repo: Repository<AuditLog>,
  ) {}

  async log(userId: number, action: string, entity: string) {
    const record = this.repo.create({ userId, action, entity });
    await this.repo.save(record);
  }
}
