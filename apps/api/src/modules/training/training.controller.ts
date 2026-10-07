import { Controller, Get, Post, Param, Body, UseGuards, Req, Inject } from '@nestjs/common';
import { TrainingService } from './training.service';
import { AuthGuard } from '../../common/guards/auth.guard';
import {
  CreateTrainingProgramSchema,
  AddCourseToProgramSchema,
  CreateCourseSchema,
  CreateTrainingSessionSchema,
  CreateOccurrenceSchema,
  EnrollParticipantSchema,
  RecordAttendanceSchema,
} from '@orgdashio/shared';

@Controller('api/v1/training')
@UseGuards(AuthGuard)
export class TrainingController {
  constructor(@Inject(TrainingService) private readonly trainingService: TrainingService) {}

  @Get('programs')
  async findAllTrainingPrograms(@Req() req: any) {
    return this.trainingService.findAllTrainingPrograms(req.tenantId);
  }

  @Post('programs')
  async createTrainingProgram(@Req() req: any, @Body() body: any) {
    const parsed = CreateTrainingProgramSchema.parse(body);
    return this.trainingService.createTrainingProgram(req.tenantId, parsed);
  }

  @Post('programs/:id/courses')
  async addCourseToProgram(
    @Req() req: any,
    @Param('id') programId: string,
    @Body() body: any
  ) {
    const parsed = AddCourseToProgramSchema.parse(body);
    return this.trainingService.addCourseToProgram(req.tenantId, programId, parsed.courseId);
  }

  @Post('programs/:id/courses/:courseId/remove')
  async removeCourseFromProgram(
    @Req() req: any,
    @Param('id') programId: string,
    @Param('courseId') courseId: string
  ) {
    return this.trainingService.removeCourseFromProgram(req.tenantId, programId, courseId);
  }

  @Post('courses')
  async createCourse(@Req() req: any, @Body() body: any) {
    const parsed = CreateCourseSchema.parse(body);
    return this.trainingService.createCourse(req.tenantId, parsed);
  }

  @Get('courses')
  async findAllCourses(@Req() req: any) {
    return this.trainingService.findAllCourses(req.tenantId);
  }

  @Post('sessions')
  async createSession(@Req() req: any, @Body() body: any) {
    const parsed = CreateTrainingSessionSchema.parse(body);
    return this.trainingService.createSession(req.tenantId, parsed);
  }

  @Get('sessions')
  async findAllSessions(@Req() req: any) {
    return this.trainingService.findAllSessions(req.tenantId);
  }

  @Get('sessions/:id')
  async findSessionOne(@Req() req: any, @Param('id') id: string) {
    return this.trainingService.findSessionOne(req.tenantId, id);
  }

  @Post('sessions/:id/occurrences')
  async addOccurrence(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    const parsed = CreateOccurrenceSchema.parse(body);
    return this.trainingService.addOccurrence(req.tenantId, id, parsed);
  }

  @Post('sessions/:id/enrollments')
  async enrollParticipant(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    const parsed = EnrollParticipantSchema.parse(body);
    return this.trainingService.enrollParticipant(req.tenantId, id, parsed);
  }

  @Post('attendances')
  async recordAttendance(@Req() req: any, @Body() body: any) {
    const parsed = RecordAttendanceSchema.parse(body);
    return this.trainingService.recordAttendance(req.tenantId, parsed);
  }

  @Post('enrollments/:id/issue-certificate')
  async issueCertificate(@Req() req: any, @Param('id') id: string) {
    return this.trainingService.issueCertificate(req.tenantId, id);
  }
}
