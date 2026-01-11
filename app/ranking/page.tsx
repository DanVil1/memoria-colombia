'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Trophy, ArrowLeft, User, Clock } from 'lucide-react';

interface ScoreEntry {
  id: number;
  player_email: string;
  score: number;
  total_questions: number;
  total_time: number; // Nuevo campo
  created_at: string;
}

export default function RankingPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('colombia');
  const [scores, setScores] = useState<ScoreEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchScores(activeTab);
  }, [activeTab]);

  const fetchScores = async (region: string) => {
    setLoading(true);
    // ORDENAMIENTO DOBLE:
    // 1. Mejor Puntaje (Descending)
    // 2. Menor Tiempo (Ascending) -> El desempate
    const { data } = await supabase
      .from('game_history')
      .select('*')
      .eq('game_mode', region)
      .order('score', { ascending: false })
      .order('total_time', { ascending: true }); // El más rápido gana

    if (data) {
      // Filtrar para dejar solo el MEJOR registro de cada usuario
      const bestScoresMap = new Map();
      
      data.forEach((entry: ScoreEntry) => {
        const email = entry.player_email;
        
        if (!bestScoresMap.has(email)) {
          // Si no está, lo agregamos (ya viene ordenado por la query)
          bestScoresMap.set(email, entry);
        } else {
          // Si ya está, revisamos si este registro es mejor en tiempo (por si acaso)
          const currentBest = bestScoresMap.get(email);
          if (entry.score > currentBest.score) {
             bestScoresMap.set(email, entry);
          } else if (entry.score === currentBest.score) {
             // Si empatan en puntaje, gana el que tenga menos tiempo (y que no sea null)
             if (entry.total_time && (!currentBest.total_time || entry.total_time < currentBest.total_time)) {
                bestScoresMap.set(email, entry);
             }
          }
        }
      });

      setScores(Array.from(bestScoresMap.values()));
    }
    setLoading(false);
  };

  // Función para convertir segundos a "1m 30s"
  const formatTime = (seconds: number) => {
    if (!seconds) return '--';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins > 0) return `${mins}m ${secs}s`;
    return `${secs}s`;
  };

  const getMedalColor = (index: number) => {
    if (index === 0) return 'text-yellow-500';
    if (index === 1) return 'text-slate-400';
    if (index === 2) return 'text-amber-700';
    return 'text-slate-300';
  };

  return (
    <main className="min-h-screen bg-slate-50 p-4 font-sans">
      
      <div className="max-w-md mx-auto mb-6 flex items-center gap-4">
        <button onClick={() => router.push('/')} className="bg-white p-3 rounded-xl shadow-sm border border-slate-200 text-slate-600 hover:bg-slate-100">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
          <Trophy className="text-yellow-500" />
          Tabla de Líderes
        </h1>
      </div>

      <div className="max-w-md mx-auto">
        <div className="flex bg-white p-1 rounded-2xl shadow-sm mb-6 border border-slate-200">
          <button onClick={() => setActiveTab('colombia')} className={`flex-1 py-2 text-sm font-bold rounded-xl transition-all ${activeTab === 'colombia' ? 'bg-blue-100 text-blue-700 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>🇨🇴 Col</button>
          <button onClick={() => setActiveTab('suramerica')} className={`flex-1 py-2 text-sm font-bold rounded-xl transition-all ${activeTab === 'suramerica' ? 'bg-green-100 text-green-700 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>🌎 Sur</button>
          <button onClick={() => setActiveTab('centro_norteamerica')} className={`flex-1 py-2 text-sm font-bold rounded-xl transition-all ${activeTab === 'centro_norteamerica' ? 'bg-purple-100 text-purple-700 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>✈️ Norte</button>
        </div>

        <div className="space-y-3">
          {loading ? (
            <div className="text-center py-10 text-slate-400 font-bold animate-pulse">Calculando tiempos...</div>
          ) : scores.length === 0 ? (
            <div className="text-center py-10 bg-white rounded-3xl border-2 border-dashed border-slate-200">
              <p className="text-slate-400 font-medium">Aún no hay registros.</p>
            </div>
          ) : (
            scores.map((score, index) => (
              <div key={index} className={`bg-white p-4 rounded-2xl shadow-sm border-2 flex items-center gap-3 ${index === 0 ? 'border-yellow-200 bg-yellow-50' : 'border-slate-100'}`}>
                
                {/* Posición */}
                <div className={`font-black text-2xl w-8 text-center ${getMedalColor(index)}`}>{index + 1}</div>
                
                {/* Info Usuario */}
                <div className="flex-1 min-w-0"> {/* min-w-0 ayuda al truncate */}
                  <div className="flex items-center gap-2 mb-1">
                    <User size={14} className="text-slate-400 flex-shrink-0" />
                    <p className="font-bold text-slate-700 truncate">
                      {score.player_email?.split('@')[0] || 'Anónimo'}
                    </p>
                  </div>
                  {/* Tiempo con Icono */}
                  <div className="flex items-center gap-1 text-xs text-slate-500 font-medium">
                    <Clock size={12} />
                    <span>{formatTime(score.total_time)}</span>
                  </div>
                </div>

                {/* Puntaje */}
                <div className="text-right flex-shrink-0">
                  <span className="block text-2xl font-black text-slate-800 leading-none">{score.score}</span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">/ {score.total_questions} PTS</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </main>
  );
}