export type VerificationStatus =
  | 'pending'
  | 'verified'
  | 'not_verified'
  | 'protocol_only';

export interface TrustedContact {
  id: string;
  name: string;
  phone: string;
  relationship: string;
}

export interface VerificationSession {
  id: string;
  user_id: string;
  requester_label: string;
  trusted_contact_id: string;
  status: VerificationStatus;
  verification_result: string | null;
  created_at: string;
  completed_at: string | null;
}

export const INITIAL_TRUSTED_CONTACTS: TrustedContact[] = [
  {
    id: 'tc_1',
    name: 'Mamá (Teléfono casa / Fijo)',
    phone: '+52 55 1234 5678',
    relationship: 'Madre',
  },
  {
    id: 'tc_2',
    name: 'Carlos (Hermano - Canal Directo)',
    phone: '+52 55 9876 5432',
    relationship: 'Hermano',
  },
];
