import { create } from 'zustand';

// 1. Define the "Shape" of our data (The Blueprint)
interface ExamState {
  timeLeft: number;               // Seconds remaining
  currentQuestionIndex: number;    // Which question are we looking at? (0, 1, 2...)
  userAnswers: Record<string, string>; // Stores: { "question_id": "selected_option" }
  
  // 2. Define the "Actions" (Functions to change the data)
  setTime: (seconds: number) => void;
  nextQuestion: () => void;
  prevQuestion: () => void;
  goToQuestion: (index: number) => void;
  selectOption: (questionId: string, option: string) => void;
}

// 3. Create the Store (The actual "Chef's Table")
export const useExamStore = create<ExamState>((set) => ({
  // Initial values (Starting state)
  timeLeft: 3600, 
  currentQuestionIndex: 0,
  userAnswers: {},

  // Functions to update the state
  setTime: (seconds) => set({ timeLeft: seconds }),
  
  nextQuestion: () => set((state) => ({ 
    currentQuestionIndex: state.currentQuestionIndex + 1 
  })),

  prevQuestion: () => set((state) => ({ 
    currentQuestionIndex: state.currentQuestionIndex - 1 
  })),

  goToQuestion: (index) => set({ 
    currentQuestionIndex: index 
  }),

  selectOption: (questionId, option) => set((state) => ({
    userAnswers: { 
      ...state.userAnswers, // Keep all old answers
      [questionId]: option  // Add/Update the new answer
    }
  })),
}));