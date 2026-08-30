'use client';

import React, { useState } from 'react';
import { INITIAL_TRUSTED_CONTACTS, TrustedContact } from '@/lib/types';

interface NewVerificationFormProps {
  onCancel: () => void;
  onSubmitSession: (requesterLabel: string, trustedContactId: string) => void;
}

export default function NewVerificationForm({
  onCancel,
  onSubmitSession,
}: NewVerificationFormProps) {
  const [requesterLabel, setRequesterLabel] = useState('');
  const [selectedContactId, setSelectedContactId] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!requesterLabel.trim()) {
      setError('Por favor indica quién solicita el dinero.');
      return;
    }

    if (!selectedContactId) {
      setError(
        'Por favor selecciona un contacto de confianza independiente.'
      );
      return;
    }

    setError('');
    onSubmitSession(requesterLabel.trim(), selectedContactId);
  };

  return (
    <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mt-2 sm:mt-6">
      <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
        <h2 className="text-lg font-bold">Nueva verificación</h2>

        <button
          onClick={onCancel}
          type="button"
          className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-lg transition"
        >
          Cancelar
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-5">
        <div>
          <label className="block text-sm font-semibold text-slate-900 mb-1">
            1. ¿Quién dice solicitar el dinero?
          </label>

          <p className="text-xs text-slate-500 mb-2">
            Escribe el nombre o parentesco del familiar que pide la
            transferencia.
          </p>

          <input
            type="text"
            value={requesterLabel}
            onChange={(e) => setRequesterLabel(e.target.value)}
            placeholder="Ej. Mi hijo Juan, Tía Sofia"
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
          />
        </div>

        <div className="bg-amber-50 border-l-4 border-amber-500 p-3.5 rounded-r-xl">
          <p className="text-xs text-amber-900 leading-relaxed">
            <strong className="font-semibold">
              Principio de independencia:
            </strong>{' '}
            No puedes usar el mismo canal por el que recibiste el mensaje de
            emergencia. Selecciona un contacto de confianza previamente
            guardado.
          </p>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-900 mb-1">
            2. Contacto de confianza para verificar
          </label>

          <p className="text-xs text-slate-500 mb-2">
            Este contacto confirmará de manera independiente la situación.
          </p>

          <div className="space-y-2.5">
            {INITIAL_TRUSTED_CONTACTS.map((contact: TrustedContact) => (
              <label
                key={contact.id}
                className={`flex items-start space-x-3 p-3.5 rounded-xl border cursor-pointer transition ${
                  selectedContactId === contact.id
                    ? 'border-blue-600 bg-blue-50/50'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <input
                  type="radio"
                  name="trusted_contact"
                  value={contact.id}
                  checked={selectedContactId === contact.id}
                  onChange={() => setSelectedContactId(contact.id)}
                  className="mt-1 text-blue-600 focus:ring-blue-500"
                />

                <div className="text-xs">
                  <p className="font-semibold text-slate-900">
                    {contact.name}
                  </p>
                  <p className="text-slate-500">{contact.phone}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {error && (
          <p className="text-xs text-red-600 font-medium bg-red-50 p-2.5 rounded-lg border border-red-200">
            {error}
          </p>
        )}

        <div className="pt-2">
          <button
            type="submit"
            className="w-full py-3.5 px-4 bg-blue-700 hover:bg-blue-800 text-white font-medium rounded-xl shadow border border-blue-800 transition text-center text-sm"
          >
            Iniciar sesión de verificación
          </button>
        </div>
      </form>
    </div>
  );
}
