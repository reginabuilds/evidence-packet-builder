import {
  VerificationStatus,
  TrustedContact,
} from './types';

export interface TransitionResult {
  status: VerificationStatus;
  protocolReason?: 'cannot_confirm' | 'timeout' | 'uncertain';
  error?: string;
}

export function validateVerificationInput(
  requesterLabel: string,
  trustedContactId: string
): { isValid: boolean; error?: string } {
  if (!requesterLabel || !requesterLabel.trim()) {
    return {
      isValid: false,
      error: 'Por favor indica quién solicita el dinero.',
    };
  }

  if (!trustedContactId || !trustedContactId.trim()) {
    return {
      isValid: false,
      error: 'Por favor selecciona un contacto de confianza independiente.',
    };
  }

  return { isValid: true };
}

export function checkRequesterIsSameAsVerifier(
  requesterLabel: string,
  contact: TrustedContact
): boolean {
  const normRequester = requesterLabel.toLowerCase().trim();
  const normContactName = contact.name.toLowerCase().trim();

  return (
    normRequester.includes(normContactName) ||
    normContactName.includes(normRequester)
  );
}

export function transitionSessionState(
  currentStatus: VerificationStatus,
  action: 'confirm' | 'cannot_confirm' | 'uncertain' | 'timeout'
): TransitionResult {
  if (
    currentStatus === 'protocol_only' ||
    currentStatus === 'not_verified'
  ) {
    if (action === 'confirm') {
      return {
        status: 'protocol_only',
        error:
          'Security boundary: Cannot modify a failed verification to verified.',
      };
    }
  }

  switch (action) {
    case 'confirm':
      return { status: 'verified' };

    case 'cannot_confirm':
      return {
        status: 'protocol_only',
        protocolReason: 'cannot_confirm',
      };

    case 'uncertain':
      return {
        status: 'protocol_only',
        protocolReason: 'uncertain',
      };

    case 'timeout':
    default:
      return {
        status: 'protocol_only',
        protocolReason: 'timeout',
      };
  }
}

export function authorizeSessionAccess(
  sessionUserId: string,
  requestUserId: string
): boolean {
  return sessionUserId === requestUserId;
}

export function authorizeContactAccess(
  contactUserId: string,
  requestUserId: string
): boolean {
  return contactUserId === requestUserId;
}
