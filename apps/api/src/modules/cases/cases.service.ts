import { Injectable, Inject, NotFoundException, ForbiddenException } from '@nestjs/common';
import { DRIZZLE_DB } from '../../common/database/database.module';
import {
  DbClient,
  withTenantContext,
  caseFile,
  caseAssignment,
  caseNote,
  breakGlassLog,
  CreateCaseInput,
  CreateCaseNoteInput,
  BreakGlassInput,
} from '@orgdashio/shared';
import { eq, and } from 'drizzle-orm';
import { canUserAccessCase, isNoteEditable } from './cases.utils';

@Injectable()
export class CasesService {
  constructor(@Inject(DRIZZLE_DB) private readonly db: DbClient) {}

  async createCase(tenantId: string, primaryWorkerUserId: string, input: CreateCaseInput) {
    return withTenantContext(this.db, tenantId, async (tx) => {
      const caseNumber = `CAS-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

      const [newCase] = await tx
        .insert(caseFile)
        .values({
          tenantId,
          partyId: input.partyId,
          caseNumber,
          title: input.title,
          confidentialityLevel: input.confidentialityLevel || 'restricted',
          primaryWorkerUserId,
          status: 'open',
        })
        .returning();

      // Assign primary worker
      await tx.insert(caseAssignment).values({
        tenantId,
        caseFileId: newCase.id,
        userId: primaryWorkerUserId,
        role: 'primary_worker',
      });

      return newCase;
    });
  }

  async findAllCases(tenantId: string, userId: string) {
    return withTenantContext(this.db, tenantId, async (tx) => {
      const cases = await tx.select().from(caseFile);
      const assignments = await tx.select().from(caseAssignment);
      const breakGlasses = await tx
        .select()
        .from(breakGlassLog)
        .where(eq(breakGlassLog.userId, userId));

      const activeBreakGlassCaseIds = new Set(breakGlasses.map((b: any) => b.caseFileId));

      return cases.filter((c: any) => {
        const assignedUserIds = assignments
          .filter((a: any) => a.caseFileId === c.id)
          .map((a: any) => a.userId);

        return canUserAccessCase({
          confidentialityLevel: c.confidentialityLevel,
          primaryWorkerUserId: c.primaryWorkerUserId,
          assignedUserIds,
          userId,
          hasActiveBreakGlass: activeBreakGlassCaseIds.has(c.id),
        });
      });
    });
  }

  async findOneCase(tenantId: string, userId: string, caseId: string) {
    return withTenantContext(this.db, tenantId, async (tx) => {
      const [c] = await tx.select().from(caseFile).where(eq(caseFile.id, caseId));
      if (!c) throw new NotFoundException('Dossier introuvable');

      const assignments = await tx
        .select()
        .from(caseAssignment)
        .where(eq(caseAssignment.caseFileId, caseId));

      const assignedUserIds = assignments.map((a: any) => a.userId);

      const breakGlasses = await tx
        .select()
        .from(breakGlassLog)
        .where(and(eq(breakGlassLog.caseFileId, caseId), eq(breakGlassLog.userId, userId)));

      const hasActiveBreakGlass = breakGlasses.length > 0;

      const hasAccess = canUserAccessCase({
        confidentialityLevel: c.confidentialityLevel,
        primaryWorkerUserId: c.primaryWorkerUserId,
        assignedUserIds,
        userId,
        hasActiveBreakGlass,
      });

      if (!hasAccess) {
        throw new ForbiddenException({
          message: 'Accès restreint au dossier confidentiel',
          requiresBreakGlass: true,
        });
      }

      const notes = await tx
        .select()
        .from(caseNote)
        .where(eq(caseNote.caseFileId, caseId));

      const formattedNotes = notes.map((n: any) => ({
        ...n,
        isEditable: isNoteEditable(new Date(n.createdAt)),
      }));

      return {
        caseFile: c,
        assignments,
        notes: formattedNotes,
        breakGlassLogs: hasActiveBreakGlass ? breakGlasses : [],
      };
    });
  }

  async addNote(tenantId: string, authorUserId: string, caseId: string, input: CreateCaseNoteInput) {
    return withTenantContext(this.db, tenantId, async (tx) => {
      const [c] = await tx.select().from(caseFile).where(eq(caseFile.id, caseId));
      if (!c) throw new NotFoundException('Dossier introuvable');

      if (input.parentNoteId) {
        const [parent] = await tx.select().from(caseNote).where(eq(caseNote.id, input.parentNoteId));
        if (!parent) throw new NotFoundException('Note parente introuvable');
      }

      const [newNote] = await tx
        .insert(caseNote)
        .values({
          tenantId,
          caseFileId: caseId,
          authorUserId,
          noteType: input.noteType,
          content: input.content,
          parentNoteId: input.parentNoteId,
        })
        .returning();

      return newNote;
    });
  }

  async breakGlass(tenantId: string, userId: string, caseId: string, input: BreakGlassInput) {
    return withTenantContext(this.db, tenantId, async (tx) => {
      const [c] = await tx.select().from(caseFile).where(eq(caseFile.id, caseId));
      if (!c) throw new NotFoundException('Dossier introuvable');

      const [log] = await tx
        .insert(breakGlassLog)
        .values({
          tenantId,
          caseFileId: caseId,
          userId,
          reason: input.reason,
        })
        .returning();

      return {
        success: true,
        message: 'Accès exceptionnel accordé. L’événement a été consigné au journal d’audit.',
        log,
      };
    });
  }
}
