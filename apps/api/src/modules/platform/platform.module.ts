import { Module } from '@nestjs/common';
import { PlatformController } from './platform.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [PlatformController],
})
export class PlatformModule {}
