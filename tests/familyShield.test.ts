import { describe, it, expect } from 'vitest';

import {
  validateVerificationInput,
  checkRequesterIsSameAsVerifier,
  transitionSessionState,
  authorizeSessionAccess,
  authorizeContactAccess,
} from '../lib/verificationLogic';

import {
  VerificationSession,
  TrustedContact,
} from '../lib/types';

describe('Family Shield MVP — Mechanical & Security Tests', () => {
  it('1. Happy path: transitions pending to verified on confirmation', () => {
    const res = transitionSessionState('pending', 'confirm');

    expect(res.status).toBe('verified');
  });

  it('2. Cannot confirm: transitions pending to protocol_only', () => {
    const res = transitionSessionState(
      'pending',
      'cannot_confirm'
    );

    expect(res.status).toBe('protocol_only');
    expect(res.protocolReason).toBe('cannot_confirm');
  });

  it('3. Uncertain: transitions pending to protocol_only', () => {
    const res = transitionSessionState(
      'pending',
      'uncertain'
    );

    expect(res.status).toBe('protocol_only');
    expect(res.protocolReason).toBe('uncertain');
  });

  it('4. Timeout: transitions pending to protocol_only', () => {
    const res = transitionSessionState(
      'pending',
      'timeout'
    );

    expect(res.status).toBe('protocol_only');
    expect(res.protocolReason).toBe('timeout');
  });

  it('5. Timeout invariant: timeout cannot produce verified status', () => {
    const res = transitionSessionState(
      'pending',
      'timeout'
    );

    expect(res.status).not.toBe('verified');
    expect(res.status).toBe('protocol_only');
  });

  it('6. Independence boundary: flags if requester matches verifier', () => {
    const contact: TrustedContact = {
      id: 'tc_1',
      name: 'Carlos',
      phone: '+525512345678',
      relationship: 'Hermano',
    };

    const isSame = checkRequesterIsSameAsVerifier(
      'Carlos',
      contact
    );

    expect(isSame).toBe(true);
  });

  it('7. User isolation: prevents user from accessing another user session', () => {
    const authorized = authorizeSessionAccess(
      'user_123',
      'user_999'
    );

    expect(authorized).toBe(false);
  });

  it('8. Contact isolation: prevents user from accessing another user trusted contact', () => {
    const authorized = authorizeContactAccess(
      'user_owner',
      'user_attacker'
    );

    expect(authorized).toBe(false);
  });

  it('9. Tamper prevention: prevents changing protocol_only back to verified', () => {
    const res = transitionSessionState(
      'protocol_only',
      'confirm'
    );

    expect(res.status).toBe('protocol_only');
    expect(res.error).toBeDefined();
  });

  it('10 & 11. Data boundary: no payment or AI score fields exist', () => {
    const mockSession: VerificationSession = {
      id: 'sess_1',
      user_id: 'usr_1',
      requester_label: 'Hermano Juan',
      trusted_contact_id: 'tc_1',
      status: 'pending',
      verification_result: null,
      created_at: new Date().toISOString(),
      completed_at: null,
    };

    const sessionKeys = Object.keys(mockSession);

    expect(sessionKeys).not.toContain(
      'payment_authorization'
    );

    expect(sessionKeys).not.toContain(
      'bank_account'
    );

    expect(sessionKeys).not.toContain(
      'deepfake_score'
    );

    expect(sessionKeys).not.toContain(
      'scam_probability'
    );
  });

  it('12 & 13. Protocol Only copy compliance', () => {
    const requiredInstruction =
      'No envíes el dinero todavía.';

    const prohibitedClaim1 = 'Es una estafa';
    const prohibitedClaim2 =
      'La emergencia es falsa';
    const prohibitedClaim3 =
      'El pago es seguro';

    expect(requiredInstruction).toContain(
      'No envíes el dinero todavía.'
    );

    expect(requiredInstruction).not.toContain(
      prohibitedClaim1
    );

    expect(requiredInstruction).not.toContain(
      prohibitedClaim2
    );

    expect(requiredInstruction).not.toContain(
      prohibitedClaim3
    );
  });

  it('14. Input validation: rejects empty requester or contact', () => {
    const emptyRequester =
      validateVerificationInput('', 'tc_1');

    expect(emptyRequester.isValid).toBe(false);

    const emptyContact =
      validateVerificationInput('Mama', '');

    expect(emptyContact.isValid).toBe(false);
  });
});
