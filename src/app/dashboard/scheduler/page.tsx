'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Users, Clock, Trash2, Zap, Check, X, Mail, MessageSquare } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, addDoc, query, where, onSnapshot, deleteDoc, doc, orderBy, updateDoc } from 'firebase/firestore';
import { useAuth } from '@/context/AuthContext';

interface SwapSession {
  id: string;
  skill: string;
  date: string;
  time: string;
  type: 'Teaching' | 'Learning';
}

interface SwapRequest {
  id: string;
  requesterId: string;
  requesterName: string;
  requesterEmail: string;
  mentorId: string;
  mentorName: string;
  mentorEmail: string;
  skill: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: string;
}

export default function SchedulerPage() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<SwapSession[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<SwapRequest[]>([]);
  const [activeTab, setActiveTab] = useState<'sessions' | 'requests'>('sessions');
  const [isAdding, setIsAdding] = useState(false);
  const [newSession, setNewSession] = useState({
    skill: '',
    date: '',
    time: '',
    type: 'Teaching' as const
  });

  useEffect(() => {
    if (!user) return;

    // Fetch My Sessions
    const qSessions = query(
      collection(db, 'swap_sessions'),
      where('userId', '==', user.uid)
    );

    const unsubscribeSessions = onSnapshot(qSessions, (snapshot) => {
      const sessionsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as SwapSession[];
      
      // Sort on client to avoid composite index requirement
      const sortedSessions = sessionsData.sort((a, b) => 
        new Date(a.date).getTime() - new Date(b.date).getTime()
      );
      
      setSessions(sortedSessions);
    });

    // Fetch Incoming Requests
    const qRequests = query(
      collection(db, 'swap_requests'),
      where('mentorId', '==', user.uid)
    );

    const unsubscribeRequests = onSnapshot(qRequests, (snapshot) => {
      const requestsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as SwapRequest[];
      setIncomingRequests(requestsData);
    });

    return () => {
      unsubscribeSessions();
      unsubscribeRequests();
    };
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      await addDoc(collection(db, 'swap_sessions'), {
        ...newSession,
        userId: user.uid,
        createdAt: new Date().toISOString()
      });
      setNewSession({ skill: '', date: '', time: '', type: 'Teaching' });
      setIsAdding(false);
    } catch (error) {
      console.error('Error adding session: ', error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'swap_sessions', id));
    } catch (error) {
      console.error('Error deleting session: ', error);
    }
  };

  const handleAcceptRequest = async (request: SwapRequest) => {
    try {
      // 1. Update request status
      await updateDoc(doc(db, 'swap_requests', request.id), {
        status: 'accepted'
      });

      // 2. Create session for Mentor (Current User) -> Teaching
      await addDoc(collection(db, 'swap_sessions'), {
        userId: user!.uid,
        skill: request.skill,
        date: new Date().toISOString().split('T')[0],
        time: 'TBD',
        type: 'Teaching',
        partnerName: request.requesterName,
        partnerEmail: request.requesterEmail,
        partnerId: request.requesterId, // <-- added for chat
        createdAt: new Date().toISOString()
      });

      // 3. Create session for Requester -> Learning
      await addDoc(collection(db, 'swap_sessions'), {
        userId: request.requesterId,
        skill: request.skill,
        date: new Date().toISOString().split('T')[0],
        time: 'TBD',
        type: 'Learning',
        partnerName: request.mentorName,
        partnerEmail: request.mentorEmail,
        partnerId: user!.uid, // <-- added for chat
        createdAt: new Date().toISOString()
      });

      alert(`Success! You are now connected with ${request.requesterName}. Check Sessions for details.`);
    } catch (error) {
      console.error('Error accepting request:', error);
    }
  };

  const handleDeclineRequest = async (id: string) => {
    try {
      await updateDoc(doc(db, 'swap_requests', id), {
        status: 'declined'
      });
    } catch (error) {
      console.error('Error declining request:', error);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Sessions & Requests</h1>
          <p className="text-zinc-400 mt-2">Manage your swap schedule and incoming mentorship requests.</p>
        </div>
        <div className="flex gap-2">
          <div className="flex bg-zinc-900 p-1 rounded-2xl border border-white/5 mr-2">
            <button
              onClick={() => setActiveTab('sessions')}
              className={`px-6 py-2 rounded-xl transition-all flex items-center gap-2 ${activeTab === 'sessions' ? 'bg-zinc-800 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              Sessions <span className="text-[10px] bg-zinc-700 px-2 py-0.5 rounded-full">{sessions.length}</span>
            </button>
            <button
              onClick={() => setActiveTab('requests')}
              className={`px-6 py-2 rounded-xl transition-all flex items-center gap-2 ${activeTab === 'requests' ? 'bg-zinc-800 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              Requests <span className="text-[10px] bg-primary px-2 py-0.5 rounded-full text-white">{incomingRequests.filter(r => r.status === 'pending').length}</span>
            </button>
          </div>
          <button
            onClick={() => setIsAdding(!isAdding)}
            className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl hover:opacity-90 transition-all font-medium"
          >
            <Plus className="h-5 w-5" />
            {isAdding ? 'Cancel' : 'Manual Entry'}
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'sessions' ? (
          <motion.div
            key="sessions-tab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {sessions.length === 0 ? (
              <div className="col-span-full py-20 text-center glass-card rounded-3xl border-dashed">
                <Users className="h-12 w-12 text-zinc-600 mx-auto mb-4" />
                <p className="text-zinc-500">No active sessions. Connect with someone in the Marketplace!</p>
              </div>
            ) : (
              sessions.map((session: any) => (
                <motion.div
                  layout
                  key={session.id}
                  className="glass-card p-6 rounded-2xl relative group border-white/5 hover:border-primary/30 transition-all"
                >
                  <button
                    onClick={() => handleDelete(session.id)}
                    className="absolute top-4 right-4 text-zinc-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                  
                  <div className="flex items-start justify-between mb-4">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      session.type === 'Teaching' ? 'bg-amber-400/10 text-amber-400' : 'bg-primary/10 text-primary'
                    }`}>
                      {session.type} Mode
                    </span>
                  </div>
                  
                  <h3 className="font-bold text-xl mb-4">{session.skill}</h3>
                  
                  {session.partnerName && (
                    <div className="bg-white/5 rounded-xl p-3 mb-4 space-y-1">
                      <p className="text-[10px] text-zinc-500 uppercase font-black">Partner</p>
                      <p className="text-white font-bold">{session.partnerName}</p>
                      <div className="flex items-center gap-2 text-primary text-xs truncate">
                        <Mail size={12} /> {session.partnerEmail}
                      </div>
                    </div>
                  )}

                  <div className="space-y-2 text-zinc-400 text-sm">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-zinc-600" />
                      {session.date} • {session.time}
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </motion.div>
        ) : (
          <motion.div
            key="requests-tab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between px-2">
              <h2 className="text-xl font-bold flex items-center gap-2">
                Incoming Requests <MessageSquare className="h-5 w-5 text-primary" />
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {incomingRequests.length === 0 ? (
                <div className="col-span-full py-20 text-center glass-card rounded-3xl">
                  <p className="text-zinc-500">You don't have any mentorship requests yet.</p>
                </div>
              ) : (
                incomingRequests.map((request) => (
                  <div key={request.id} className="glass-card p-6 rounded-3xl flex items-center justify-between border-white/5">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center text-primary font-black text-xl">
                        {request.requesterName.charAt(0)}
                      </div>
                      <div>
                        <h4 className="font-bold text-white text-lg">{request.requesterName}</h4>
                        <p className="text-zinc-500 text-sm">Wants to learn <span className="text-amber-400 font-bold">{request.skill}</span></p>
                        {request.status !== 'pending' && (
                          <span className={`inline-block mt-2 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                            request.status === 'accepted' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
                          }`}>
                            {request.status}
                          </span>
                        )}
                      </div>
                    </div>

                    {request.status === 'pending' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleDeclineRequest(request.id)}
                          className="p-3 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-xl transition-all"
                        >
                          <X size={20} />
                        </button>
                        <button
                          onClick={() => handleAcceptRequest(request)}
                          className="p-3 bg-green-500/10 text-green-500 hover:bg-green-500 hover:text-white rounded-xl transition-all"
                        >
                          <Check size={20} />
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isAdding && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <form onSubmit={handleSubmit} className="glass-card p-6 rounded-3xl grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-400">Skill</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Graphic Design"
                  className="w-full bg-zinc-900 border border-white/20 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/50 text-white placeholder:text-zinc-500"
                  value={newSession.skill}
                  onChange={(e) => setNewSession({ ...newSession, skill: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-400">Date</label>
                <input
                  required
                  type="date"
                  className="w-full bg-zinc-900 border border-white/20 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/50 text-white"
                  value={newSession.date}
                  onChange={(e) => setNewSession({ ...newSession, date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-400">Time</label>
                <input
                  required
                  type="time"
                  className="w-full bg-zinc-900 border border-white/20 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/50 text-white"
                  value={newSession.time}
                  onChange={(e) => setNewSession({ ...newSession, time: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-400">Your Role</label>
                <div className="flex gap-2">
                  <select
                    className="flex-1 bg-zinc-900 border border-white/20 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/50 text-white appearance-none cursor-pointer"
                    value={newSession.type}
                    onChange={(e) => setNewSession({ ...newSession, type: e.target.value as any })}
                  >
                    <option value="Teaching" className="bg-zinc-900 text-white">I'm Teaching</option>
                    <option value="Learning" className="bg-zinc-900 text-white">I'm Learning</option>
                  </select>
                  <button type="submit" className="bg-primary hover:bg-primary/80 px-6 rounded-xl font-bold text-white transition-colors shadow-lg shadow-primary/20">Book</button>
                </div>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
