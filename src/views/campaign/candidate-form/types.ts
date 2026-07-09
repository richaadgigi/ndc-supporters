export interface KeyFact { fact: string; }
export interface EducationItem { institution: string; degree: string; year: string; }
export interface CareerItem { organization: string; role: string; start_year: string; end_year: string; }
export interface OfficeItem { office: string; year: string; }
export interface ManifestoItem { title: string; description: string; }

export interface CandidateFormData {
  name: string;
  gender: string;
  dob: string;
  state: string;
  lga: string;
  ward: string;
  constituency: string;
  slogan: string;
  bio: string;
  position_unique_id: string;
  member_role_unique_id: string;
  running_mate_unique_id: string;
  contact_office_address: string;
  contact_phone_number: string;
  contact_alt_phone_number: string;
  contact_email: string;
  social_media_facebook: string;
  social_media_twitter: string;
  social_media_instagram: string;
  social_media_youtube: string;
  social_media_linkedin: string;
  key_facts: KeyFact[];
  education: EducationItem[];
  career_history: CareerItem[];
  previous_public_offices: OfficeItem[];
  manifesto: ManifestoItem[];
}

export type Tab = 'basic' | 'location' | 'content';
export type ContentSection = 'key_facts' | 'education' | 'career_history' | 'previous_public_offices' | 'manifesto';

export const TABS: { key: Tab; label: string }[] = [
  { key: 'basic', label: 'Basic Info' },
  { key: 'location', label: 'Location & Contact' },
  { key: 'content', label: 'Profile Content' },
];

export const CONTENT_SECTIONS: { key: ContentSection; label: string }[] = [
  { key: 'key_facts', label: 'Key Facts' },
  { key: 'education', label: 'Education' },
  { key: 'career_history', label: 'Career History' },
  { key: 'previous_public_offices', label: 'Public Offices' },
  { key: 'manifesto', label: 'Manifesto' },
];
