import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards, Req, Inject } from '@nestjs/common';
import { PeopleService } from './people.service';
import { AuthGuard } from '../../common/guards/auth.guard';
import {
  CreatePersonSchema,
  CreateStaffSchema,
  UpdateStaffSchema,
  RecordConsentSchema,
  AddServiceDeliverySchema,
} from '@orgdashio/shared';

@Controller('api/v1/people')
@UseGuards(AuthGuard)
export class PeopleController {
  constructor(@Inject(PeopleService) private readonly peopleService: PeopleService) {}

  @Get('departments')
  async findAllDepartments(@Req() req: any) {
    return this.peopleService.findAllDepartments(req.tenantId);
  }

  @Post('departments')
  async createDepartment(@Req() req: any, @Body() body: any) {
    return this.peopleService.createDepartment(req.tenantId, body.name, body.code, body.parentId);
  }

  @Patch('departments/:id')
  async updateDepartment(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    return this.peopleService.updateDepartment(req.tenantId, id, {
      name: body.name,
      code: body.code,
      parentId: body.parentId,
    });
  }

  @Delete('departments/:id')
  async deleteDepartment(@Req() req: any, @Param('id') id: string) {
    return this.peopleService.deleteDepartment(req.tenantId, id);
  }

  @Post('staff')
  async createStaff(@Req() req: any, @Body() body: any) {
    const parsed = CreateStaffSchema.parse(body);
    return this.peopleService.createStaff(req.tenantId, parsed, req.user?.id);
  }

  @Patch('staff/:id')
  async updateStaff(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    const parsed = UpdateStaffSchema.parse(body);
    return this.peopleService.updateStaff(req.tenantId, id, parsed);
  }

  @Delete('staff/:id')
  async deleteStaff(@Req() req: any, @Param('id') id: string) {
    return this.peopleService.deleteStaff(req.tenantId, id);
  }

  @Get()
  async findAll(@Req() req: any) {
    return this.peopleService.findAll(req.tenantId);
  }

  @Get(':id')
  async findOne(@Req() req: any, @Param('id') id: string) {
    return this.peopleService.findOne(req.tenantId, id);
  }

  @Post()
  async createPerson(@Req() req: any, @Body() body: any) {
    const parsed = CreatePersonSchema.parse(body);
    return this.peopleService.createPerson(req.tenantId, parsed);
  }

  @Post(':id/consents')
  async recordConsent(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    const parsed = RecordConsentSchema.parse(body);
    return this.peopleService.recordConsent(req.tenantId, id, parsed);
  }

  @Post(':id/service-deliveries')
  async addServiceDelivery(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    const parsed = AddServiceDeliverySchema.parse(body);
    return this.peopleService.addServiceDelivery(req.tenantId, id, req.user.id, parsed);
  }
}
