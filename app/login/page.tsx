'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Mail, Loader2, CheckCircle } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        // IMPORTANTE: Esto redirige al usuario al menú después del click en el correo
        emailRedirectTo: `${window.location.origin}/`, 
      },
    });

    if (error) {
      alert('Error enviando el correo: ' + error.message);
    } else {
      setSent(true);
    }
    setLoading(false);
  };

  if (sent) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-md text-center">
          <CheckCircle className="mx-auto text-green-500 mb-4 h-16 w-16" />
          <h2 className="text-2xl font-black text-slate-800 mb-2">¡Correo Enviado!</h2>
          <p className="text-slate-600">
            Revisa tu bandeja de entrada en <strong>{email}</strong> y dale click al enlace mágico para entrar.
          </p>
          <p className="text-sm text-slate-400 mt-4">(Puedes cerrar esta pestaña)</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-md">
        <div className="text-center mb-8">
          <div className="bg-blue-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
             {/* Aquí saldrá tu icono si lo pusiste en public/icon.png */}
             <img src="/icon.png" alt="Logo" className="w-12 h-12" />
          </div>
          <h1 className="text-3xl font-black text-slate-800">Memoria Geográfica</h1>
          <p className="text-slate-500 mt-2">Ingresa para entrenar tu cerebro</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Correo Electrónico</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3.5 text-slate-400 h-5 w-5" />
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ejemplo@correo.com"
                required
                className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-slate-200 focus:border-blue-500 outline-none transition-colors font-medium text-slate-700"
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading || !email}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin" /> : 'Enviarme Enlace Mágico'}
          </button>
        </form>
      </div>
    </main>
  );
}