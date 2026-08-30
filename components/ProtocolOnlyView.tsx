'use client';

import React from 'react';

interface ProtocolOnlyViewProps {
  requesterLabel: string;
  contactName: string;
  reason?: 'cannot_confirm' | 'timeout' | 'uncertain';
  onReset: () => void;
}

export default function ProtocolOnlyView({
  requesterLabel,
  contactName,
  reason = 'cannot_confirm',
  onReset,
}: ProtocolOnlyViewProps) {
  const getReasonDetails = () => {
    switch (reason) {
      case 'timeout':
        return 'El contacto de confianza no respondió en el tiempo límite de verificación.';
      case 'uncertain':
        return 'El contacto de confianza indicó duda o incertidumbre respecto a la solicitud.';
      case 'cannot_confirm':
      default:
        return 'El contacto de confianza no pudo confirmar la situación.';
    }
  };

  return (
    <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mt-2 sm:mt-6">
      <div className="bg-amber-600 text-white p-6">
        <div className="inline-block bg-amber-800 text-amber-100 text-xs font-bold px-2.5 py-1 rounded-md mb-2">
          ESTADO DE SEGURIDAD
        </div>

        <h2 className="text-xl font-bold">PROTOCOLO ONLY</h2>

        <p className="text-xs text-amber-100 mt-1">
          No se pudo verificar independientemente.
        </p>
      </div>

      <div className="p-6 space-y-5">
        <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-xl">
          <p className="text-sm font-bold text-amber-950 mb-1">
            No envíes el dinero todavía.
          </p>

          <p className="text-xs text-amber-800 leading-relaxed">
            Family Shield no logró establecer una verificación independiente
            con tu contacto de confianza ({contactName}) sobre la solicitud
            atribuida a {requesterLabel}.
          </p>
        </div>

        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs text-slate-700 space-y-1">
          <p className="font-semibold text-slate-900">
            Motivo del estado:
          </p>

          <p className="leading-relaxed">
            {getReasonDetails()}
          </p>
        </div>

        <div className="border border-slate-200 p-4 rounded-xl space-y-2 text-xs text-slate-600">
          <p className="font-semibold text-slate-800">
            Lo que debes saber:
          </p>

          <ul className="list-disc pl-4 space-y-1 text-slate-600">
            <li>
              Family Shield no afirma que la emergencia sea falsa ni que sea
              una estafa.
            </li>

            <li>
              Únicamente confirma que la verificación independiente no se
              concretó.
            </li>

            <li>
              Tú mantienes en todo momento el control de tu dinero y de tus
              decisiones.
            </li>
          </ul>
        </div>

        <button
          onClick={onReset}
          className="w-full py-3.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-xl text-xs transition text-center"
        >
          Volver al inicio
        </button>
      </div>
    </div>
  );
}
