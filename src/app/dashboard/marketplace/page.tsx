'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, ShoppingBag, Trash2, Zap, Search, Star } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, addDoc, query, where, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { useAuth } from '@/context/AuthContext';

interface SkillRecord {
  id: string;
  name: string;
  type: 'Offer' | 'Request';
  level: string;
}

const levels = ['Beginner', 'Intermediate', 'Expert'];

export default function MarketplacePage() {
  const { user } = useAuth();
  const [records, setRecords] = useState<SkillRecord[]>([]);
  const [exploreRecords, setExploreRecords] = useState<SkillRecord[]>([]);
  const [activeTab, setActiveTab] = useState<'my' | 'explore'>('my');
  const [isAdding, setIsAdding] = useState(false);
  const [form, setForm] = useState({ name: '', type: 'Offer' as const, level: 'Intermediate' });
  const [connecting, setConnecting] = useState<string | null>(null);
  const [followingAction, setFollowingAction] = useState<string | null>(null);
  const [followingList, setFollowingList] = useState<string[]>([]);

  useEffect(() => {
    if (!user) return;

    // Query for MY skills
    const qMy = query(
      collection(db, 'skills'),
      where('userId', '==', user.uid)
    );

    const unsubscribeMy = onSnapshot(qMy, (snapshot) => {
      const skillsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as SkillRecord[];
      setRecords(skillsData);
    });

    // Query for EXPLORE skills (others)
    const qExplore = query(
      collection(db, 'skills'),
      where('type', '==', 'Offer')
    );

    const unsubscribeExplore = onSnapshot(qExplore, (snapshot) => {
      const skillsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as SkillRecord[];
      // Filter out current user's skills
      setExploreRecords(skillsData.filter(s => (s as any).userId !== user.uid));
    });

    // Query for follows
    const qFollows = query(
      collection(db, 'follows'),
      where('followerId', '==', user.uid)
    );

    const unsubscribeFollows = onSnapshot(qFollows, (snapshot) => {
      const fData = snapshot.docs.map(doc => doc.data().mentorId as string);
      setFollowingList(fData);
    });

    return () => {
      unsubscribeMy();
      unsubscribeExplore();
      unsubscribeFollows();
    };
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      await addDoc(collection(db, 'skills'), {
        ...form,
        userId: user.uid,
        userName: user.displayName || 'Anonymous User',
        userEmail: user.email,
        createdAt: new Date().toISOString()
      });
      setForm({ name: '', type: 'Offer', level: 'Intermediate' });
      setIsAdding(false);
    } catch (error) {
      console.error('Error adding skill: ', error);
    }
  };

  const handleConnect = async (mentor: any) => {
    if (!user) return;
    setConnecting(mentor.id);
    try {
      await addDoc(collection(db, 'swap_requests'), {
        requesterId: user.uid,
        requesterName: user.displayName || 'Anonymous',
        requesterEmail: user.email,
        mentorId: mentor.userId,
        mentorName: mentor.userName,
        mentorEmail: mentor.userEmail,
        skill: mentor.name,
        status: 'pending',
        createdAt: new Date().toISOString()
      });
      alert(`Request sent to ${mentor.userName}! Check your Sessions tab for updates.`);
    } catch (error) {
      console.error('Error sending request:', error);
    } finally {
      setConnecting(null);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'skills', id));
    } catch (error) {
      console.error('Error deleting skill: ', error);
    }
  };

  const handleFollow = async (mentor: any) => {
    if (!user || followingAction) return;
    setFollowingAction(mentor.userId);
    try {
      await addDoc(collection(db, 'follows'), {
        followerId: user.uid,
        mentorId: mentor.userId,
        mentorName: mentor.userName,
        mentorSkill: mentor.name,
        mentorLevel: mentor.level,
        createdAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error following:', error);
    } finally {
      setFollowingAction(null);
    }
  };

  const seedMentors = async () => {
    if (!user) return;
    const mockMentors = [
      { userId: 'mock-1', userName: 'Alex Chen', userEmail: 'alex@mock.com', name: 'React Development', type: 'Offer', level: 'Expert', createdAt: new Date().toISOString() },
      { userId: 'mock-2', userName: 'Sarah Lee', userEmail: 'sarah@mock.com', name: 'UI/UX Design', type: 'Offer', level: 'Expert', createdAt: new Date().toISOString() },
      { userId: 'mock-3', userName: 'Mike Johnson', userEmail: 'mike@mock.com', name: 'Python', type: 'Offer', level: 'Intermediate', createdAt: new Date().toISOString() }
    ];
    for (const mentor of mockMentors) {
      await addDoc(collection(db, 'skills'), mentor);
    }
    alert('Mock Mentors seeded!');
  };

  const offers = records.filter(r => r.type === 'Offer');
  const requests = records.filter(r => r.type === 'Request');

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Skill Marketplace</h1>
          <p className="text-zinc-400 mt-2">Manage your listings or discover new mentors.</p>
        </div>
        <div className="flex gap-2 bg-zinc-900 p-1 rounded-2xl border border-white/5">
          <button
            onClick={() => setActiveTab('my')}
            className={`px-6 py-2 rounded-xl transition-all ${activeTab === 'my' ? 'bg-zinc-800 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
            My Skills
          </button>
          <button
            onClick={() => setActiveTab('explore')}
            className={`px-6 py-2 rounded-xl transition-all ${activeTab === 'explore' ? 'bg-zinc-800 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
            Explore Mentors
          </button>
        </div>
        <div className="flex gap-2">
          {activeTab === 'explore' && (
            <button
              onClick={seedMentors}
              className="px-4 py-3 bg-zinc-800 text-xs text-white rounded-xl hover:bg-zinc-700 transition-all font-medium"
            >
              Seed Data (Dev)
            </button>
          )}
          <button
            onClick={() => setIsAdding(!isAdding)}
            className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl hover:opacity-90 transition-all font-medium"
          >
            <Plus className="h-5 w-5" />
            {isAdding ? 'Cancel' : 'List a Skill'}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isAdding && activeTab === 'my' && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <form onSubmit={handleSubmit} className="glass-card p-6 rounded-3xl grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-400">Skill Name</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Python, UI Design, Cooking"
                  className="w-full bg-zinc-900/50 border border-white/20 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/50 text-white placeholder:text-zinc-500"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-400">Listing Type</label>
                <select
                  className="w-full bg-zinc-900 border border-white/20 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/50 text-white appearance-none cursor-pointer"
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value as any })}
                >
                  <option value="Offer" className="bg-zinc-900 text-white">I can Teach (Offer)</option>
                  <option value="Request" className="bg-zinc-900 text-white">I want to Learn (Request)</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-400">Proficiency Level</label>
                <div className="flex gap-2">
                  <select
                    className="flex-1 bg-zinc-900 border border-white/20 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/50 text-white appearance-none cursor-pointer"
                    value={form.level}
                    onChange={(e) => setForm({ ...form, level: e.target.value })}
                  >
                    {levels.map(l => (
                      <option key={l} value={l} className="bg-zinc-900 text-white">
                        {l}
                      </option>
                    ))}
                  </select>
                  <button type="submit" className="bg-primary hover:bg-primary/80 px-8 rounded-xl font-bold text-white transition-colors shadow-lg shadow-primary/20">
                    Post
                  </button>
                </div>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {activeTab === 'my' ? (
          <motion.div
            key="my-tab"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-8"
          >
            {/* My Offers Section */}
            <section className="space-y-4">
              <div className="flex items-center gap-2 px-2">
                <Zap className="h-5 w-5 text-amber-400" />
                <h2 className="text-xl font-bold">Skills You Offer</h2>
              </div>
              <div className="glass-card rounded-3xl overflow-hidden">
                {offers.length === 0 ? (
                  <p className="p-8 text-center text-zinc-500">You haven't listed any skills to teach yet.</p>
                ) : (
                  <div className="divide-y divide-white/5">
                    {offers.map(record => (
                      <div key={record.id} className="flex items-center justify-between p-4 hover:bg-white/5 transition-colors group">
                        <div>
                          <h3 className="font-bold text-white">{record.name}</h3>
                          <p className="text-xs text-zinc-500 uppercase tracking-tighter">{record.level}</p>
                        </div>
                        <button onClick={() => handleDelete(record.id)} className="text-zinc-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all">
                          <Trash2 size={18} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>

            {/* My Requests Section */}
            <section className="space-y-4">
              <div className="flex items-center gap-2 px-2">
                <Search className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-bold">Skills You're Learning</h2>
              </div>
              <div className="glass-card rounded-3xl overflow-hidden">
                {requests.length === 0 ? (
                  <p className="p-8 text-center text-zinc-500">Add skills you want to learn to find matches!</p>
                ) : (
                  <div className="divide-y divide-white/5">
                    {requests.map(record => (
                      <div key={record.id} className="flex items-center justify-between p-4 hover:bg-white/5 transition-colors group">
                        <div>
                          <h3 className="font-bold text-white">{record.name}</h3>
                          <p className="text-xs text-zinc-500 uppercase tracking-tighter">{record.level} Interest</p>
                        </div>
                        <button onClick={() => handleDelete(record.id)} className="text-zinc-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all">
                          <Trash2 size={18} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>
          </motion.div>
        ) : (
          <motion.div
            key="explore-tab"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            <div className="flex items-center gap-2 px-2">
              <ShoppingBag className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-bold">Discover Mentors</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {exploreRecords.length === 0 ? (
                <div className="col-span-full py-20 text-center glass-card rounded-3xl">
                  <p className="text-zinc-500">No other mentors have listed skills yet. Be the first!</p>
                </div>
              ) : (
                exploreRecords.map((mentor: any) => (
                  <motion.div
                    key={mentor.id}
                    layout
                    className="glass-card p-6 rounded-3xl space-y-4 hover:border-primary/50 transition-all group"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                          {mentor.userName?.charAt(0) || 'U'}
                        </div>
                        <div>
                          <h3 className="font-bold text-white leading-tight">{mentor.userName}</h3>
                          <p className="text-xs text-zinc-500">Mentor</p>
                        </div>
                      </div>
                      <span className="px-3 py-1 bg-amber-400/10 text-amber-400 text-[10px] font-bold rounded-full uppercase">
                        {mentor.level}
                      </span>
                    </div>
                    
                    <div className="py-2">
                      <h4 className="text-lg font-bold text-zinc-200">Teaches {mentor.name}</h4>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleConnect(mentor)}
                        disabled={connecting === mentor.id}
                        className="flex-1 py-3 bg-primary/10 hover:bg-primary text-primary hover:text-white rounded-xl transition-all font-bold flex items-center justify-center gap-2 group-hover:shadow-lg group-hover:shadow-primary/20"
                      >
                        {connecting === mentor.id ? 'Sending...' : 'Connect'}
                      </button>
                      <button
                        onClick={() => handleFollow(mentor)}
                        disabled={followingList.includes(mentor.userId) || followingAction === mentor.userId}
                        className={`flex-1 py-3 rounded-xl transition-all font-bold flex items-center justify-center gap-2 ${
                          followingList.includes(mentor.userId)
                            ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                            : 'bg-white/10 hover:bg-white/20 text-white'
                        }`}
                      >
                        {followingList.includes(mentor.userId) 
                          ? 'Following' 
                          : followingAction === mentor.userId 
                            ? '...' 
                            : 'Follow'}
                      </button>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Summary Stat */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        <div className="glass-card p-8 rounded-3xl flex items-center gap-6">
          <div className="p-4 bg-amber-400/10 rounded-2xl">
            <Star className="h-8 w-8 text-amber-400" />
          </div>
          <div>
            <p className="text-zinc-500 text-sm font-medium">Knowledge Shared</p>
            <h4 className="text-4xl font-black">{offers.length} Skills</h4>
          </div>
        </div>
        <div className="glass-card p-8 rounded-3xl flex items-center gap-6">
          <div className="p-4 bg-primary/10 rounded-2xl">
            <ShoppingBag className="h-8 w-8 text-primary" />
          </div>
          <div>
            <p className="text-zinc-500 text-sm font-medium">Personal Wishlist</p>
            <h4 className="text-4xl font-black">{requests.length} Skills</h4>
          </div>
        </div>
      </div>
    </div>
  );
}
