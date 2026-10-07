import { Module } from '@nestjs/common';
import { DatabaseModule } from './common/database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { ProjectModule } from './modules/project/project.module';
import { InvitationModule } from './modules/invitation/invitation.module';
import { AuditLogModule } from './modules/audit/audit-log.module';
import { DocumentModule } from './modules/document/document.module';
import { NotificationModule } from './modules/notification/notification.module';
import { PlatformModule } from './modules/platform/platform.module';
import { PeopleModule } from './modules/people/people.module';
import { TrainingModule } from './modules/training/training.module';
import { CasesModule } from './modules/cases/cases.module';
import { IndicatorsModule } from './modules/indicators/indicators.module';

@Module({
  imports: [
    DatabaseModule,
    AuthModule,
    ProjectModule,
    InvitationModule,
    AuditLogModule,
    DocumentModule,
    NotificationModule,
    PlatformModule,
    PeopleModule,
    TrainingModule,
    CasesModule,
    IndicatorsModule,
  ],
})
export class AppModule {}
