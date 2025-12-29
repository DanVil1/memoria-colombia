'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Trophy, RefreshCw, MapPin, Star } from 'lucide-react';

interface Place {
  id: number;
  name: string;
  capital: string;
  fun_fact: string;
  image_url: string;
}

const MAX_QUESTIONS = 10;

export default function Home() {
  // Datos crudos (Los 32 departamentos)
  const [allPlaces, setAllPlaces] = useState<Place[]>([]);
  
  // Estado de la partida actual
  const [gameQueue, setGameQueue] = useState<Place[]>([]); // Las 10 preguntas de esta ronda
  const [currentIndex, setCurrentIndex] = useState(0); // En cuál vamos (0-9)
  const [currentPlace, setCurrentPlace] = useState<Place | null>(null);
  const [options, setOptions] = useState<string[]>([]);
  
  // Marcadores
  const [score, setScore] = useState(0);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [loading, setLoading] = useState(true);
  const [gameOver, setGameOver] = useState(false);

  // 1. Carga inicial de datos (Solo una vez)
  useEffect(() => {
    async function fetchPlaces() {
      const { data } = await supabase.from('places').select('*');
      if (data) {
        setAllPlaces(data);
        startNewGame(data); // Iniciar juego apenas carguen
        setLoading(false);
      }
    }
    fetchPlaces();
  }, []);

  // Función para barajar y sacar 10 únicas
  const startNewGame = (placesList: Place[] = allPlaces) => {
    if (placesList.length === 0) return;

    // Barajamos todo el array
    const shuffled = [...placesList].sort(() => 0.5 - Math.random());
    
    // Tomamos las primeras 10
    const selectedQuestions = shuffled.slice(0, MAX_QUESTIONS);
    
    setGameQueue(selectedQuestions);
    setScore(0);
    setCurrentIndex(0);
    setGameOver(false);
    setShowFeedback(false);
    
    // Preparamos la primera pregunta
    prepareRound(selectedQuestions[0], placesList);
  };

  // Prepara la pregunta actual y sus distractores
  const prepareRound = (place: Place, fullList: Place[]) => {
    setCurrentPlace(place);
    
    // Los distractores salen de la lista COMPLETA, no solo de las 10 del juego
    // para que sea más difícil
    const distractors = fullList
      .filter(p => p.id !== place.id)
      .sort(() => 0.5 - Math.random())
      .slice(0, 2)
      .map(p => p.capital);

    const allOptions = [place.capital, ...distractors].sort(() => 0.5 - Math.random());
    setOptions(allOptions);
    setShowFeedback(false);
  };

  const handleAnswer = (selectedCapital: string) => {
    if (!currentPlace) return;
    const correct = selectedCapital === currentPlace.capital;
    setIsCorrect(correct);
    setShowFeedback(true);
    if (correct) setScore(score + 1);
  };

  const nextQuestion = () => {
    const nextIndex = currentIndex + 1;

    if (nextIndex >= MAX_QUESTIONS) {
      setGameOver(true);
    } else {
      setCurrentIndex(nextIndex);
      // Sacamos la siguiente carta del mazo ya preparado
      prepareRound(gameQueue[nextIndex], allPlaces);
    }
  };

  if (loading) return <div className="flex h-screen items-center justify-center text-2xl text-blue-600 font-bold animate-pulse">Cargando mapa... 🌍</div>;

  // --- PANTALLA DE RESULTADOS (GAME OVER) ---
  if (gameOver) {
    return (
      <main className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-md text-center border-b-8 border-yellow-400">
          <Trophy size={64} className="mx-auto text-yellow-500 mb-4" />
          <h1 className="text-3xl font-black text-slate-800 mb-2">¡Ronda Terminada!</h1>
          
          <div className="bg-blue-50 rounded-xl p-6 mb-8 mt-6">
            <p className="text-sm uppercase tracking-widest text-blue-500 font-bold mb-1">Aciertos</p>
            <p className="text-6xl font-black text-blue-900">{score} <span className="text-2xl text-blue-300">/ {MAX_QUESTIONS}</span></p>
          </div>

          <p className="text-slate-500 italic mb-8">
            {score === 10 ? "¡Impresionante! 🌟 Memoria de elefante." : 
             score >= 7 ? "¡Muy bien! Tienes buena memoria." : 
             "¡Buen entrenamiento! Sigue así."}
          </p>

          <button 
            onClick={() => startNewGame()}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-6 rounded-xl shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-2"
          >
            <RefreshCw size={20} />
            Nueva Partida
          </button>
        </div>
      </main>
    );
  }

  // --- PANTALLA DE JUEGO ---
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 p-4 font-sans flex flex-col items-center">
      
      {/* Header */}
      <div className="w-full max-w-md flex justify-between items-center mb-6 mt-2">
        <div className="flex flex-col">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pregunta</span>
          <span className="text-xl font-black text-slate-700">{currentIndex + 1} <span className="text-slate-300">/ {MAX_QUESTIONS}</span></span>
        </div>
        <div className="flex items-center gap-2 bg-yellow-100 px-4 py-2 rounded-full text-yellow-800 font-bold shadow-sm">
          <Star size={18} fill="currentColor" />
          <span>{score}</span>
        </div>
      </div>

      {currentPlace && (
        <div className="w-full max-w-md flex flex-col items-center space-y-4">
          
          {/* Tarjeta */}
          <div className="bg-white p-6 rounded-3xl shadow-lg w-full text-center border-2 border-slate-100 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-blue-500"></div>
            <MapPin className="mx-auto text-blue-500 mb-3" size={32} />
            <p className="text-slate-400 uppercase tracking-widest text-xs font-bold mb-1">Departamento</p>
            <h2 className="text-3xl font-black text-slate-800 mb-1">{currentPlace.name}</h2>
            <p className="text-lg text-slate-500">¿Cuál es su capital?</p>
          </div>

          {/* Opciones */}
          {!showFeedback && (
            <div className="grid gap-3 w-full mt-4">
              {options.map((option) => (
                <button
                  key={option}
                  onClick={() => handleAnswer(option)}
                  className="bg-white hover:bg-blue-50 border-b-4 border-slate-200 hover:border-blue-500 text-slate-700 hover:text-blue-700 font-bold py-4 px-6 rounded-2xl text-lg transition-all active:scale-95 text-left flex justify-between items-center group"
                >
                  {option}
                  <span className="opacity-0 group-hover:opacity-100 text-blue-500 transition-opacity">➜</span>
                </button>
              ))}
            </div>
          )}

          {/* Feedback Modal */}
          {showFeedback && (
            <div className={`w-full p-6 rounded-3xl shadow-2xl animate-in fade-in slide-in-from-bottom-8 duration-300 ${isCorrect ? 'bg-green-50 border-2 border-green-200' : 'bg-red-50 border-2 border-red-200'}`}>
              
              <div className="text-center mb-4">
                <h3 className={`text-2xl font-black mb-1 ${isCorrect ? 'text-green-700' : 'text-red-600'}`}>
                  {isCorrect ? '¡Correcto! 🌟' : '¡Casi! 😅'}
                </h3>
                {!isCorrect && <p className="text-slate-600">La respuesta era <span className="font-bold text-slate-900">{currentPlace.capital}</span></p>}
              </div>

              {isCorrect && (
                <div className="mb-6 bg-white p-3 rounded-2xl shadow-sm">
                  <div className="relative h-48 w-full rounded-xl overflow-hidden mb-3">
                    <img 
                      src={currentPlace.image_url} 
                      alt={currentPlace.name} 
                      className="object-cover w-full h-full"
                    />
                  </div>
                  <p className="text-xs font-bold text-green-600 uppercase mb-1">Dato Curioso</p>
                  <p className="text-slate-700 text-sm leading-relaxed">{currentPlace.fun_fact}</p>
                </div>
              )}

              <button 
                onClick={nextQuestion}
                className={`w-full py-4 rounded-xl font-black text-white shadow-lg flex items-center justify-center gap-2 transition-transform active:scale-95 ${isCorrect ? 'bg-green-600 hover:bg-green-700' : 'bg-slate-700 hover:bg-slate-800'}`}
              >
                <span>{currentIndex + 1 >= MAX_QUESTIONS ? 'Ver Resultados' : 'Siguiente Pregunta'}</span>
                <RefreshCw size={20} />
              </button>
            </div>
          )}
        </div>
      )}
    </main>
  );
}