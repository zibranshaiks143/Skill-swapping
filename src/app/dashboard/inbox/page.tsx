'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Users } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, addDoc } from 'firebase/firestore';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

export default function InboxPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [partners, setPartners] = useState<any[]>([]);
  const [onlineStatuses, setOnlineStatuses] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'user_status'), (snapshot) => {
      const statuses: Record<string, boolean> = {};
      const now = new Date().getTime();
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.isOnline) {
          const lastActive = new Date(data.lastActive).getTime();
          // Consider online if active within last 2 minutes
          if (now - lastActive < 120000) {
            statuses[doc.id] = true;
          }
        }
      });
      setOnlineStatuses(statuses);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'swap_sessions'), where('userId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      // Find all unique partners
      const uniqueMap = new Map();
      snapshot.docs.forEach((doc) => {
        const data = doc.data();
        if (data.partnerId && !uniqueMap.has(data.partnerId)) {
          uniqueMap.set(data.partnerId, {
            partnerId: data.partnerId,
            partnerName: data.partnerName,
            partnerEmail: data.partnerEmail
          });
        }
      });
      setPartners(Array.from(uniqueMap.values()));
    });
    return () => unsubscribe();
  }, [user]);

  const seedMockChat = async () => {
    if (!user) return;
    try {
      await addDoc(collection(db, 'swap_sessions'), {
        userId: user.uid,
        partnerId: 'human-user-1234',
        partnerName: 'Jonathan Doe',
        partnerEmail: 'jonathan@realhuman.com',
        skill: 'Next.js Routing',
        date: new Date().toISOString().split('T')[0],
        time: '14:00',
        type: 'Teaching',
        createdAt: new Date().toISOString()
      });
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <MessageSquare className="h-8 w-8 text-primary" /> Inbox
          </h1>
          <p className="text-zinc-400 mt-2">Chat directly with the humans you are swapping skills with.</p>
        </div>
        <button
          onClick={seedMockChat}
          className="px-4 py-2 bg-zinc-800 text-xs text-white rounded-xl hover:bg-zinc-700 transition-all font-medium"
        >
          Seed Fake Partner (Dev)
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {partners.length === 0 ? (
          <div className="col-span-full py-20 text-center glass-card rounded-3xl border border-white/5 border-dashed">
            <Users className="h-12 w-12 text-zinc-600 mx-auto mb-4" />
            <p className="text-zinc-500">You don't have any human partners yet.<br/>Accept a session request in your 'Sessions' tab to start chatting!</p>
          </div>
        ) : (
          partners.map((partner) => (
            <motion.div key={partner.partnerId} layout className="glass-card p-6 rounded-3xl space-y-4 hover:border-primary/50 transition-all group">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xl">
                    {partner.partnerName?.charAt(0) || 'U'}
                  </div>
                  {onlineStatuses[partner.partnerId] && (
                    <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-zinc-950 rounded-full"></span>
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-white text-lg">{partner.partnerName}</h3>
                  <p className="text-xs text-zinc-500 flex items-center gap-2">
                    {partner.partnerEmail}
                    {onlineStatuses[partner.partnerId] && (
                      <span className="text-[10px] text-green-500 tracking-wider">ONLINE</span>
                    )}
                  </p>
                </div>
              </div>
              
              <button
                onClick={() => router.push(`/dashboard/inbox/${partner.partnerId}?name=${encodeURIComponent(partner.partnerName)}`)}
                className="w-full py-3 bg-primary/10 hover:bg-primary text-primary hover:text-white rounded-xl transition-all font-bold flex items-center justify-center gap-2 group-hover:shadow-lg group-hover:shadow-primary/20"
              >
                Open Chat <MessageSquare size={16} />
              </button>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
