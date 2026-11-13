export interface RawBeneficiaryDelivery {
  id?: string;
  partyId?: string;
  partyKind?: string | null;
  genderCode?: string | null;
  birthDate?: string | Date | null;
  customFields?: Record<string, any> | null;
  firstName?: string | null;
  lastName?: string | null;
  serviceType?: string | null;
  deliveredAt?: string | Date | null;
  notes?: string | null;
  [key: string]: any;
}

export interface BeneficiaryDemographics {
  totalPersons: number;
  totalEntities: number;

  // Typology of entities
  individualsCount: number;
  householdsCount: number;
  communitiesCount: number;
  organizationsCount: number;

  // Detailed Gender Disaggregation
  women: number; // Adult women (>= 18 or specified)
  girls: number; // Minor girls (< 18)
  men: number; // Adult men (>= 18 or specified)
  boys: number; // Minor boys (< 18)
  otherGender: number; // Other or unspecified persons

  // Consolidated Gender (for summary metrics & progress bars)
  totalFemales: number; // women + girls
  totalMales: number; // men + boys
  femalePct: number;
  malePct: number;
  otherPct: number;

  // Age Groups & Generations
  children: number; // Minors (< 18 ans: boys + girls + childCount)
  youth: number; // Youth (< 25 ans)
  adults: number; // Adults (25 - 60 ans)
  seniors: number; // Seniors (> 60 ans)

  // Entities with incomplete breakdown
  unspecifiedCount: number;
}

/**
 * Calculates human person-level demographics from project service deliveries or beneficiary profiles.
 * Seamlessly rolls up individuals, households, and communities based on custom fields and profiles.
 */
export function calculateBeneficiaryDemographics(
  deliveries: RawBeneficiaryDelivery[] = [],
  currentYear = new Date().getFullYear()
): BeneficiaryDemographics {
  // Deduplicate by partyId
  const uniqueMap = new Map<string, RawBeneficiaryDelivery>();
  let syntheticIndex = 0;

  for (const d of deliveries) {
    const key = d.partyId || `delivery_${syntheticIndex++}`;
    if (!uniqueMap.has(key)) {
      uniqueMap.set(key, d);
    }
  }

  const uniqueBeneficiaries = Array.from(uniqueMap.values());

  let totalPersons = 0;
  let individualsCount = 0;
  let householdsCount = 0;
  let communitiesCount = 0;
  let organizationsCount = 0;

  let women = 0;
  let girls = 0;
  let men = 0;
  let boys = 0;
  let otherGender = 0;

  let children = 0;
  let youth = 0;
  let adults = 0;
  let seniors = 0;
  let unspecifiedCount = 0;

  for (const b of uniqueBeneficiaries) {
    const custom = (b.customFields as Record<string, any>) || {};
    const bType =
      custom.beneficiaryType ||
      (b.partyKind === 'organization' ? 'community' : 'individual');

    if (bType === 'individual') {
      individualsCount++;
      totalPersons += 1;

      const g = (b.genderCode || custom.gender || '').toLowerCase().trim();
      const isFemale = g === 'f' || g === 'female' || g === 'femme' || g === 'fille';
      const isMale = g === 'm' || g === 'male' || g === 'homme' || g === 'garcon' || g === 'garçon';

      let age: number | null = null;
      if (b.birthDate) {
        const birthDate = new Date(b.birthDate);
        if (!isNaN(birthDate.getTime())) {
          age = currentYear - birthDate.getFullYear();
        }
      }

      if (age !== null) {
        if (age < 18) {
          children++;
          youth++;
          if (isFemale) girls++;
          else if (isMale) boys++;
          else otherGender++;
        } else if (age < 25) {
          youth++;
          if (isFemale) women++;
          else if (isMale) men++;
          else otherGender++;
        } else if (age <= 60) {
          adults++;
          if (isFemale) women++;
          else if (isMale) men++;
          else otherGender++;
        } else {
          seniors++;
          if (isFemale) women++;
          else if (isMale) men++;
          else otherGender++;
        }
      } else {
        // No explicit birthDate: determine adult or minor from gender tag
        if (isFemale) {
          if (g === 'fille') {
            girls++;
            children++;
            youth++;
          } else {
            women++;
            adults++;
          }
        } else if (isMale) {
          if (g === 'garcon' || g === 'garçon') {
            boys++;
            children++;
            youth++;
          } else {
            men++;
            adults++;
          }
        } else {
          otherGender++;
          adults++;
          unspecifiedCount++;
        }
      }
    } else {
      // Collective entity: Household, Community, Organization, Institution
      if (bType === 'household') {
        householdsCount++;
      } else if (bType === 'community') {
        communitiesCount++;
      } else {
        organizationsCount++;
      }

      const mMen = Number(custom.menCount) || 0;
      const mWomen = Number(custom.womenCount) || 0;
      const mOther = Number(custom.otherCount) || 0;
      const mBoys = Number(custom.boysCount) || 0;
      const mGirls = Number(custom.girlsCount) || 0;
      const mOtherKids = Number(custom.otherChildrenCount) || 0;
      const explicitKids = Number(custom.childCount) || 0;
      const explicitMembers = Number(custom.memberCount) || 0;

      const subKids = mBoys + mGirls + mOtherKids;
      const entityKids = Math.max(subKids, explicitKids);
      const subAdults = mMen + mWomen + mOther;
      const sumKnown = subKids + subAdults;

      let entityTotalPersons = 0;
      let entityUnspecified = 0;

      if (sumKnown > 0) {
        if (explicitMembers > sumKnown) {
          entityTotalPersons = explicitMembers;
          entityUnspecified = explicitMembers - sumKnown;
        } else {
          entityTotalPersons = sumKnown;
        }
      } else if (explicitMembers > 0) {
        entityTotalPersons = explicitMembers;
        entityUnspecified = explicitMembers;
      } else if (explicitKids > 0) {
        entityTotalPersons = explicitKids;
      } else {
        // Fallback default if entity was created with 0 values
        entityTotalPersons = 1;
        entityUnspecified = 1;
      }

      totalPersons += entityTotalPersons;
      women += mWomen;
      girls += mGirls;
      men += mMen;
      boys += mBoys;
      otherGender += (mOther + mOtherKids + entityUnspecified);
      if (entityUnspecified > 0) unspecifiedCount += entityUnspecified;

      children += entityKids;
      youth += entityKids; // All children are < 25
      adults += Math.max(0, entityTotalPersons - entityKids);
    }
  }

  const totalFemales = women + girls;
  const totalMales = men + boys;
  const femalePct = totalPersons > 0 ? Math.round((totalFemales / totalPersons) * 100) : 0;
  const malePct = totalPersons > 0 ? Math.round((totalMales / totalPersons) * 100) : 0;
  const otherPct = totalPersons > 0 ? Math.max(0, 100 - femalePct - malePct) : 0;

  return {
    totalPersons,
    totalEntities: uniqueBeneficiaries.length,
    individualsCount,
    householdsCount,
    communitiesCount,
    organizationsCount,
    women,
    girls,
    men,
    boys,
    otherGender,
    totalFemales,
    totalMales,
    femalePct,
    malePct,
    otherPct,
    children,
    youth,
    adults,
    seniors,
    unspecifiedCount,
  };
}
