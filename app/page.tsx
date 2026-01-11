'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { LogOut, Map, Lock, User, Trophy, Globe2, Plane } from 'lucide-react';
import Link from 'next/link';

export default function MenuPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // PUNTAJES
  const [scoreColombia, setScoreColombia] = useState<{ score: number; total_questions: number } | null>(null);
  const [scoreSuramerica, setScoreSuramerica] = useState<{ score: number; total_questions: number } | null>(null);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push('/login');
      } else {
        setUser(session.user);

        // 1. Obtener puntaje COLOMBIA (Mejor puntaje)
        const { data: colData } = await supabase
          .from('game_history')
          .select('score, total_questions')
          .eq('user_id', session.user.id)
          .eq('game_mode', 'colombia')
          .order('score', { ascending: false })
          .limit(1)
          .maybeSingle();
        
        if (colData) setScoreColombia(colData);

        // 2. Obtener puntaje SURAMÉRICA (Mejor puntaje)
        const { data: surData } = await supabase
          .from('game_history')
          .select('score, total_questions')
          .eq('user_id', session.user.id)
          .eq('game_mode', 'suramerica')
          .order('score', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (surData) setScoreSuramerica(surData);
        
        setLoading(false);
      }
    };
    checkUser();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  // LÓGICA DE DESBLOQUEO:
  const isSuramericaUnlocked = scoreColombia && scoreColombia.score >= 12;

  // Lista de futuros niveles para renderizar
  const futureLevels = [
    { name: 'Centroamérica', sub: 'Nivel 3' },
    { name: 'Norteamérica', sub: 'Nivel 4' },
    { name: 'Europa', sub: 'Nivel 5' },
    { name: 'África', sub: 'Nivel 6' },
    { name: 'Asia', sub: 'Nivel 7' },
    { name: 'Oceanía', sub: 'Nivel 8' },
    { name: 'El Mundo', sub: 'Gran Final' },
  ];

  if (loading) return <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-400 font-bold">Cargando perfil...</div>;

  return (
    <main className="min-h-screen bg-slate-50 p-4 font-sans pb-10"> {/* Padding bottom extra para scrollear bien */}
      
      {/* Barra Superior */}
      <header className="flex justify-between items-center mb-8 pt-2">
        <div className="flex items-center gap-2">
          <div className="bg-blue-100 p-2 rounded-full text-blue-600">
            <User size={20} />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-bold uppercase">Jugador</p>
            <p className="text-sm font-bold text-slate-700 truncate max-w-[150px]">{user?.email?.split('@')[0]}</p>
          </div>
        </div>
        <button onClick={handleLogout} className="text-slate-400 hover:text-red-500 transition-colors bg-white p-2 rounded-xl shadow-sm border border-slate-100">
          <LogOut size={20} />
        </button>
      </header>

      <div className="max-w-md mx-auto">
        <h1 className="text-3xl font-black text-slate-800 mb-2">Tu Pasaporte 🌎</h1>
        <p className="text-slate-500 mb-8">Completa cada región para desbloquear la siguiente.</p>

        <div className="grid gap-4">
          
          {/* --- NIVEL 1: COLOMBIA (Siempre Activo) --- */}
          <Link href="/play/colombia">
            <div className="group relative overflow-hidden bg-white p-6 rounded-3xl shadow-lg border-2 border-blue-100 hover:border-blue-500 transition-all cursor-pointer active:scale-95">
              <div className="absolute top-0 right-0 bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-bl-xl">NIVEL 1</div>
              <div className="flex items-center gap-4">
                <div className="bg-blue-100 p-4 rounded-2xl text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <Map size={32} />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-black text-slate-800">Colombia</h3>
                  {scoreColombia ? (
                    <div className="flex items-center gap-1 mt-1">
                      <Trophy size={14} className="text-yellow-500" />
                      <p className="text-sm text-green-600 font-bold">Récord: {scoreColombia.score}/{scoreColombia.total_questions}</p>
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500">Capitales y Departamentos</p>
                  )}
                </div>
              </div>
            </div>
          </Link>

          {/* --- NIVEL 2: SURAMÉRICA (Desbloqueable) --- */}
          {isSuramericaUnlocked ? (
            <Link href="/play/suramerica">
              <div className="group relative overflow-hidden bg-white p-6 rounded-3xl shadow-lg border-2 border-green-100 hover:border-green-500 transition-all cursor-pointer active:scale-95">
                <div className="absolute top-0 right-0 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-bl-xl">NIVEL 2</div>
                <div className="flex items-center gap-4">
                  <div className="bg-green-100 p-4 rounded-2xl text-green-600 group-hover:bg-green-600 group-hover:text-white transition-colors">
                    <Globe2 size={32} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-black text-slate-800">Suramérica</h3>
                    {scoreSuramerica ? (
                      <div className="flex items-center gap-1 mt-1">
                        <Trophy size={14} className="text-yellow-500" />
                        <p className="text-sm text-green-600 font-bold">Récord: {scoreSuramerica.score}/{scoreSuramerica.total_questions}</p>
                      </div>
                    ) : (
                      <p className="text-sm text-slate-500">¡Nuevo Desafío!</p>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          ) : (
            <div className="relative overflow-hidden bg-slate-100 p-6 rounded-3xl border-2 border-slate-200 opacity-80 grayscale transition-all">
               <div className="absolute top-0 right-0 bg-slate-400 text-white text-xs font-bold px-3 py-1 rounded-bl-xl">BLOQUEADO</div>
              <div className="flex items-center gap-4">
                <div className="bg-slate-200 p-4 rounded-2xl text-slate-400">
                  <Lock size={32} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-500">Suramérica</h3>
                  <p className="text-sm text-slate-400 font-medium">Logra 12+ pts en Colombia</p>
                </div>
              </div>
            </div>
          )}

          {/* --- NIVELES FUTUROS (Placeholders) --- */}
          {futureLevels.map((level) => (
            <div key={level.name} className="relative overflow-hidden bg-slate-50 p-6 rounded-3xl border-2 border-slate-100 opacity-60">
              <div className="flex items-center gap-4">
                <div className="bg-slate-200 p-4 rounded-2xl text-slate-300">
                  <Lock size={32} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-400">{level.name}</h3>
                  <p className="text-sm text-slate-400 italic">Próximamente...</p>
                </div>
              </div>
            </div>
          ))}

        </div>
      </div>
    </main>
  );
}