import React, { useState, useEffect } from 'react';
import { QUIZ_QUESTIONS } from './constants';
import { QuizState, VisualMode } from './types';
import AbstractVisuals from './components/AbstractVisuals';

// Set this to false to hide the debug buttons
const SHOW_DEBUG_CONTROLS = false;

const App: React.FC = () => {
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [isAnswerConfirmed, setIsAnswerConfirmed] = useState(false);
  const [score, setScore] = useState(0);
  const [quizState, setQuizState] = useState<QuizState>(QuizState.INTRO);
  const [visualMode, setVisualMode] = useState<VisualMode>(VisualMode.IDLE);

  const currentQuestion = QUIZ_QUESTIONS[currentQuestionIdx];

  const handleStart = () => {
    setQuizState(QuizState.ACTIVE);
  };

  const handleOptionSelect = (id: string) => {
    if (isAnswerConfirmed) return;
    setSelectedOptionId(id);
  };

  const handleConfirmAnswer = () => {
    if (!selectedOptionId) return;
    setIsAnswerConfirmed(true);
    
    if (selectedOptionId === currentQuestion.correctAnswerId) {
      setScore(prev => prev + 1);
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIdx < QUIZ_QUESTIONS.length - 1) {
      setCurrentQuestionIdx(prev => prev + 1);
      setSelectedOptionId(null);
      setIsAnswerConfirmed(false);
    } else {
      setQuizState(QuizState.FINISHED);
    }
  };

  // Debug function to skip to end
  const handleDebugWin = () => {
      setScore(QUIZ_QUESTIONS.length);
      setQuizState(QuizState.FINISHED);
  };
  
  const handleDebugLose = () => {
      setScore(0);
      setQuizState(QuizState.FINISHED);
  };

  // Update visual mode based on state
  useEffect(() => {
    if (quizState === QuizState.FINISHED) {
      // 4 or 5 correct is success
      if (score >= 4) {
        setVisualMode(VisualMode.FLOWER);
      } else {
        setVisualMode(VisualMode.CLOUD);
      }
    } else {
      setVisualMode(VisualMode.IDLE);
    }
  }, [quizState, score]);

  return (
    <div className="relative w-full h-screen flex items-center justify-center p-4 md:p-8">
      {/* Background Visualization */}
      <AbstractVisuals 
        mode={VisualMode.IDLE} 
        className="fixed top-0 left-0 w-full h-full -z-10 pointer-events-none" 
      />

      {/* Main Container - Centered Single Column */}
      <div className="relative w-full max-w-3xl flex flex-col justify-center h-[90vh]">
        
          {/* Intro Card */}
          {quizState === QuizState.INTRO && (
            <div className="bg-slate-900/90 border border-slate-700 rounded-2xl p-8 shadow-2xl backdrop-blur-sm text-center relative overflow-hidden">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent mb-6">
                AI Safety Training Quiz
              </h1>
              <p className="text-slate-300 text-lg mb-8 leading-relaxed">
                Test your knowledge on AI ethics, usage, and safety protocols based on the training materials.
              </p>
              <button 
                onClick={handleStart}
                className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-full font-semibold text-lg transition-all transform hover:scale-105 shadow-lg shadow-blue-500/30"
              >
                Start Quiz
              </button>
            </div>
          )}

          {/* Active Quiz Card */}
          {quizState === QuizState.ACTIVE && (
            <div className="bg-slate-900/90 border border-slate-700 rounded-2xl p-6 md:p-8 shadow-2xl backdrop-blur-sm flex flex-col max-h-full overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <span className="text-xs font-bold tracking-widest text-slate-500 uppercase">Question {currentQuestionIdx + 1} of {QUIZ_QUESTIONS.length}</span>
                <span className="text-xs font-semibold text-emerald-500">Score: {score}</span>
              </div>

              <h2 className="text-xl md:text-2xl font-bold text-white mb-2">{currentQuestion.title}</h2>
              <p className="text-slate-300 mb-6 text-lg">{currentQuestion.text}</p>

              <div className="space-y-3 mb-6">
                {currentQuestion.options.map(option => {
                  let buttonStyle = "border-slate-700 bg-slate-800/50 hover:bg-slate-800 text-slate-200";
                  
                  if (selectedOptionId === option.id) {
                    if (isAnswerConfirmed) {
                       if (option.id === currentQuestion.correctAnswerId) {
                         buttonStyle = "border-emerald-500 bg-emerald-900/30 text-emerald-100";
                       } else {
                         buttonStyle = "border-red-500 bg-red-900/30 text-red-100";
                       }
                    } else {
                      buttonStyle = "border-blue-500 bg-blue-900/30 text-blue-100 ring-1 ring-blue-500";
                    }
                  } else if (isAnswerConfirmed && option.id === currentQuestion.correctAnswerId) {
                     // Highlight correct answer if user picked wrong
                     buttonStyle = "border-emerald-500 bg-emerald-900/30 text-emerald-100 opacity-70";
                  }

                  return (
                    <button
                      key={option.id}
                      onClick={() => handleOptionSelect(option.id)}
                      disabled={isAnswerConfirmed}
                      className={`w-full text-left p-4 rounded-xl border transition-all duration-200 ${buttonStyle}`}
                    >
                      <span className="font-bold mr-3">{option.id})</span>
                      {option.text}
                    </button>
                  );
                })}
              </div>

              {/* Action Area */}
              <div className="mt-auto pt-4 border-t border-slate-800">
                {!isAnswerConfirmed ? (
                  <button
                    onClick={handleConfirmAnswer}
                    disabled={!selectedOptionId}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition-colors"
                  >
                    Confirm Answer
                  </button>
                ) : (
                  <div className="space-y-4">
                    <div className={`p-4 rounded-lg text-sm ${selectedOptionId === currentQuestion.correctAnswerId ? 'bg-emerald-900/20 text-emerald-200 border border-emerald-900' : 'bg-red-900/20 text-red-200 border border-red-900'}`}>
                      <strong>{selectedOptionId === currentQuestion.correctAnswerId ? 'Correct!' : 'Incorrect.'}</strong> {currentQuestion.explanation}
                    </div>
                    <button
                      onClick={handleNextQuestion}
                      className="w-full py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                    >
                      {currentQuestionIdx === QUIZ_QUESTIONS.length - 1 ? 'Finish Quiz' : 'Next Question'}
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Finished Card */}
          {quizState === QuizState.FINISHED && (
             <div className="bg-slate-900/90 border border-slate-700 rounded-2xl p-8 shadow-2xl backdrop-blur-sm text-center flex flex-col items-center">
             <h1 className="text-3xl font-bold text-white mb-2">Quiz Completed!</h1>
             <div className="text-5xl font-black mb-4 bg-gradient-to-br from-white to-slate-500 bg-clip-text text-transparent">
               {score} / {QUIZ_QUESTIONS.length}
             </div>
             
             {/* Foreground Visualization Panel */}
             <div className="w-full h-64 bg-slate-900/80 rounded-xl border border-slate-600 mb-6 relative overflow-hidden shadow-inner">
                <AbstractVisuals mode={visualMode} className="w-full h-full" />
             </div>

             <p className="text-slate-300 text-lg mb-6">
               {score >= 4 
                 ? "Excellent work! You have a solid understanding of AI safety principles." 
                 : "Good effort. Review the material regarding AI bias and data privacy to improve your score."}
             </p>

             <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700 mb-6 w-full">
                <p className="text-sm text-slate-400 font-semibold text-emerald-300">
                    {score >= 4 
                     ? "Please screenshot your unique digital flower as proof of completion." 
                     : "The rain clouds above represent the need for clarity. Keep learning!"}
                </p>
             </div>
             
             <button 
               onClick={() => window.location.reload()}
               className="px-6 py-2 border border-slate-600 hover:bg-slate-800 text-slate-300 rounded-full transition-colors w-full md:w-auto"
             >
               Restart
             </button>
           </div>
          )}

        {/* Debug Buttons - positioned absolute bottom left */}
        {SHOW_DEBUG_CONTROLS && (
          <div className="absolute bottom-4 left-4 flex gap-2 z-50 opacity-30 hover:opacity-100 transition-opacity">
              <button 
                  onClick={handleDebugWin}
                  className="px-2 py-1 text-xs bg-emerald-900 border border-emerald-700 text-emerald-300 rounded hover:bg-emerald-800"
              >
                  Debug: Win
              </button>
              <button 
                  onClick={handleDebugLose}
                  className="px-2 py-1 text-xs bg-slate-800 border border-slate-700 text-slate-400 rounded hover:bg-slate-700"
              >
                  Debug: Lose
              </button>
          </div>
        )}

      </div>
    </div>
  );
};

export default App;