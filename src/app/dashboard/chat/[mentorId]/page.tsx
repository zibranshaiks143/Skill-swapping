'use client';

import { useState, useRef, useEffect, use } from 'react';
import { motion } from 'framer-motion';
import { Send, Zap, User as UserIcon, Loader2, ArrowLeft } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function MentorChatPage({ params }: { params: Promise<{ mentorId: string }> }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mentorName = searchParams.get('name') || 'Your Mentor';
  const mentorSkill = searchParams.get('skill') || 'this skill';
  
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: `Hello! I'm ${mentorName}. Let's get started with ${mentorSkill}. What would you like to learn first?` }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // Unwrap params using `use()` in React 19 / Next JS 15+
  const resolvedParams = use(params);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/mentor-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          messages: [...messages, userMessage],
          mentorName,
          mentorSkill
        }),
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error);

      setMessages(prev => [...prev, { role: 'assistant', content: data.content }]);
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: `Sorry, I'm having trouble connecting right now. Let's resume momentarily.` 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col space-y-4">
      <header className="flex justify-between items-center bg-zinc-900/50 p-4 rounded-3xl border border-white/5">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.back()} 
            className="p-2 bg-white/5 hover:bg-white/10 rounded-xl transition-all flex items-center justify-center shrink-0"
          >
            <ArrowLeft size={20} className="text-zinc-400" />
          </button>
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xl">
              {mentorName.charAt(0)}
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">{mentorName}</h1>
              <p className="text-zinc-400 text-sm flex items-center gap-1">
                <Zap size={14} className="text-amber-400" /> Expert in {mentorSkill}
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 glass-card rounded-3xl overflow-hidden flex flex-col">
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth">
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div className={`p-2 h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${
                msg.role === 'assistant' ? 'bg-primary/20 text-primary' : 'bg-white/10 text-white'
              }`}>
                {msg.role === 'assistant' ? <Zap size={20} /> : <UserIcon size={20} />}
              </div>
              <div className={`max-w-[80%] p-4 rounded-2xl ${
                msg.role === 'assistant' 
                  ? 'bg-white/5 border border-white/5 text-zinc-100' 
                  : 'bg-primary text-white font-medium'
              }`}>
                <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
              </div>
            </motion.div>
          ))}
          {isLoading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-4">
              <div className="p-2 h-10 w-10 rounded-xl bg-primary/20 text-primary flex items-center justify-center">
                <Loader2 size={20} className="animate-spin" />
              </div>
              <div className="bg-white/5 border border-white/5 p-4 rounded-2xl">
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce" />
                  <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                  <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce [animation-delay:0.4s]" />
                </div>
              </div>
            </motion.div>
          )}
        </div>

        <div className="p-6 border-t border-white/5 bg-black/20">
          <form onSubmit={handleSubmit} className="relative">
            <input
              type="text"
              placeholder={`Ask ${mentorName} a question...`}
              className="w-full bg-zinc-900 border border-white/20 rounded-2xl py-4 pl-6 pr-16 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-white placeholder:text-zinc-500"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="absolute right-2 top-2 p-2.5 bg-primary text-white rounded-xl hover:opacity-90 disabled:opacity-50 transition-all"
            >
              <Send size={20} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
