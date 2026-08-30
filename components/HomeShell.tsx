'use client';

import React, { useState } from 'react';
import NewVerificationForm from '@/components/NewVerificationForm';
import VerificationProgress from '@/components/VerificationProgress';
import VerifiedResult from '@/components/VerifiedResult';
import { INITIAL_TRUSTED_CONTACTS } from '@/lib/types';

export default function HomeShell() {
  const [view, setView] = useState<
    'home' | 'new_verification' | 'in_progress' | 'verified' | 'protocol_only'
  >('home');

  const [session, setSession] = useState<{
    requester: string;
    contactId: string;
    contactName: string;
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
    });

    setView('in_progress');
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
          onCancel={() => setView('home')}
          onSubmitSession={handleCreateSession}
        />
      )}

      {view === 'in_progress' && session && (
        <VerificationProgress
          requesterLabel={session.requester}
          contactName={session.contactName}
          onConfirm={() => setView('verified')}
          onCannotConfirm={() => setView('protocol_only')}
          onTimeout={() => setView('protocol_only')}
        />
      )}

      {view === 'verified' && session && (
        <VerifiedResult
          requesterLabel={session.requester}
          contactName={session.contactName}
          onReset={() => {
            setSession(null);
            setView('home');
          }}
        />
      )}

      {view === 'protocol_only' && (
        <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mt-2 sm:mt-6 p-6 space-y-4">
          <div className="bg-amber-600 text-white p-4 rounded-xl">
            <span className="inline-block text-xs font-bold uppercase tracking-wider bg-amber-800 text-amber-100 px-2 py-0.5 rounded mb-1">
              PROTOCOLO ONLY
            </span>

            <h3 className="font-bold text-base">
              No se pudo verificar independientemente
            </h3>
          </div>

          <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-xl">
            <p className="text-xs font-bold text-amber-900 mb-1">
              No envíes el dinero todavía.
            </p>

            <p className="text-xs text-amber-800 leading-relaxed">
              Family Shield no pudo establecer una verificación independiente
              con tu contacto de confianza.
            </p>
          </div>

          <button
            onClick={() => {
              setSession(null);
              setView('home');
            }}
            className="w-full py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 font-medium rounded-xl transition text-xs text-center"
          >
            Volver al inicio
          </button>
        </div>
      )}
    </main>
  );
}
