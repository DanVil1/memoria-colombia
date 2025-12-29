'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Trophy, RefreshCw, MapPin, Star, Lightbulb } from 'lucide-react';

// Actualizamos la interfaz para soportar los Arrays (Listas)
interface Place {
  id: number;
  name: string;
  capital: string;
  other_cities: string[]; // Ahora es una lista de ciudades
  fun_facts: string[];    // Ahora es una lista de datos curiosos
  image_url: string;      // Nombre del archivo (ej: 'amazonas.jpg')
}

const MAX_QUESTIONS = 10;

export default function Home() {
  const [allPlaces, setAllPlaces] = useState<Place[]>([]);
  
  // Estado de la partida
  const [gameQueue, setGameQueue] = useState<Place[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentPlace, setCurrentPlace] = useState<Place | null>(null);
  const [options, setOptions] = useState<string[]>([]);
  
  // Estado del dato curioso actual (para que varíe)
  const [currentFact, setCurrentFact] = useState<string>("");

  const [score, setScore] = useState(0);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [loading, setLoading] = useState(true);
  const [gameOver, setGameOver] = useState(false);

  useEffect(() => {
    async function fetchPlaces() {
      // Pedimos todo a Supabase
      const { data, error } = await supabase.from('places').select('*');
      if (error) console.error("Error conectando:", error);
      
      if (data) {
        setAllPlaces(data);
        startNewGame(data);
        setLoading(false);
      }
    }
    fetchPlaces();
  }, []);

  const startNewGame = (placesList: Place[] = allPlaces) => {
    if (placesList.length === 0) return;

    // Barajar y tomar 10
    const shuffled = [...placesList].sort(() => 0.5 - Math.random());
    const selectedQuestions = shuffled.slice(0, MAX_QUESTIONS);
    
    setGameQueue(selectedQuestions);
    setScore(0);
    setCurrentIndex(0);
    setGameOver(false);
    
    prepareRound(selectedQuestions[0]);
  };

  const prepareRound = (place: Place) => {
    setCurrentPlace(place);
    setShowFeedback(false);

    // 1. ELEGIR DATO CURIOSO RANDOM
    // Si hay datos, escogemos uno al azar. Si no, ponemos uno genérico.
    if (place.fun_facts && place.fun_facts.length > 0) {
      const randomFact = place.fun_facts[Math.floor(Math.random() * place.fun_facts.length)];
      setCurrentFact(randomFact);
    } else {
      setCurrentFact("¡Colombia es un país sorprendente!");
    }

    // 2. GENERAR OPCIONES (NIVEL DIFÍCIL)
    // Tomamos 3 ciudades DEL MISMO DEPARTAMENTO (other_cities)
    // Si por alguna razón no hay suficientes, rellenamos con capitales de otros lados (fallback)
    let distractors: string[] = [];

    if (place.other_cities && place.other_cities.length >= 3) {
      distractors = place.other_cities
        .sort(() => 0.5 - Math.random())
        .slice(0, 3);
    } else {
      // Fallback por si acaso: usar capitales de otros deptos
      distractors = allPlaces
        .filter(p => p.id !== place.id)
        .sort(() => 0.5 - Math.random())
        .slice(0, 3)
        .map(p => p.capital);
    }

    // Mezclamos la correcta con los 3 distractores (Total 4 opciones)
    const allOptions = [place.capital, ...distractors].sort(() => 0.5 - Math.random());
    setOptions(allOptions);
  };

  const handleAnswer = (selectedOption: string) => {
    if (!currentPlace) return;
    const correct = selectedOption === currentPlace.capital;
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
      prepareRound(gameQueue[nextIndex]);
    }
  };

  if (loading) return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-xl font-bold text-slate-600">Cargando mapa... 🇨🇴</p>
      </div>
    </div>
  );

  // --- PANTALLA GAME OVER ---
  if (gameOver) {
    return (
      <main className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-md text-center border-b-8 border-yellow-400">
          <Trophy size={64} className="mx-auto text-yellow-500 mb-4" />
          <h1 className="text-3xl font-black text-slate-800 mb-2">¡Entrenamiento Finalizado!</h1>
          
          <div className="bg-blue-50 rounded-xl p-6 mb-8 mt-6">
            <p className="text-sm uppercase tracking-widest text-blue-500 font-bold mb-1">Tu Puntaje</p>
            <p className="text-6xl font-black text-blue-900">{score} <span className="text-2xl text-blue-300">/ {MAX_QUESTIONS}</span></p>
          </div>

          <p className="text-slate-500 italic mb-8">
            {score === 10 ? "¡PERFECTO! 🌟 Eres una experta en geografía." : 
             score >= 7 ? "¡Excelente trabajo! Conoces muy bien el país." : 
             "¡Buen intento! Sigue practicando para mejorar."}
          </p>

          <button 
            onClick={() => startNewGame()}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-6 rounded-xl shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-2"
          >
            <RefreshCw size={20} />
            Jugar de Nuevo
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
          
          {/* Tarjeta de Pregunta */}
          <div className="bg-white p-6 rounded-3xl shadow-lg w-full text-center border-2 border-slate-100 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-blue-500"></div>
            <MapPin className="mx-auto text-blue-500 mb-2" size={32} />
            <p className="text-slate-400 uppercase tracking-widest text-xs font-bold mb-1">Departamento</p>
            <h2 className="text-3xl font-black text-slate-800 mb-1 leading-tight">{currentPlace.name}</h2>
            <p className="text-lg text-slate-500">¿Cuál es su capital?</p>
          </div>

          {/* Opciones (Grid de 2x2 o Lista según prefieras, aquí lista para que se lean bien) */}
          {!showFeedback && (
            <div className="grid gap-3 w-full mt-2">
              {options.map((option) => (
                <button
                  key={option}
                  onClick={() => handleAnswer(option)}
                  className="bg-white hover:bg-blue-50 border-b-4 border-slate-200 hover:border-blue-500 text-slate-700 hover:text-blue-700 font-bold py-4 px-6 rounded-2xl text-lg transition-all active:scale-95 text-left flex justify-between items-center group"
                >
                  {option}
                  <div className="w-6 h-6 rounded-full border-2 border-slate-200 group-hover:border-blue-500 flex items-center justify-center">
                    <div className="w-3 h-3 rounded-full bg-blue-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Feedback Modal */}
          {showFeedback && (
            <div className={`w-full p-5 rounded-3xl shadow-2xl animate-in fade-in slide-in-from-bottom-8 duration-300 ${isCorrect ? 'bg-green-50 border-2 border-green-200' : 'bg-red-50 border-2 border-red-200'}`}>
              
              <div className="text-center mb-4">
                <h3 className={`text-2xl font-black mb-1 ${isCorrect ? 'text-green-700' : 'text-red-600'}`}>
                  {isCorrect ? '¡Correcto! 🎉' : '¡Casi! 😅'}
                </h3>
                {!isCorrect && <p className="text-slate-600">La respuesta era <span className="font-bold text-slate-900">{currentPlace.capital}</span></p>}
              </div>

              {isCorrect && (
                <div className="mb-4 bg-white p-3 rounded-2xl shadow-sm border border-slate-100">
                  <div className="relative w-full h-48 rounded-xl overflow-hidden mb-3 bg-slate-200">
                    {/* CARGA IMAGEN LOCAL */}
                    <img 
                      src={`/img/${currentPlace.image_url}`} 
                      alt={currentPlace.name} 
                      className="object-cover w-full h-full"
                      onError={(e) => {
                        // Fallback por si la imagen no existe aún
                        (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x300?text=Sin+Imagen';
                      }}
                    />
                  </div>
                  <div className="flex gap-2 items-start">
                    <Lightbulb className="text-yellow-500 shrink-0 mt-1" size={20} />
                    <p className="text-slate-700 text-sm leading-relaxed italic">{currentFact}</p>
                  </div>
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