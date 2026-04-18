'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, MessageSquare, UserMinus } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, doc, deleteDoc } from 'firebase/firestore';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

export default function MentorsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [mentors, setMentors] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'follows'), where('followerId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMentors(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, [user]);

  const handleUnfollow = async (followId: string) => {
    try {
      await deleteDoc(doc(db, 'follows', followId));
    } catch (error) {
      console.error('Error unfollowing mentor:', error);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <Users className="h-8 w-8 text-primary" /> My Mentors
        </h1>
        <p className="text-zinc-400 mt-2">Manage the mentors you follow and start learning.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mentors.length === 0 ? (
          <div className="col-span-full py-20 text-center glass-card rounded-3xl">
            <p className="text-zinc-500">You are not following any mentors yet. Head to the Marketplace to find some!</p>
          </div>
        ) : (
          mentors.map((mentor) => (
            <motion.div key={mentor.id} layout className="glass-card p-6 rounded-3xl space-y-4 hover:border-primary/50 transition-all group">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                    {mentor.mentorName?.charAt(0) || 'U'}
                  </div>
                  <div>
                    <h3 className="font-bold text-white leading-tight">{mentor.mentorName}</h3>
                    <p className="text-xs text-zinc-500">Mentor</p>
                  </div>
                </div>
                <span className="px-3 py-1 bg-amber-400/10 text-amber-400 text-[10px] font-bold rounded-full uppercase">
                  {mentor.mentorLevel}
                </span>
              </div>
              <div className="py-2">
                <h4 className="text-lg font-bold text-zinc-200">Teaches {mentor.mentorSkill}</h4>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => router.push(`/dashboard/chat/${mentor.mentorId}?name=${encodeURIComponent(mentor.mentorName)}&skill=${encodeURIComponent(mentor.mentorSkill)}`)}
                  className="flex-1 py-3 bg-primary/10 hover:bg-primary text-primary hover:text-white rounded-xl transition-all font-bold flex items-center justify-center gap-2 group-hover:shadow-lg group-hover:shadow-primary/20"
                >
                  Chat & Learn <MessageSquare size={16} />
                </button>
                <button
                  onClick={() => handleUnfollow(mentor.id)}
                  className="p-3 bg-white/5 hover:bg-red-500/10 text-zinc-500 hover:text-red-500 rounded-xl transition-all flex items-center justify-center shrink-0"
                  title="Unfollow"
                >
                  <UserMinus size={20} />
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
