'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Calendar, 
  ShoppingBag, 
  Sparkles, 
  LogOut,
  Zap,
  Users,
  MessageSquare
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
  { icon: ShoppingBag, label: 'Marketplace', href: '/dashboard/marketplace' },
  { icon: MessageSquare, label: 'Inbox', href: '/dashboard/inbox' },
  { icon: Users, label: 'My Mentors', href: '/dashboard/mentors' },
  { icon: Zap, label: 'Skill Matcher', href: '/dashboard/matcher' },
  { icon: Calendar, label: 'Sessions', href: '/dashboard/scheduler' },
];


export default function Sidebar() {
  const pathname = usePathname();
  const { logout } = useAuth();

  return (
    <div className="flex flex-col h-full bg-zinc-950 border-r border-white/5 w-64 p-6 overflow-y-auto">
      <div className="flex items-center gap-3 mb-12 px-2">
        <div className="p-2 bg-primary/10 rounded-lg">
          <Zap className="h-6 w-6 text-primary" />
        </div>
        <span className="font-bold text-xl tracking-tight">SkillSwap</span>
      </div>


      <nav className="flex-1 space-y-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
                isActive 
                  ? "bg-white/5 text-white" 
                  : "text-zinc-500 hover:text-white hover:bg-white/5"
              )}
            >
              <item.icon className={cn(
                "h-5 w-5 transition-colors",
                isActive ? "text-primary" : "group-hover:text-primary"
              )} />
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <button
        onClick={logout}
        className="mt-auto flex items-center gap-3 px-4 py-3 text-zinc-500 hover:text-red-400 hover:bg-red-400/5 rounded-xl transition-all duration-200"
      >
        <LogOut className="h-5 w-5" />
        <span className="font-medium">Logout</span>
      </button>
    </div>
  );
}
