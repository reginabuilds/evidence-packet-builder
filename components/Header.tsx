import React from 'react';

export default function Header() {
  return (
    <header className="w-full bg-slate-900 text-white py-4 px-6 border-b border-slate-800 flex items-center justify-between">
      <div className="flex items-center space-x-2">
        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center font-bold text-white text-sm">
          FS
        </div>
        <span className="font-semibold text-lg tracking-tight">
          Family Shield
        </span>
      </div>

      <span className="text-xs text-slate-400 bg-slate-800 px-2 py-1 rounded">
        Protección Familiar
      </span>
    </header>
  );
}
