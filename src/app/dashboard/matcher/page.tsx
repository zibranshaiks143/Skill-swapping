'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Zap, User as UserIcon, Loader2, Search, Users } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function MatcherPage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

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
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [...messages, userMessage] }),
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error);

      setMessages(prev => [...prev, { role: 'assistant', content: data.content }]);
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: "I'm having trouble finding matches right now. Please ensure your Gemini API key is configured." 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col space-y-4">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            Skill Matcher <Zap className="h-6 w-6 text-primary" />
          </h1>
          <p className="text-zinc-400 mt-1">AI-powered discovery for your next learning partner.</p>
        </div>
      </header>

      <div className="flex-1 glass-card rounded-3xl overflow-hidden flex flex-col">
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth"
        >
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-50">
              <Users className="h-16 w-16 text-primary" />
              <div>
                <h2 className="text-xl font-bold">Find your perfect match</h2>
                <p className="text-sm max-w-xs mx-auto">Tell me what you want to learn, and I'll help you find someone to swap skills with.</p>
              </div>
            </div>
          ) : (
            messages.map((msg, i) => (
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
            ))
          )}
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
              placeholder="e.g. Find me someone who can teach Python..."
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
              <Search size={20} />
            </button>
          </form>
          <p className="text-[10px] text-zinc-600 mt-4 text-center uppercase tracking-widest font-bold">
            SkillSwap AI • Powered by Gemini 1.5 Flash
          </p>
        </div>
      </div>
    </div>
  );
}
