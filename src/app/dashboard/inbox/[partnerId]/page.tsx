'use client';

import { useState, useRef, useEffect, use } from 'react';
import { motion } from 'framer-motion';
import { Send, User as UserIcon, ArrowLeft, MessageSquare } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { db } from '@/lib/firebase';
import { collection, addDoc, query, where, onSnapshot } from 'firebase/firestore';
import { useAuth } from '@/context/AuthContext';

interface ChatMessage {
  id: string;
  roomId: string;
  senderId: string;
  text: string;
  createdAt: string;
}

export default function HumanChatPage({ params }: { params: Promise<{ partnerId: string }> }) {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const partnerName = searchParams.get('name') || 'Partner';
  
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // Unwrap params using `use()` in React 19 / Next JS 15+
  const resolvedParams = use(params);
  const partnerId = resolvedParams.partnerId;

  // We sort IDs alphabetically to ensure the roomId is always consistent regardless of who initiates
  const roomId = user ? [user.uid, partnerId].sort().join('-') : '';

  useEffect(() => {
    if (!user || !roomId) return;

    const q = query(
      collection(db, 'messages'),
      where('roomId', '==', roomId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const messagesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ChatMessage));
      const sorted = messagesData.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      setMessages(sorted);
    });

    return () => unsubscribe();
  }, [user, roomId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !user || !roomId) return;

    const messageText = input;
    setInput('');

    try {
      await addDoc(collection(db, 'messages'), {
        roomId,
        senderId: user.uid,
        text: messageText,
        createdAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  if (!user) return null;

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
              {partnerName.charAt(0)}
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">{partnerName}</h1>
              <p className="text-green-500 text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" /> Live Chat
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 glass-card rounded-3xl overflow-hidden flex flex-col relative">
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center opacity-50 space-y-4">
              <MessageSquare className="h-12 w-12 text-zinc-600" />
              <p className="text-zinc-400 text-sm">Send a message to start chatting with {partnerName}</p>
            </div>
          ) : (
            messages.map((msg) => {
              const isMe = msg.senderId === user.uid;
              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-4 ${isMe ? 'flex-row-reverse' : ''}`}
                >
                  <div className={`p-2 h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${
                    isMe ? 'bg-primary/20 text-primary' : 'bg-white/10 text-white'
                  }`}>
                    <UserIcon size={20} />
                  </div>
                  <div className={`max-w-[80%] p-4 rounded-2xl ${
                    isMe
                      ? 'bg-primary text-white font-medium rounded-tr-sm' 
                      : 'bg-white/5 border border-white/5 text-zinc-100 rounded-tl-sm'
                  }`}>
                    <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                    <span className="text-[10px] opacity-50 mt-2 block w-full text-right">
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>

        <div className="p-6 border-t border-white/5 bg-black/20">
          <form onSubmit={handleSubmit} className="relative">
            <input
              type="text"
              placeholder="Message..."
              className="w-full bg-zinc-900 border border-white/20 rounded-2xl py-4 pl-6 pr-16 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-white placeholder:text-zinc-500"
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <button
              type="submit"
              disabled={!input.trim()}
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
