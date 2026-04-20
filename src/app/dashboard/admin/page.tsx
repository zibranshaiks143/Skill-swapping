'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { collection, getDocs, limit, query, orderBy } from 'firebase/firestore';
import { Users, BookOpen, ShieldAlert, TrendingUp, Activity, Clock, CheckCircle } from 'lucide-react';

export default function AdminDashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [stats, setStats] = useState({
    skillsCount: 0,
    sessionsCount: 0,
    requestsCount: 0
  });
  
  const [recentSkills, setRecentSkills] = useState<any[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  // Security Guard: Only allow the specific Admin Email
  useEffect(() => {
    if (!loading) {
      if (!user || user.email !== 'zibranshaik02@gmail.com') {
        router.push('/dashboard');
      }
    }
  }, [user, loading, router]);

  // Fetch Live Database Metrics
  useEffect(() => {
    async function fetchStats() {
      if (!user || user.email !== 'zibranshaik02@gmail.com') return;

      try {
        // Query Collections
        const skillsSnapshot = await getDocs(collection(db, 'skills'));
        const sessionsSnapshot = await getDocs(collection(db, 'swap_sessions'));
        const requestsSnapshot = await getDocs(collection(db, 'swap_requests'));

        setStats({
          skillsCount: skillsSnapshot.size,
          sessionsCount: sessionsSnapshot.size,
          requestsCount: requestsSnapshot.size
        });

        // Pull some placeholder "recent" data from the skills board to populate the table (simulating Recent Users/Activity)
        const recentSkillsData = skillsSnapshot.docs.slice(0, 5).map(doc => ({
           id: doc.id,
           ...doc.data()
        }));
        setRecentSkills(recentSkillsData);

      } catch (error) {
        console.error("Error fetching admin stats:", error);
      } finally {
        setDataLoading(false);
      }
    }

    if (user && !loading) fetchStats();
  }, [user, loading]);

  if (loading || dataLoading) {
    return <div className="p-8 text-center text-zinc-400">Loading system data...</div>;
  }

  // Double check before rendering
  if (user?.email !== 'zibranshaik02@gmail.com') return null;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in zoom-in duration-500">
      
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            <ShieldAlert className="h-8 w-8 inline text-red-500" />
            Admin Control Panel
          </h1>
          <p className="text-zinc-400 mt-2">Elevated access: Live system-wide metrics and platform health.</p>
        </div>
        <div className="flex gap-3">
           <div className="px-5 py-2.5 bg-green-500/10 text-green-400 rounded-xl text-sm font-bold border border-green-500/20 shadow-[0_0_15px_rgba(34,197,94,0.15)] flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
            SYSTEM SECURED
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-zinc-950 border border-white/10 rounded-2xl p-6 relative overflow-hidden group">
          <BookOpen className="absolute top-0 right-0 p-6 w-24 h-24 opacity-10 transform translate-x-4 -translate-y-4 group-hover:scale-110 transition-transform" />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-xl bg-primary/20 text-primary">
                <BookOpen className="h-5 w-5" />
              </div>
              <h3 className="text-zinc-400 font-medium">Total Skills Listed</h3>
            </div>
            <p className="text-4xl font-bold text-white mb-2">{stats.skillsCount}</p>
            <div className="flex items-center gap-1.5 text-sm text-green-400"><TrendingUp className="w-4 h-4" /> Live DB Sync</div>
          </div>
        </div>

        <div className="bg-zinc-950 border border-white/10 rounded-2xl p-6 relative overflow-hidden group">
          <Activity className="absolute top-0 right-0 p-6 w-24 h-24 opacity-10 transform translate-x-4 -translate-y-4 group-hover:scale-110 transition-transform" />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-xl bg-purple-500/20 text-purple-400">
                <Activity className="h-5 w-5" />
              </div>
              <h3 className="text-zinc-400 font-medium">Active Match Requests</h3>
            </div>
            <p className="text-4xl font-bold text-white mb-2">{stats.requestsCount}</p>
            <div className="flex items-center gap-1.5 text-sm text-green-400"><TrendingUp className="w-4 h-4" /> Live DB Sync</div>
          </div>
        </div>

        <div className="bg-zinc-950 border border-white/10 rounded-2xl p-6 relative overflow-hidden group">
          <CheckCircle className="absolute top-0 right-0 p-6 w-24 h-24 opacity-10 transform translate-x-4 -translate-y-4 group-hover:scale-110 transition-transform" />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-xl bg-green-500/20 text-green-400">
                <CheckCircle className="h-5 w-5" />
              </div>
              <h3 className="text-zinc-400 font-medium">Sessions Hosted</h3>
            </div>
            <p className="text-4xl font-bold text-white mb-2">{stats.sessionsCount}</p>
            <div className="flex items-center gap-1.5 text-sm text-green-400"><TrendingUp className="w-4 h-4" /> Live DB Sync</div>
          </div>
        </div>

        <div className="bg-zinc-950 border border-white/10 rounded-2xl p-6 relative overflow-hidden group">
          <ShieldAlert className="absolute top-0 right-0 p-6 w-24 h-24 opacity-5 transform translate-x-4 -translate-y-4 group-hover:scale-110 transition-transform" />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-xl bg-red-500/20 text-red-500">
                 <ShieldAlert className="h-5 w-5" />
              </div>
              <h3 className="text-zinc-400 font-medium">Admin Guard Status</h3>
            </div>
            <p className="text-xl font-bold text-white mb-2 pt-1">{user.email}</p>
            <div className="flex items-center gap-1.5 text-sm my-1.5 text-zinc-500">Authorized Root Access</div>
          </div>
        </div>
      </div>

      {/* Recent Platform Activity Table */}
      <div className="bg-zinc-950 border border-white/10 rounded-2xl overflow-hidden mt-8">
        <div className="p-6 border-b border-white/10 flex justify-between items-center bg-zinc-900/50">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" />
            Recent Platform Activity
          </h2>
          <button className="text-sm text-primary hover:text-primary/80 font-medium">View Database</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-900/30 text-zinc-400 text-sm">
                <th className="p-4 font-medium">Expertise / Title</th>
                <th className="p-4 font-medium">Identifier</th>
                <th className="p-4 font-medium">Database Status</th>
                <th className="p-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-sm text-zinc-300">
              {recentSkills.length === 0 ? (
                <tr><td colSpan={4} className="p-8 text-center text-zinc-500">No recent activity found in database.</td></tr>
              ) : recentSkills.map((item, idx) => (
                <tr key={idx} className="hover:bg-white/5 transition-colors">
                  <td className="p-4 font-medium text-white flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs">
                      {item.title ? item.title.charAt(0) : '?'}
                    </div>
                    {item.title || "User Listing"}
                  </td>
                  <td className="p-4 font-mono text-xs text-zinc-500">{item.id}</td>
                  <td className="p-4">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-400 border border-green-500/20">
                      <CheckCircle className="w-3 h-3" />
                      Active Record
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <button className="text-xs px-3 py-1.5 bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded-md transition-colors">Force Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
