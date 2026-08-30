'use client';

import React from 'react';

interface VerificationProgressProps {
  requesterLabel: string;
  contactName: string;
  onConfirm: () => void;
  onCannotConfirm: () => void;
  onTimeout: () => void;
}

export default function VerificationProgress({
  requesterLabel,
  contactName,
  onConfirm,
  onCannotConfirm,
  onTimeout,
}: VerificationProgressProps) {
  return (
    <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mt-2 sm:mt-6">
      <div className="bg-slate-900 text-white p-5">
        <h2 className="text-lg font-bold">
          Verificación en progreso
        </h2>

        <p className="text-xs text-slate-300 mt-0.5">
          Contactando al contacto de confianza de forma independiente...
        </p>
      </div>

      <div className="p-6 space-y-6">
        <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl space-y-2">
          <div className="flex items-center space-x-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-600" />
            </span>

            <span className="text-xs font-bold uppercase tracking-wider text-blue-800">
              Estado: Esperando respuesta
            </span>
          </div>

          <p className="text-xs text-slate-700">
            Solicitante declarado:{' '}
            <strong>{requesterLabel}</strong>
          </p>

          <p className="text-xs text-slate-700">
            Verificador independiente:{' '}
            <strong>{contactName}</strong>
          </p>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          La verificación ocurre exclusivamente a través del canal directo con
          tu contacto de confianza. Ningún mensaje o canal del solicitante
          puede validar esta solicitud.
        </p>

        <div className="border-t border-dashed border-slate-300 pt-5 space-y-3">
          <div className="bg-slate-100 p-2.5 rounded-lg text-center">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">
              SIMULACIÓN — CONTACTO DE CONFIANZA
            </span>
          </div>

          <p className="text-xs text-slate-500 text-center">
            Selecciona la respuesta simulada del contacto para probar el flujo:
          </p>

          <div className="space-y-2 pt-1">
            <button
              onClick={onConfirm}
              className="w-full py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl text-xs transition"
            >
              1. Confirmar (Verificado)
            </button>

            <button
              onClick={onCannotConfirm}
              className="w-full py-2.5 px-3 bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-xl text-xs transition"
            >
              2. No puedo confirmar (Protocol Only)
            </button>

            <button
              onClick={onTimeout}
              className="w-full py-2.5 px-3 bg-slate-700 hover:bg-slate-800 text-white font-medium rounded-xl text-xs transition"
            >
              3. Simular Timeout (Protocol Only)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
