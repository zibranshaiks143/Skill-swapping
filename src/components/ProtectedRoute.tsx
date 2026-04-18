'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { useEffect } from 'react';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;

    const updatePresence = async () => {
      try {
        await setDoc(doc(db, 'user_status', user.uid), {
          lastActive: new Date().toISOString(),
          isOnline: true
        }, { merge: true });
      } catch (e) {
        console.error('Presence error', e);
      }
    };

    updatePresence();
    const interval = setInterval(updatePresence, 60000);

    const handleUnload = () => {
      // Best effort offline status
      setDoc(doc(db, 'user_status', user.uid), {
        lastActive: new Date().toISOString(),
        isOnline: false
      }, { merge: true });
    };

    window.addEventListener('beforeunload', handleUnload);

    return () => {
      clearInterval(interval);
      window.removeEventListener('beforeunload', handleUnload);
      handleUnload();
    };
  }, [user]);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return <>{children}</>;
}
