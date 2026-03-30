"use client";

import { useEffect, useState, useRef } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, addDoc, deleteDoc, doc, writeBatch } from "firebase/firestore";
import Link from "next/link";

// --- TYPES ---
type Subject = { id: string; name: string };
type Topic = { id: string; name: string };
type Question = { id: string; question: string; options: string[]; correctOption: number };

export default function CurriculumPage() {
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);

  const [newSubjectName, setNewSubjectName] = useState("");
  const [newTopicName, setNewTopicName] = useState("");
  const [newQuestion, setNewQuestion] = useState({ 
    text: "", opt1: "", opt2: "", opt3: "", opt4: "", correct: 0 
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchSubjects();
  }, []);

  const fetchSubjects = async () => {
    setIsLoading(true);
    const querySnapshot = await getDocs(collection(db, "subjects"));
    setSubjects(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Subject)));
    setIsLoading(false);
  };

  const fetchTopics = async (subjectId: string) => {
    setIsLoading(true);
    const querySnapshot = await getDocs(collection(db, `subjects/${subjectId}/topics`));
    setTopics(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Topic)));
    setIsLoading(false);
  };

  const fetchQuestions = async (subjectId: string, topicId: string) => {
    setIsLoading(true);
    const querySnapshot = await getDocs(collection(db, `subjects/${subjectId}/topics/${topicId}/questions`));
    setQuestions(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Question)));
    setIsLoading(false);
  };

  const handleAddSubject = async () => {
    if (!newSubjectName) return;
    await addDoc(collection(db, "subjects"), { name: newSubjectName });
    setNewSubjectName("");
    fetchSubjects();
  };

  const handleDeleteSubject = async (id: string) => {
    if (!confirm("Are you sure? This deletes the subject and all its topics/questions.")) return;
    await deleteDoc(doc(db, "subjects", id));
    fetchSubjects();
  };

  const handleAddTopic = async () => {
    if (!newTopicName || !selectedSubject) return;
    await addDoc(collection(db, `subjects/${selectedSubject.id}/topics`), { name: newTopicName });
    setNewTopicName("");
    fetchTopics(selectedSubject.id);
  };

  const handleDeleteTopic = async (topicId: string) => {
    if (!selectedSubject || !confirm("Delete this topic and all its questions?")) return;
    await deleteDoc(doc(db, `subjects/${selectedSubject.id}/topics`, topicId));
    fetchTopics(selectedSubject.id);
  };

  const handleAddQuestion = async () => {
    if (!newQuestion.text || !newQuestion.opt1 || !selectedSubject || !selectedTopic) return;
    await addDoc(collection(db, `subjects/${selectedSubject.id}/topics/${selectedTopic.id}/questions`), {
      question: newQuestion.text,
      options: [newQuestion.opt1, newQuestion.opt2, newQuestion.opt3, newQuestion.opt4],
      correctOption: newQuestion.correct
    });
    setNewQuestion({ text: "", opt1: "", opt2: "", opt3: "", opt4: "", correct: 0 });
    fetchQuestions(selectedSubject.id, selectedTopic.id);
  };

  const handleDeleteQuestion = async (questionId: string) => {
    if (!selectedSubject || !selectedTopic) return;
    await deleteDoc(doc(db, `subjects/${selectedSubject.id}/topics/${selectedTopic.id}/questions`, questionId));
    fetchQuestions(selectedSubject.id, selectedTopic.id);
  };

  // --- BULK CSV LOGIC ---
  const parseCSVRow = (str: string) => {
    const result = [];
    let cell = '';
    let inQuotes = false;
    for (let i = 0; i < str.length; i++) {
      const char = str[i];
      if (char === '"' && str[i + 1] === '"') { cell += '"'; i++; } 
      else if (char === '"') { inQuotes = !inQuotes; } 
      else if (char === ',' && !inQuotes) { result.push(cell); cell = ''; } 
      else { cell += char; }
    }
    result.push(cell);
    return result;
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedSubject || !selectedTopic) return;

    setIsUploading(true);
    const reader = new FileReader();
    
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      const rows = text.split('\n').map(row => row.trim()).filter(row => row.length > 0);
      
      try {
        const batch = writeBatch(db);
        const questionsRef = collection(db, `subjects/${selectedSubject.id}/topics/${selectedTopic.id}/questions`);
        let addedCount = 0;

        for (let i = 1; i < rows.length; i++) {
          const cols = parseCSVRow(rows[i]).map(c => c.trim().replace(/^"|"$/g, ''));
          if (cols.length >= 6) {
            const [qText, o1, o2, o3, o4, correctIdx] = cols;
            const parsedCorrect = parseInt(correctIdx);

            if (!isNaN(parsedCorrect) && qText.length > 0) {
              const newDocRef = doc(questionsRef);
              batch.set(newDocRef, { question: qText, options: [o1, o2, o3, o4], correctOption: parsedCorrect });
              addedCount++;
            }
          }
        }

        if (addedCount > 0) {
          await batch.commit();
          alert(`Success: ${addedCount} questions injected into the matrix.`);
          fetchQuestions(selectedSubject.id, selectedTopic.id);
        } else {
          alert("Error: No valid questions found. Check your CSV format.");
        }
      } catch (error) {
        console.error("Batch inject failed", error);
        alert("System error during bulk upload.");
      } finally {
        setIsUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  // --- NEW: GENERATE & DOWNLOAD TEMPLATE ON THE FLY ---
  const handleDownloadTemplate = () => {
    const templateContent = "Question,Option0,Option1,Option2,Option3,CorrectIndex\nWhat is the capital of France?,Berlin,Madrid,Paris,Rome,2\nWhich element has the symbol O?,Gold,Oxygen,Silver,Iron,1";
    
    const blob = new Blob([templateContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "aquilon_question_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="w-full bg-white/[0.02] border border-white/[0.05] p-10 rounded-[40px] animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      <div className="flex justify-between items-end mb-10 border-b border-white/5 pb-6">
        <div>
          <h2 className="text-3xl font-black italic uppercase bg-gradient-to-b from-white to-gray-500 bg-clip-text text-transparent tracking-tighter">
            {selectedTopic ? `Questions: ${selectedTopic.name}` : selectedSubject ? `Topics: ${selectedSubject.name}` : "Curriculum Matrix"}
          </h2>
          <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-2">
            {selectedTopic ? `Subject: ${selectedSubject?.name}` : selectedSubject ? "Select a topic to manage its question bank" : "Select a subject to view its topics"}
          </p>
        </div>
        
        <div className="flex gap-4">
          {selectedTopic && <button onClick={() => setSelectedTopic(null)} className="text-[10px] tracking-widest text-gray-500 hover:text-purple-400 uppercase transition-colors">← Back to Topics</button>}
          {selectedSubject && !selectedTopic && <button onClick={() => setSelectedSubject(null)} className="text-[10px] tracking-widest text-gray-500 hover:text-purple-400 uppercase transition-colors">← Back to Subjects</button>}
          {!selectedSubject && <Link href="/admin/dashboard" className="text-[10px] tracking-widest text-gray-500 hover:text-blue-400 uppercase transition-colors">← Back to Command</Link>}
        </div>
      </div>

      {isLoading && (
        <div className="w-full h-32 flex items-center justify-center">
          <p className="text-[10px] tracking-widest text-purple-400 animate-pulse uppercase">Syncing Database...</p>
        </div>
      )}

      {/* LEVEL 1: SUBJECTS VIEW */}
      {!selectedSubject && !isLoading && (
        <div className="animate-in fade-in duration-300">
          <div className="flex gap-4 mb-8">
            <input type="text" placeholder="INITIALIZE NEW SUBJECT..." value={newSubjectName} onChange={(e) => setNewSubjectName(e.target.value)} className="flex-1 bg-transparent border-b border-white/20 px-4 py-3 text-sm text-white focus:outline-none focus:border-purple-500 font-medium placeholder:text-gray-700 transition-colors"/>
            <button onClick={handleAddSubject} className="px-8 py-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 text-[10px] font-black tracking-widest hover:bg-purple-500 hover:text-white transition-all hover:shadow-[0_0_20px_rgba(168,85,247,0.4)]">INJECT SUBJECT</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {subjects.map(sub => (
              <div key={sub.id} onClick={() => { setSelectedSubject(sub); fetchTopics(sub.id); }} className="group flex justify-between items-center p-5 border border-white/10 rounded-2xl bg-white/[0.01] hover:bg-purple-500/5 hover:border-purple-500/30 transition-all cursor-pointer">
                <span className="font-bold text-white tracking-wide">{sub.name}</span>
                <button onClick={(e) => { e.stopPropagation(); handleDeleteSubject(sub.id); }} className="text-[10px] text-gray-600 hover:text-red-400 tracking-widest uppercase transition-colors">[ PURGE ]</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* LEVEL 2: TOPICS VIEW */}
      {selectedSubject && !selectedTopic && !isLoading && (
        <div className="animate-in fade-in duration-300">
          <div className="flex gap-4 mb-8">
            <input type="text" placeholder={`NEW TOPIC IN ${selectedSubject.name.toUpperCase()}...`} value={newTopicName} onChange={(e) => setNewTopicName(e.target.value)} className="flex-1 bg-transparent border-b border-white/20 px-4 py-3 text-sm text-white focus:outline-none focus:border-purple-500 font-medium placeholder:text-gray-700 transition-colors"/>
            <button onClick={handleAddTopic} className="px-8 py-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 text-[10px] font-black tracking-widest hover:bg-purple-500 hover:text-white transition-all hover:shadow-[0_0_20px_rgba(168,85,247,0.4)]">INJECT TOPIC</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {topics.map(topic => (
              <div key={topic.id} onClick={() => { setSelectedTopic(topic); fetchQuestions(selectedSubject.id, topic.id); }} className="group flex justify-between items-center p-5 border border-white/10 rounded-2xl bg-white/[0.01] hover:bg-blue-500/5 hover:border-blue-500/30 transition-all cursor-pointer">
                <span className="font-bold text-white tracking-wide">{topic.name}</span>
                <button onClick={(e) => { e.stopPropagation(); handleDeleteTopic(topic.id); }} className="text-[10px] text-gray-600 hover:text-red-400 tracking-widest uppercase transition-colors">[ PURGE ]</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* LEVEL 3: QUESTIONS VIEW */}
      {selectedTopic && selectedSubject && !isLoading && (
        <div className="animate-in fade-in duration-300">
          
          <div className="bg-black/20 border border-white/10 p-6 rounded-3xl mb-10 flex flex-col gap-5 shadow-[inset_0_0_20px_rgba(0,0,0,0.5)] relative overflow-hidden">
            {isUploading && (
              <div className="absolute inset-0 z-10 bg-black/80 backdrop-blur-sm flex items-center justify-center">
                 <p className="text-[10px] tracking-widest text-blue-400 animate-pulse uppercase font-black">Decrypting CSV Data...</p>
              </div>
            )}
            
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
               <div className="flex items-center gap-3">
                 <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                 <span className="text-[10px] uppercase tracking-[0.3em] text-blue-400 font-black">Question Builder Protocol</span>
               </div>
               
               {/* --- THE NEW BUTTON GROUP --- */}
               <div className="flex items-center gap-3">
                 <button 
                   onClick={handleDownloadTemplate}
                   className="px-4 py-1.5 rounded-lg bg-white/5 border border-white/10 text-gray-400 text-[9px] font-black tracking-widest hover:bg-white/10 hover:text-white transition-all flex items-center gap-2"
                 >
                   <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                   GET TEMPLATE
                 </button>
                 
                 <input type="file" accept=".csv" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
                 <button 
                   onClick={() => fileInputRef.current?.click()}
                   className="px-4 py-1.5 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-[9px] font-black tracking-widest hover:bg-green-500 hover:text-white transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(34,197,94,0.1)]"
                 >
                   <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
                   BULK IMPORT (CSV)
                 </button>
               </div>
            </div>
            
            <input type="text" placeholder="ENTER QUESTION TEXT..." value={newQuestion.text} onChange={(e) => setNewQuestion({...newQuestion, text: e.target.value})} className="bg-transparent border-b border-white/20 px-4 py-2 text-sm text-white focus:outline-none focus:border-blue-500 placeholder:text-gray-700" />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-4 border-l-2 border-white/5">
              <input type="text" placeholder="Option 0" value={newQuestion.opt1} onChange={(e) => setNewQuestion({...newQuestion, opt1: e.target.value})} className="bg-transparent border-b border-white/10 px-4 py-2 text-sm text-white focus:outline-none focus:border-blue-500 placeholder:text-gray-700" />
              <input type="text" placeholder="Option 1" value={newQuestion.opt2} onChange={(e) => setNewQuestion({...newQuestion, opt2: e.target.value})} className="bg-transparent border-b border-white/10 px-4 py-2 text-sm text-white focus:outline-none focus:border-blue-500 placeholder:text-gray-700" />
              <input type="text" placeholder="Option 2" value={newQuestion.opt3} onChange={(e) => setNewQuestion({...newQuestion, opt3: e.target.value})} className="bg-transparent border-b border-white/10 px-4 py-2 text-sm text-white focus:outline-none focus:border-blue-500 placeholder:text-gray-700" />
              <input type="text" placeholder="Option 3" value={newQuestion.opt4} onChange={(e) => setNewQuestion({...newQuestion, opt4: e.target.value})} className="bg-transparent border-b border-white/10 px-4 py-2 text-sm text-white focus:outline-none focus:border-blue-500 placeholder:text-gray-700" />
            </div>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mt-4 pt-4 border-t border-white/5">
              <div className="flex items-center gap-4">
                <span className="text-[10px] uppercase tracking-widest text-gray-500">Correct Option Index [0-3]:</span>
                <input type="number" min="0" max="3" value={newQuestion.correct} onChange={(e) => setNewQuestion({...newQuestion, correct: parseInt(e.target.value)})} className="w-16 bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-center text-white focus:outline-none focus:border-green-500 focus:bg-green-500/10" />
              </div>
              <button onClick={handleAddQuestion} className="px-8 py-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-black tracking-widest hover:bg-blue-500 hover:text-white transition-all hover:shadow-[0_0_20px_rgba(59,130,246,0.4)]">
                DEPLOY QUESTION
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            {questions.map((q, idx) => (
              <div key={q.id} className="p-6 border border-white/10 rounded-2xl bg-white/[0.01] hover:border-white/20 transition-colors">
                <div className="flex justify-between items-start mb-6">
                  <span className="font-bold text-white tracking-wide text-sm">{idx + 1}. {q.question}</span>
                  <button onClick={() => handleDeleteQuestion(q.id)} className="text-gray-600 hover:text-red-400 text-[10px] tracking-widest uppercase transition-colors shrink-0 ml-4">[ PURGE ]</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-gray-400">
                  {q.options.map((opt, i) => (
                    <div key={i} className={`p-3 rounded-xl border transition-colors flex items-center gap-3 ${q.correctOption === i ? 'border-green-500/50 bg-green-500/10 text-green-300' : 'border-white/5 bg-black/20'}`}>
                      <span className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold ${q.correctOption === i ? 'bg-green-500/20 text-green-400' : 'bg-white/5 text-gray-500'}`}>{i}</span>
                      {opt}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}