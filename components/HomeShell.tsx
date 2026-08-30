'use client';

import React, { useState } from 'react';
import NewVerificationForm from '@/components/NewVerificationForm';
import VerificationProgress from '@/components/VerificationProgress';
import VerifiedResult from '@/components/VerifiedResult';
import ProtocolOnlyView from '@/components/ProtocolOnlyView';
import { INITIAL_TRUSTED_CONTACTS } from '@/lib/types';

export default function HomeShell() {
  const [view, setView] = useState<
    'home' | 'new_verification' | 'in_progress' | 'verified' | 'protocol_only'
  >('home');

  const [session, setSession] = useState<{
    requester: string;
    contactId: string;
    contactName: string;
    status: 'pending' | 'verified' | 'protocol_only';
    protocolReason?: 'cannot_confirm' | 'timeout' | 'uncertain';
  } | null>(null);

  const handleStartVerification = () => {
    setView('new_verification');
  };

  const handleCreateSession = (
    requesterLabel: string,
    trustedContactId: string
  ) => {
    const contact = INITIAL_TRUSTED_CONTACTS.find(
      (c) => c.id === trustedContactId
    );

    setSession({
      requester: requesterLabel,
      contactId: trustedContactId,
      contactName: contact ? contact.name : 'Contacto de confianza',
      status: 'pending',
    });

    setView('in_progress');
  };

  const handleSetVerified = () => {
    if (session?.status === 'protocol_only') return;

    setSession((prev) =>
      prev ? { ...prev, status: 'verified' } : null
    );

    setView('verified');
  };

  const handleSetProtocolOnly = (
    reason: 'cannot_confirm' | 'timeout' | 'uncertain'
  ) => {
    setSession((prev) =>
      prev
        ? {
            ...prev,
            status: 'protocol_only',
            protocolReason: reason,
          }
        : null
    );

    setView('protocol_only');
  };

  const handleReset = () => {
    setSession(null);
    setView('home');
  };

  return (
    <main className="min-h-[calc(100vh-65px)] bg-slate-50 flex flex-col items-center p-4 sm:p-6">
      {view === 'home' && (
        <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mt-2 sm:mt-6">
          <div className="bg-blue-900 text-white p-6">
            <h1 className="text-2xl font-bold mb-2">
              Pausa antes de pagar.
            </h1>

            <p className="text-blue-100 text-sm leading-relaxed">
              Verifica por un canal independiente cuando recibas una solicitud
              urgente de dinero de un familiar.
            </p>
          </div>

          <div className="p-6 space-y-4">
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                1
              </div>

              <p className="text-sm text-slate-700">
                <strong className="font-semibold text-slate-900">
                  Haz una pausa:
                </strong>{' '}
                Tómate un momento antes de realizar cualquier transferencia.
              </p>
            </div>

            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                2
              </div>

              <p className="text-sm text-slate-700">
                <strong className="font-semibold text-slate-900">
                  Verifica independientemente:
                </strong>{' '}
                Un contacto de confianza previamente guardado confirmará la
                situación.
              </p>
            </div>

            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                3
              </div>

              <p className="text-sm text-slate-700">
                <strong className="font-semibold text-slate-900">
                  Conserva el control:
                </strong>{' '}
                Mantén siempre el control de tu dinero y toma la decisión
                final.
              </p>
            </div>

            <div className="pt-4">
              <button
                onClick={handleStartVerification}
                className="w-full py-3.5 px-4 bg-blue-700 hover:bg-blue-800 text-white font-medium rounded-xl shadow border border-blue-800 transition text-center text-sm"
              >
                Nueva verificación
              </button>
            </div>
          </div>

          <div className="bg-slate-50 p-4 border-t border-slate-200 text-center">
            <p className="text-xs text-slate-500">
              Family Shield no evalúa la veracidad de emergencias ni procesa
              pagos.
            </p>
          </div>
        </div>
      )}

      {view === 'new_verification' && (
        <NewVerificationForm
          onCancel={handleReset}
          onSubmitSession={handleCreateSession}
        />
      )}

      {view === 'in_progress' && session && (
        <VerificationProgress
          requesterLabel={session.requester}
          contactName={session.contactName}
          onConfirm={handleSetVerified}
          onCannotConfirm={() =>
            handleSetProtocolOnly('cannot_confirm')
          }
          onUncertain={() =>
            handleSetProtocolOnly('uncertain')
          }
          onTimeout={() =>
            handleSetProtocolOnly('timeout')
          }
        />
      )}

      {view === 'verified' && session && (
        <VerifiedResult
          requesterLabel={session.requester}
          contactName={session.contactName}
          onReset={handleReset}
        />
      )}

      {view === 'protocol_only' && session && (
        <ProtocolOnlyView
          requesterLabel={session.requester}
          contactName={session.contactName}
          reason={session.protocolReason}
          onReset={handleReset}
        />
      )}
    </main>
  );
}
