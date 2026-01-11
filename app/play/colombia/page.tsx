'use client';

import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation'; // Necesario para volver al menú
import { Trophy, RefreshCw, MapPin, Star, Lightbulb, ArrowRightLeft, Keyboard, Send, Timer, Home } from 'lucide-react';

interface Place {
  id: number;
  name: string;
  capital: string;
  other_cities: string[]; 
  fun_facts: string[];    
  image_url: string;      
}

const MAX_QUESTIONS = 15;
const INPUT_MODE_START_INDEX = 10;
const TIME_LIMIT_NORMAL = 15;
const TIME_LIMIT_BOSS = 30;

const normalizeText = (text: string) => {
  return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
};

export default function GameColombia() {
  const router = useRouter(); // Hook para navegación
  const [allPlaces, setAllPlaces] = useState<Place[]>([]);
  
  // Estados del juego
  const [gameQueue, setGameQueue] = useState<Place[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentPlace, setCurrentPlace] = useState<Place | null>(null);
  
  const [questionType, setQuestionType] = useState<'standard' | 'inverse'>('standard');
  const [isInputMode, setIsInputMode] = useState(false);
  const [options, setOptions] = useState<string[]>([]);
  
  const [userInputValue, setUserInputValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT_NORMAL);
  const [maxTime, setMaxTime] = useState(TIME_LIMIT_NORMAL);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  const [currentFact, setCurrentFact] = useState<string>("");
  const [score, setScore] = useState(0);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [loading, setLoading] = useState(true);
  const [gameOver, setGameOver] = useState(false);
  const [savingScore, setSavingScore] = useState(false); // Nuevo estado visual

  useEffect(() => {
    async function fetchPlaces() {
      // AQUÍ ESTABA EL ERROR: Le faltaba el filtro de región
      const { data, error } = await supabase
        .from('places')
        .select('*')
        .eq('region', 'colombia'); // <--- AGREGA ESTA LÍNEA
      
      if (data) {
        setAllPlaces(data);
        startNewGame(data);
        setLoading(false);
      }
    }
    fetchPlaces();
  }, []);

  // Lógica del Timer
  useEffect(() => {
    if (!isTimerRunning || showFeedback || gameOver) return;
    if (timeLeft <= 0) {
      handleTimeOut();
      return;
    }
    const timerId = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timerId);
  }, [timeLeft, isTimerRunning, showFeedback, gameOver]);

  // --- NUEVA FUNCIÓN: GUARDAR PUNTAJE ---
  const saveGameResult = async (finalScore: number) => {
    setSavingScore(true);
    
    // 1. Obtener usuario actual
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      // 2. Insertar en tabla game_history
      const { error } = await supabase.from('game_history').insert({
        user_id: user.id,
        score: finalScore,
        total_questions: MAX_QUESTIONS,
        game_mode: 'colombia'
      });
      
      if (error) console.error("Error guardando puntaje:", error);
      else console.log("¡Puntaje guardado!");
    }
    setSavingScore(false);
  };

  const handleTimeOut = () => {
    setIsCorrect(false);
    setShowFeedback(true);
    setIsTimerRunning(false);
  };

  const startNewGame = (placesList: Place[] = allPlaces) => {
    if (placesList.length === 0) return;
    const shuffled = [...placesList].sort(() => 0.5 - Math.random());
    const selectedQuestions = shuffled.slice(0, MAX_QUESTIONS);
    
    setGameQueue(selectedQuestions);
    setScore(0);
    setCurrentIndex(0);
    setGameOver(false);
    prepareRound(selectedQuestions[0], 0, placesList);
  };

  const prepareRound = (place: Place, index: number, fullList: Place[] = allPlaces) => {
    setCurrentPlace(place);
    setShowFeedback(false);
    setUserInputValue("");
    
    const bossMode = index >= INPUT_MODE_START_INDEX;
    const timeForRound = bossMode ? TIME_LIMIT_BOSS : TIME_LIMIT_NORMAL;
    setMaxTime(timeForRound);
    setTimeLeft(timeForRound);
    setIsTimerRunning(true);

    if (place.fun_facts && place.fun_facts.length > 0) {
      setCurrentFact(place.fun_facts[Math.floor(Math.random() * place.fun_facts.length)]);
    } else {
      setCurrentFact("¡Colombia es asombrosa!");
    }

    setIsInputMode(bossMode);
    const type = Math.random() > 0.5 ? 'inverse' : 'standard';
    setQuestionType(type);

    if (!bossMode) {
      let distractors: string[] = [];
      let correctAnswer = type === 'standard' ? place.capital : place.name;

      if (type === 'standard') {
        if (place.other_cities && place.other_cities.length >= 3) {
          distractors = place.other_cities.sort(() => 0.5 - Math.random()).slice(0, 3);
        } else {
          distractors = fullList.filter(p => p.id !== place.id).sort(() => 0.5 - Math.random()).slice(0, 3).map(p => p.capital);
        }
      } else {
        distractors = fullList.filter(p => p.id !== place.id).sort(() => 0.5 - Math.random()).slice(0, 3).map(p => p.name);
      }
      setOptions([correctAnswer, ...distractors].sort(() => 0.5 - Math.random()));
    } else {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  };

  const handleAnswer = (answer: string) => {
    if (!currentPlace || showFeedback) return;
    setIsTimerRunning(false);

    const correctAnswer = questionType === 'standard' ? currentPlace.capital : currentPlace.name;
    const isAnswerCorrect = normalizeText(answer) === normalizeText(correctAnswer);

    setIsCorrect(isAnswerCorrect);
    setShowFeedback(true);
    
    // IMPORTANTE: Calculamos el nuevo score aquí para pasarlo actualizado
    const newScore = isAnswerCorrect ? score + 1 : score;
    if (isAnswerCorrect) setScore(newScore);
  };

  const nextQuestion = () => {
    const nextIndex = currentIndex + 1;
    if (nextIndex >= MAX_QUESTIONS) {
      setGameOver(true);
      saveGameResult(score); // <--- GUARDAMOS AL TERMINAR
    } else {
      setCurrentIndex(nextIndex);
      prepareRound(gameQueue[nextIndex], nextIndex, allPlaces);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && userInputValue.trim() !== "") {
      handleAnswer(userInputValue);
    }
  };

  // Barra de progreso
  const progressPercent = (timeLeft / maxTime) * 100;
  let barColor = 'bg-green-500';
  if (progressPercent < 60) barColor = 'bg-yellow-500';
  if (progressPercent < 30) barColor = 'bg-red-500';

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50 font-bold text-slate-500">Cargando...</div>;

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

          {savingScore && <p className="text-sm text-slate-400 mb-4 animate-pulse">Guardando tu progreso...</p>}

          <div className="flex flex-col gap-3">
            <button 
              onClick={() => startNewGame()}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-6 rounded-xl shadow-lg flex items-center justify-center gap-2"
            >
              <RefreshCw size={20} />
              Jugar de Nuevo
            </button>

            {/* BOTÓN PARA VOLVER AL MENÚ */}
            <button 
              onClick={() => router.push('/')}
              className="w-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-4 px-6 rounded-xl flex items-center justify-center gap-2"
            >
              <Home size={20} />
              Volver al Menú
            </button>
          </div>
        </div>
      </main>
    );
  }

  // --- PANTALLA JUEGO ---
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 p-4 font-sans flex flex-col items-center">
      <div className="w-full max-w-md flex justify-between items-center mb-2 mt-2">
        <div className="flex flex-col">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            {isInputMode ? 'NIVEL EXPERTO' : 'Ronda'}
          </span>
          <span className="text-xl font-black text-slate-700">{currentIndex + 1} <span className="text-slate-300">/ {MAX_QUESTIONS}</span></span>
        </div>
        <div className="flex items-center gap-2 bg-yellow-100 px-4 py-2 rounded-full text-yellow-800 font-bold shadow-sm">
          <Star size={18} fill="currentColor" />
          <span>{score}</span>
        </div>
      </div>

      <div className="w-full max-w-md bg-slate-200 rounded-full h-2.5 mb-6 overflow-hidden">
        <div 
          className={`h-2.5 rounded-full transition-all duration-1000 ease-linear ${barColor}`} 
          style={{ width: `${progressPercent}%` }}
        ></div>
      </div>

      {currentPlace && (
        <div className="w-full max-w-md flex flex-col items-center space-y-4">
          <div className={`bg-white p-6 rounded-3xl shadow-lg w-full text-center border-2 ${isInputMode ? 'border-amber-200' : 'border-slate-100'} relative overflow-hidden transition-all`}>
            <div className={`absolute top-0 left-0 w-full h-2 ${isInputMode ? 'bg-amber-500' : (questionType === 'standard' ? 'bg-blue-500' : 'bg-purple-500')}`}></div>
            
            {timeLeft === 0 && !showFeedback && (
               <div className="absolute inset-0 bg-red-50/90 flex items-center justify-center z-10">
                 <p className="text-red-600 font-black text-xl flex items-center gap-2"><Timer /> ¡Tiempo Agotado!</p>
               </div>
            )}

            {isInputMode && (
               <div className="absolute top-3 right-3 text-amber-500 animate-pulse">
                 <Keyboard size={24} />
               </div>
            )}

            {questionType === 'standard' ? (
              <>
                <MapPin className={`mx-auto mb-2 ${isInputMode ? 'text-amber-500' : 'text-blue-500'}`} size={32} />
                <p className="text-slate-400 uppercase tracking-widest text-xs font-bold mb-1">Departamento</p>
                <h2 className="text-3xl font-black text-slate-800 mb-1 leading-tight">{currentPlace.name}</h2>
                <p className="text-lg text-slate-500">{isInputMode ? 'Escribe su capital:' : '¿Cuál es su capital?'}</p>
              </>
            ) : (
              <>
                <ArrowRightLeft className={`mx-auto mb-2 ${isInputMode ? 'text-amber-500' : 'text-purple-500'}`} size={32} />
                <p className="text-slate-400 uppercase tracking-widest text-xs font-bold mb-1">Ciudad Capital</p>
                <h2 className="text-3xl font-black text-slate-800 mb-1 leading-tight">{currentPlace.capital}</h2>
                <p className="text-lg text-slate-500">{isInputMode ? 'Escribe el departamento:' : '¿A qué departamento pertenece?'}</p>
              </>
            )}
          </div>

          {!showFeedback && (
            isInputMode ? (
              <div className="w-full animate-in fade-in zoom-in duration-300">
                <div className="relative">
                  <input
                    ref={inputRef}
                    type="text"
                    value={userInputValue}
                    onChange={(e) => setUserInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={timeLeft === 0}
                    placeholder="Escribe aquí..."
                    className="w-full p-4 pl-5 rounded-2xl border-2 border-slate-300 text-xl focus:border-amber-500 focus:ring-4 focus:ring-amber-100 outline-none transition-all text-center font-bold text-slate-700 placeholder:font-normal"
                    autoComplete="off"
                  />
                  <button 
                    onClick={() => handleAnswer(userInputValue)}
                    disabled={!userInputValue.trim() || timeLeft === 0}
                    className="absolute right-2 top-2 bottom-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl px-4 transition-colors"
                  >
                    <Send size={20} />
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid gap-3 w-full mt-2">
                {options.map((option) => (
                  <button
                    key={option}
                    onClick={() => handleAnswer(option)}
                    disabled={timeLeft === 0}
                    className="bg-white hover:bg-blue-50 border-b-4 border-slate-200 hover:border-blue-500 text-slate-700 hover:text-blue-700 font-bold py-4 px-6 rounded-2xl text-lg transition-all active:scale-95 text-left flex justify-between items-center group"
                  >
                    {option}
                    <div className="w-6 h-6 rounded-full border-2 border-slate-200 group-hover:border-blue-500 flex items-center justify-center">
                      <div className="w-3 h-3 rounded-full bg-blue-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    </div>
                  </button>
                ))}
              </div>
            )
          )}

          {showFeedback && (
            <div className={`w-full p-5 rounded-3xl shadow-2xl animate-in fade-in slide-in-from-bottom-8 duration-300 ${isCorrect ? 'bg-green-50 border-2 border-green-200' : 'bg-red-50 border-2 border-red-200'}`}>
              <div className="text-center mb-4">
                <h3 className={`text-2xl font-black mb-1 ${isCorrect ? 'text-green-700' : 'text-red-600'}`}>
                  {isCorrect ? '¡Correcto! 🎉' : timeLeft === 0 ? '¡Tiempo Agotado! ⏳' : '¡Incorrecto! 😅'}
                </h3>
                {(!isCorrect || timeLeft === 0) && (
                  <div className="text-slate-600">
                    <p>La respuesta era:</p>
                    <p className="font-bold text-slate-900 text-xl mt-1">
                      {questionType === 'standard' ? currentPlace.capital : currentPlace.name}
                    </p>
                  </div>
                )}
              </div>
              
              {isCorrect && (
                <div className="mb-4 bg-white p-3 rounded-2xl shadow-sm border border-slate-100">
                  <div className="relative w-full h-48 rounded-xl overflow-hidden mb-3 bg-slate-200">
                    <img 
                      src={`/img/${currentPlace.image_url}`} 
                      alt={currentPlace.name} 
                      className="object-cover w-full h-full"
                      onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x300?text=Sin+Imagen'; }}
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