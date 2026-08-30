'use client';

import React from 'react';

interface VerifiedResultProps {
  requesterLabel: string;
  contactName: string;
  onReset: () => void;
}

export default function VerifiedResult({
  requesterLabel,
  contactName,
  onReset,
}: VerifiedResultProps) {
  return (
    <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mt-2 sm:mt-6">
      <div className="bg-emerald-700 text-white p-6">
        <div className="inline-block bg-emerald-800 text-emerald-100 text-xs font-bold px-2.5 py-1 rounded-md mb-2">
          RESULTADO
        </div>

        <h2 className="text-xl font-bold">
          Verificado independientemente
        </h2>
      </div>

      <div className="p-6 space-y-5">
        <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl text-xs text-emerald-950">
          <p>
            Tu contacto de confianza (<strong>{contactName}</strong>) ha
            confirmado la situación de forma independiente respecto a{' '}
            <strong>{requesterLabel}</strong>.
          </p>
        </div>

        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Control del usuario
          </h3>

          <p className="text-xs text-slate-700 leading-relaxed">
            Family Shield ha completado la verificación independiente. La
            decisión final sobre qué hacer a continuación permanece al 100%
            bajo tu control.
          </p>
        </div>

        <button
          onClick={onReset}
          className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-xl text-xs transition text-center"
        >
          Finalizar y volver al inicio
        </button>
      </div>
    </div>
  );
}
