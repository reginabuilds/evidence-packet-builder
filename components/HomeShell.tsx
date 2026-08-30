'use client';

import React from 'react';

export default function HomeShell() {
  const handleStartVerification = () => {
    alert(
      'Nueva verificación iniciada. El flujo estará disponible en la siguiente etapa.'
    );
  };

  return (
    <main className="min-h-[calc(100vh-65px)] bg-slate-50 flex flex-col items-center p-4 sm:p-6">
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
              Mantén siempre el control de tu dinero y toma la decisión final.
            </p>
          </div>

          <div className="pt-4">
            <button
              onClick={handleStartVerification}
              className="w-full py-3.5 px-4 bg-blue-700 hover:bg-blue-800 text-white font-medium rounded-xl shadow border border-blue-800 transition text-center"
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
    </main>
  );
}
