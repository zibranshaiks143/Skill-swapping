'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Zap, 
  ShoppingBag, 
  Users, 
  Sparkles,
  ArrowRight,
  Mail
} from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { collection, query, getDocs, where } from 'firebase/firestore';

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    skillsOffered: 0,
    skillsDesired: 0,
    totalSessions: 0,
    activeMentors: 0
  });
  const [mentors, setMentors] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;

    const fetchDashboardData = async () => {
      try {
        // Fetch Stats
        const skillsRef = collection(db, 'skills');
        const mySkillsQuery = query(skillsRef, where('userId', '==', user.uid));
        const mySkillsSnap = await getDocs(mySkillsQuery);
        
        const offersCount = mySkillsSnap.docs.filter(d => d.data().type === 'Offer').length;
        const requestsCount = mySkillsSnap.docs.filter(d => d.data().type === 'Request').length;

        const sessionsRef = collection(db, 'swap_sessions');
        const sessionsQuery = query(sessionsRef, where('userId', '==', user.uid));
        const sessionsSnap = await getDocs(sessionsQuery);
        
        const activeLearning = sessionsSnap.docs.filter(d => d.data().type === 'Learning');
        const mentorsList = activeLearning.map(d => ({
          id: d.id,
          ...d.data()
        }));

        setStats({
          skillsOffered: offersCount,
          skillsDesired: requestsCount,
          totalSessions: sessionsSnap.docs.length,
          activeMentors: activeLearning.length
        });
        
        setMentors(mentorsList);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      }
    };

    fetchDashboardData();
  }, [user]);

  const cards = [
    { label: 'Skills Offered', value: stats.skillsOffered, icon: Zap, color: 'text-amber-400', bg: 'bg-amber-400/10' },
    { label: 'Skills Learning', value: stats.skillsDesired, icon: ShoppingBag, color: 'text-primary', bg: 'bg-primary/10' },
    { label: 'Total Connections', value: stats.totalSessions, icon: Users, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
    { label: 'Active Mentors', value: stats.activeMentors, icon: Sparkles, color: 'text-purple-400', bg: 'bg-purple-400/10' },
  ];

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold text-white">Hello, {user?.displayName?.split(' ')[0]}!</h1>
        <p className="text-zinc-400 mt-2">Grow your expertise by swapping knowledge today.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card, index) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="glass-card p-6 rounded-2xl border border-white/5"
          >
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-xl ${card.bg}`}>
                <card.icon className={`h-6 w-6 ${card.color}`} />
              </div>
              <div>
                <p className="text-sm font-medium text-zinc-500">{card.label}</p>
                <p className="text-2xl font-bold text-white">{card.value}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-400" /> Your Mentors
            </h2>
            <Link href="/dashboard/scheduler" className="text-primary text-sm font-bold hover:underline">View All</Link>
          </div>
          
          <div className="space-y-4">
            {mentors.length === 0 ? (
              <div className="glass-card p-12 rounded-3xl text-center">
                <p className="text-zinc-500 italic">No mentors yet. Find someone in the Marketplace!</p>
              </div>
            ) : (
              mentors.map((mentor) => (
                <div key={mentor.id} className="glass-card p-6 rounded-3xl flex items-center justify-between group hover:border-primary/30 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center text-primary font-black text-xl">
                      {mentor.partnerName?.charAt(0) || 'M'}
                    </div>
                    <div>
                      <h4 className="font-bold text-white whitespace-nowrap">{mentor.partnerName}</h4>
                      <div className="flex items-center gap-1 text-xs text-zinc-500">
                        <Zap size={10} className="text-amber-400" /> Teaching you <span className="text-zinc-300 font-bold">{mentor.skill}</span>
                      </div>
                    </div>
                  </div>
                  <div className="hidden md:flex flex-col items-end gap-1">
                    <div className="flex items-center gap-2 text-zinc-400 text-xs">
                      <Mail size={12} /> {mentor.partnerEmail}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="space-y-6">
          <h2 className="text-xl font-bold">Quick Actions</h2>
          <div className="space-y-4">
            <Link href="/dashboard/marketplace" className="block">
              <div className="glass-card p-6 rounded-2xl flex items-center gap-4 hover:border-primary/50 transition-all group">
                <div className="p-3 bg-primary/10 rounded-xl group-hover:scale-110 transition-transform">
                  <ShoppingBag className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Marketplace</p>
                  <p className="text-xs text-zinc-500">Browse new mentors</p>
                </div>
              </div>
            </Link>
            <Link href="/dashboard/matcher" className="block">
              <div className="glass-card p-6 rounded-2xl flex items-center gap-4 hover:border-amber-400/50 transition-all group">
                <div className="p-3 bg-amber-400/10 rounded-xl group-hover:scale-110 transition-transform">
                  <Zap className="h-5 w-5 text-amber-400" />
                </div>
                <div>
                  <p className="font-medium">AI Matcher</p>
                  <p className="text-xs text-zinc-500">Get smart suggestions</p>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
