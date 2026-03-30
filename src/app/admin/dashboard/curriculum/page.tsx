"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, addDoc, deleteDoc, doc, writeBatch } from "firebase/firestore";
import Link from "next/link";

type Subject = { id: string; name: string };
type Topic = { id: string; name: string };
type Question = { id: string; question: string; options: string[]; correctOption: number };

export default function CurriculumMatrix() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  
  // --- NEW: SELECTION STATES ---
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Input States
  const [newSubjectName, setNewSubjectName] = useState("");
  const [newTopicName, setNewTopicName] = useState("");

  useEffect(() => {
    fetchSubjects();
  }, []);

  const fetchSubjects = async () => {
    setIsLoading(true);
    const snapshot = await getDocs(collection(db, "subjects"));
    setSubjects(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Subject)));
    setIsLoading(false);
  };

  const fetchTopics = async (subjectId: string) => {
    setIsLoading(true);
    const snapshot = await getDocs(collection(db, `subjects/${subjectId}/topics`));
    setTopics(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Topic)));
    setIsLoading(false);
  };

  const fetchQuestions = async (subjectId: string, topicId: string) => {
    setIsLoading(true);
    const snapshot = await getDocs(collection(db, `subjects/${subjectId}/topics/${topicId}/questions`));
    setQuestions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Question)));
    setSelectedQuestionIds([]); // Reset selections when loading new questions
    setIsLoading(false);
  };

  const handleAddSubject = async () => {
    if (!newSubjectName.trim()) return;
    await addDoc(collection(db, "subjects"), { name: newSubjectName });
    setNewSubjectName("");
    fetchSubjects();
  };

  const handleAddTopic = async () => {
    if (!newTopicName.trim() || !selectedSubject) return;
    await addDoc(collection(db, `subjects/${selectedSubject.id}/topics`), { name: newTopicName });
    setNewTopicName("");
    fetchTopics(selectedSubject.id);
  };

  // --- CSV UPLOAD LOGIC ---
  const handleCSVUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selectedSubject || !selectedTopic) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target?.result as string;
      const rows = text.split('\n').slice(1); // Skip header

      const batch = writeBatch(db);
      let count = 0;

      rows.forEach(row => {
        if (!row.trim()) return;
        const columns = row.split(',');
        if (columns.length >= 6) {
          const qRef = doc(collection(db, `subjects/${selectedSubject.id}/topics/${selectedTopic.id}/questions`));
          batch.set(qRef, {
            question: columns[0].trim(),
            options: [columns[1].trim(), columns[2].trim(), columns[3].trim(), columns[4].trim()],
            correctOption: parseInt(columns[5].trim(), 10)
          });
          count++;
        }
      });

      await batch.commit();
      alert(`Successfully injected ${count} questions into the matrix.`);
      fetchQuestions(selectedSubject.id, selectedTopic.id);
    };
    reader.readAsText(file);
    event.target.value = ''; // Reset input
  };

  // --- NEW: DELETION LOGIC ---
  const toggleSelectAll = () => {
    if (selectedQuestionIds.length === questions.length) {
      setSelectedQuestionIds([]); // Deselect all
    } else {
      setSelectedQuestionIds(questions.map(q => q.id)); // Select all
    }
  };

  const toggleSelectQuestion = (id: string) => {
    setSelectedQuestionIds(prev => 
      prev.includes(id) ? prev.filter(qId => qId !== id) : [...prev, id]
    );
  };

  const deleteSingleQuestion = async (id: string) => {
    if (!selectedSubject || !selectedTopic) return;
    if (!confirm("Delete this specific question?")) return;

    setIsDeleting(true);
    try {
      await deleteDoc(doc(db, `subjects/${selectedSubject.id}/topics/${selectedTopic.id}/questions`, id));
      setQuestions(prev => prev.filter(q => q.id !== id));
      setSelectedQuestionIds(prev => prev.filter(qId => qId !== id));
    } catch (error) {
      console.error("Deletion failed:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const deleteSelectedQuestions = async () => {
    if (!selectedSubject || !selectedTopic || selectedQuestionIds.length === 0) return;
    if (!confirm(`WARNING: You are about to permanently delete ${selectedQuestionIds.length} questions. Proceed?`)) return;

    setIsDeleting(true);
    try {
      const batch = writeBatch(db);
      
      // Queue up all selected IDs for batch deletion
      selectedQuestionIds.forEach(id => {
        const qRef = doc(db, `subjects/${selectedSubject.id}/topics/${selectedTopic.id}/questions`, id);
        batch.delete(qRef);
      });

      // Execute the purge
      await batch.commit();
      
      // Update UI
      setQuestions(prev => prev.filter(q => !selectedQuestionIds.includes(q.id)));
      setSelectedQuestionIds([]);
    } catch (error) {
      console.error("Mass deletion failed:", error);
      alert("System Error: Failed to purge selected questions.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="w-full bg-white/[0.02] border border-white/[0.05] p-10 rounded-[40px] animate-in fade-in slide-in-from-bottom-4 duration-500 text-white min-h-[80vh]">
      
      <div className="flex justify-between items-center mb-10 border-b border-white/5 pb-6">
        <div>
          <h2 className="text-3xl font-black italic uppercase bg-gradient-to-b from-white to-gray-500 bg-clip-text text-transparent tracking-tighter">
            Curriculum Matrix
          </h2>
          <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-2">
            Data Architecture & Question Injection
          </p>
        </div>
        <Link href="/admin/dashboard" className="text-[10px] tracking-widest text-gray-500 hover:text-purple-400 uppercase transition-colors">
          ← Back to Command
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* COLUMN 1: SUBJECTS */}
        <div className="bg-black/30 border border-white/10 p-6 rounded-3xl flex flex-col h-[600px]">
          <h3 className="text-[11px] uppercase tracking-[0.2em] text-gray-400 font-black mb-6">1. Subjects</h3>
          <div className="flex gap-2 mb-6">
            <input type="text" placeholder="New Subject" value={newSubjectName} onChange={(e) => setNewSubjectName(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-purple-500 transition-colors" />
            <button onClick={handleAddSubject} className="bg-purple-500/20 text-purple-400 px-4 py-2 rounded-xl text-xs font-black hover:bg-purple-500 hover:text-white transition-all">+</button>
          </div>
          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar flex flex-col gap-2">
            {subjects.map(sub => (
              <button key={sub.id} onClick={() => { setSelectedSubject(sub); fetchTopics(sub.id); setSelectedTopic(null); }} className={`p-4 rounded-2xl text-left transition-all border ${selectedSubject?.id === sub.id ? 'bg-purple-500/10 border-purple-500/50 text-white font-bold shadow-[0_0_15px_rgba(168,85,247,0.15)]' : 'bg-white/[0.02] border-white/5 text-gray-400 hover:bg-white/5 hover:border-white/20'}`}>
                {sub.name}
              </button>
            ))}
          </div>
        </div>

        {/* COLUMN 2: TOPICS */}
        <div className="bg-black/30 border border-white/10 p-6 rounded-3xl flex flex-col h-[600px]">
          <h3 className="text-[11px] uppercase tracking-[0.2em] text-gray-400 font-black mb-6">2. Topics</h3>
          {!selectedSubject ? (
            <div className="flex-1 flex items-center justify-center text-center px-4">
              <p className="text-[10px] uppercase tracking-widest text-gray-600">Select a subject to view modules</p>
            </div>
          ) : (
            <>
              <div className="flex gap-2 mb-6">
                <input type="text" placeholder="New Topic" value={newTopicName} onChange={(e) => setNewTopicName(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-purple-500 transition-colors" />
                <button onClick={handleAddTopic} className="bg-purple-500/20 text-purple-400 px-4 py-2 rounded-xl text-xs font-black hover:bg-purple-500 hover:text-white transition-all">+</button>
              </div>
              <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar flex flex-col gap-2">
                {topics.map(topic => (
                  <button key={topic.id} onClick={() => { setSelectedTopic(topic); fetchQuestions(selectedSubject.id, topic.id); }} className={`p-4 rounded-2xl text-left transition-all border ${selectedTopic?.id === topic.id ? 'bg-blue-500/10 border-blue-500/50 text-white font-bold shadow-[0_0_15px_rgba(59,130,246,0.15)]' : 'bg-white/[0.02] border-white/5 text-gray-400 hover:bg-white/5 hover:border-white/20'}`}>
                    {topic.name}
                  </button>
                ))}
                {topics.length === 0 && <p className="text-[10px] text-gray-600 uppercase tracking-widest text-center mt-4">No topics found.</p>}
              </div>
            </>
          )}
        </div>

        {/* COLUMN 3: QUESTIONS & DELETION */}
        <div className="bg-black/30 border border-white/10 p-6 rounded-3xl flex flex-col h-[600px]">
          <h3 className="text-[11px] uppercase tracking-[0.2em] text-gray-400 font-black mb-6">3. Question Nodes</h3>
          
          {!selectedTopic ? (
            <div className="flex-1 flex items-center justify-center text-center px-4">
              <p className="text-[10px] uppercase tracking-widest text-gray-600">Select a topic to manage data</p>
            </div>
          ) : (
            <>
              {/* Controls Header */}
              <div className="flex flex-col gap-3 mb-6 pb-6 border-b border-white/5">
                
                {/* File Upload */}
                <div className="relative overflow-hidden w-full">
                  <input type="file" accept=".csv" onChange={handleCSVUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                  <div className="w-full flex items-center justify-center p-3 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400 text-[10px] font-black tracking-widest uppercase hover:bg-purple-500 hover:text-white transition-all">
                    INJECT CSV DATA 
                  </div>
                </div>

                {/* --- NEW: BULK DELETE CONTROLS --- */}
                {questions.length > 0 && (
                  <div className="flex items-center justify-between mt-2 px-1">
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <div className="relative flex items-center justify-center w-4 h-4 rounded border border-gray-500 bg-black/50 group-hover:border-purple-400 transition-colors">
                        <input 
                          type="checkbox" 
                          className="absolute opacity-0 cursor-pointer w-full h-full"
                          checked={selectedQuestionIds.length === questions.length && questions.length > 0}
                          onChange={toggleSelectAll}
                        />
                        {selectedQuestionIds.length === questions.length && questions.length > 0 && (
                          <div className="w-2 h-2 bg-purple-400 rounded-sm"></div>
                        )}
                      </div>
                      <span className="text-[10px] tracking-widest text-gray-400 uppercase group-hover:text-white transition-colors">Select All</span>
                    </label>

                    {selectedQuestionIds.length > 0 && (
                      <button 
                        onClick={deleteSelectedQuestions}
                        disabled={isDeleting}
                        className="text-[10px] font-black tracking-widest text-red-400 uppercase bg-red-500/10 px-3 py-1.5 rounded-lg border border-red-500/30 hover:bg-red-500 hover:text-white transition-all disabled:opacity-50 flex items-center gap-2"
                      >
                        {isDeleting ? "PURGING..." : `DELETE (${selectedQuestionIds.length})`}
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Questions List */}
              <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar flex flex-col gap-3">
                {isLoading ? (
                  <p className="text-[10px] tracking-widest text-purple-400 animate-pulse uppercase text-center mt-4">Scanning Nodes...</p>
                ) : (
                  <>
                    {questions.map((q, idx) => {
                      const isSelected = selectedQuestionIds.includes(q.id);
                      return (
                        <div key={q.id} className={`p-4 rounded-2xl border transition-all flex items-start gap-3 ${isSelected ? 'bg-purple-500/5 border-purple-500/30' : 'bg-white/[0.02] border-white/5 hover:border-white/10'}`}>
                          
                          {/* Individual Checkbox */}
                          <label className="relative flex items-center justify-center w-4 h-4 mt-1 rounded border border-gray-600 bg-black/50 cursor-pointer shrink-0">
                            <input 
                              type="checkbox" 
                              className="absolute opacity-0 cursor-pointer w-full h-full"
                              checked={isSelected}
                              onChange={() => toggleSelectQuestion(q.id)}
                            />
                            {isSelected && <div className="w-2 h-2 bg-purple-400 rounded-sm"></div>}
                          </label>

                          <div className="flex-1 overflow-hidden">
                            <p className="text-sm font-bold text-white mb-2 leading-tight">{q.question}</p>
                            <p className="text-[9px] text-gray-500 uppercase tracking-widest truncate">
                              Ans: <span className="text-green-400 font-bold">{q.options[q.correctOption]}</span>
                            </p>
                          </div>

                          {/* Individual Delete Button */}
                          <button 
                            onClick={() => deleteSingleQuestion(q.id)}
                            disabled={isDeleting}
                            className="shrink-0 p-2 rounded-lg bg-black/40 border border-white/5 text-gray-500 hover:text-red-400 hover:border-red-500/30 hover:bg-red-500/10 transition-all disabled:opacity-50"
                            title="Delete Node"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                          </button>
                        </div>
                      );
                    })}
                    {questions.length === 0 && <p className="text-[10px] text-gray-600 uppercase tracking-widest text-center mt-4">No questions injected yet.</p>}
                  </>
                )}
              </div>
            </>
          )}
        </div>

      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(255, 255, 255, 0.02); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(168, 85, 247, 0.3); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(168, 85, 247, 0.6); }
      `}</style>
    </div>
  );
}