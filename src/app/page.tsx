'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Zap, LogIn } from 'lucide-react';

export default function LoginPage() {
  const { user, signInWithGoogle, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
    </div>
  );

  return (
    <div className="min-h-screen relative flex flex-col items-center justify-center p-4 overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-full -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent/20 rounded-full blur-[120px]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="w-full max-w-md glass-card p-8 rounded-3xl text-center"
      >
        <div className="mb-8 flex justify-center">
          <div className="p-4 bg-primary/10 rounded-2xl">
            <Zap className="h-12 w-12 text-primary" />
          </div>
        </div>

        <h1 className="text-4xl font-bold tracking-tight mb-2 text-foreground">
          SkillSwap
        </h1>
        <p className="text-zinc-400 mb-8">
          Exchange your knowledge, grow your skills, and connect with expert peers.
        </p>


        <button
          onClick={signInWithGoogle}
          className="w-full flex items-center justify-center gap-3 py-4 px-6 bg-white text-black font-semibold rounded-2xl hover:bg-zinc-200 transition-all active:scale-95 shadow-lg"
        >
          <LogIn className="h-5 w-5" />
          Continue with Google
        </button>

        <div className="mt-8 pt-8 border-t border-white/5 text-sm text-zinc-500">
          Secure. Simple. Students First.
        </div>
      </motion.div>
    </div>
  );
}
