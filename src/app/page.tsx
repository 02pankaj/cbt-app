"use client"; // Required because we are using hooks
import { useExamStore } from "@/store/useExamStore";

export default function TestPage() {
  // Pull exactly what you need from the store
  const timeLeft = useExamStore((state) => state.timeLeft);
  const currentIndex = useExamStore((state) => state.currentQuestionIndex);
  const next = useExamStore((state) => state.nextQuestion);

  return (
    <div className="p-10">
      <h1 className="text-2xl font-bold">CBT Exam Mode</h1>
      
      <div className="mt-4 p-4 bg-blue-100 rounded">
        Timer: {Math.floor(timeLeft / 60)} minutes left
      </div>

      <div className="mt-4">
        <p>You are on Question: {currentIndex + 1}</p>
        <button 
          onClick={next}
          className="bg-black text-white px-4 py-2 rounded mt-2"
        >
          Next Question
        </button>
      </div>
    </div>
  );
}