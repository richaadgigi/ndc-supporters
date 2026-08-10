export interface SupportGroupFormData {
  firstname: string;
  middlename: string;
  lastname: string;
  email: string;
  phone_number: string;
  gender: string;
  date_of_birth: string;
  country: string;
  password: string;
  confirmPassword: string;
  support_group_type_unique_id: string;
  name: string;
  scope_option: string;
  zone: string;
  state: string;
  lga: string;
  ward: string;
  constituency: string;
  contact_name: string;
  contact_office_address: string;
  contact_phone_number: string;
  contact_alt_phone_number: string;
  contact_email: string;
  account_bank: string;
  account_name: string;
  account_number: string;
  account_other: string;
}

export type Tab = 'leader' | 'basic' | 'location' | 'account';

export const TABS: { key: Tab; label: string }[] = [
  { key: 'leader', label: 'Group Leader' },
  { key: 'basic', label: 'Basic Info' },
  { key: 'location', label: 'Location & Contact' },
  { key: 'account', label: 'Account Details' },
];
