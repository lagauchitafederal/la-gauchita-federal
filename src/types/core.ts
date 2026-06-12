export type UserRole =
  | 'visitor'
  | 'subscriber'
  | 'cultural_collaborator'
  | 'validated_institution'
  | 'reviewer'
  | 'municipal_editor'
  | 'provincial_editor'
  | 'federal_editor'
  | 'general_admin'
  | 'super_admin';

export type MembershipLevel =
  | 'public'
  | 'free_subscriber'
  | 'friend'
  | 'cultural_collaborator'
  | 'history_patron';

export type EditorialStatus =
  | 'draft'
  | 'in_review'
  | 'observed'
  | 'approved'
  | 'scheduled'
  | 'published'
  | 'archived'
  | 'rejected';

export type GeoLevel =
  | 'country'
  | 'region'
  | 'province'
  | 'municipality'
  | 'locality';

export interface GeoLocation {
  id: string;
  name: string;
  level: GeoLevel;
  parentLocationId?: string;
  slug?: string;
  latitude?: number;
  longitude?: number;
}

export type ContentAccessLevel =
  | 'public'
  | 'registered'
  | 'members_only'
  | 'premium'
  | 'admin_only';

export interface ContentContextFilter {
  currentDate: Date;
  selectedLocation: GeoLocation | null;
  userRole: UserRole;
  membershipLevel: MembershipLevel;
}

export interface ContextualContent {
  id: string;
  title: string;
  slug: string;
  summary?: string;
  associatedDate?: Date;
  publishDate?: Date;
  editorialStatus: EditorialStatus;
  accessLevel: ContentAccessLevel;
  allowedRoles?: UserRole[];
  targetLocations?: GeoLocation[];
  tags?: string[];
}

export type InstitutionType =
  | 'municipality'
  | 'province'
  | 'library'
  | 'museum'
  | 'school'
  | 'cultural_center'
  | 'association'
  | 'media_partner'
  | 'researcher'
  | 'artist'
  | 'cultural_business'
  | 'other';

export type RecognitionScope =
  | 'local'
  | 'municipal'
  | 'provincial'
  | 'regional'
  | 'national'
  | 'international';