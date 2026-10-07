import { describe, it, expect } from 'vitest';
import { RegisterTenantSchema, UpdateTenantSchema, UpdateUserProfileSchema } from './auth.schema';

describe('Auth & Settings Schemas', () => {
  it('should validate valid tenant update payload', () => {
    const input = {
      name: 'Centre Communautaire Espoir',
      acronym: 'CCE',
      orgType: 'OBNL / NPO (Organisme à but non lucratif)',
      neqNumber: '1172839405',
      address: '123, rue Saint-Denis, Montréal, QC',
      phone: '514-555-0100',
      email: 'contact@espoir.org',
      privacyOfficerName: 'Julie Tremblay',
      privacyOfficerEmail: 'rprp@espoir.org',
      dataRetentionMonths: 60,
    };

    const parsed = UpdateTenantSchema.parse(input);
    expect(parsed.name).toBe('Centre Communautaire Espoir');
    expect(parsed.acronym).toBe('CCE');
    expect(parsed.dataRetentionMonths).toBe(60);
  });

  it('should validate valid user profile payload', () => {
    const input = {
      firstName: 'Jean',
      lastName: 'Dupont',
      phone: '514-555-0199',
      jobTitle: 'Coordonnateur des bénévoles',
      locale: 'fr-CA' as const,
    };

    const parsed = UpdateUserProfileSchema.parse(input);
    expect(parsed.firstName).toBe('Jean');
    expect(parsed.jobTitle).toBe('Coordonnateur des bénévoles');
  });
});
