'use client';
import { Moon, Globe, User, LogOut, Menu } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

export const Navbar = ({ onMenuClick }: { onMenuClick: () => void }) => {
  const { authenticated, login, logout, userId } = useAuth();

  return (
    <nav className="w-full bg-slate-900 text-white border-b border-slate-800 px-4 py-3 flex justify-between items-center sticky top-0 z-50">
      <div className="flex items-center gap-4">
        <button 
          onClick={onMenuClick}
          className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
        >
          <Menu size={24} />
        </button>
        <span className="font-bold text-xl hidden sm:inline-block text-blue-400">G-Portal</span>
      </div>

      <div className="flex items-center gap-3 sm:gap-6">
        <button className="p-2 hover:bg-slate-800 rounded-full" title="Theme"><Moon size={20} /></button>
        <button className="p-2 hover:bg-slate-800 rounded-full" title="Language"><Globe size={20} /></button>
        
        {authenticated ? (
          <div className="flex items-center gap-4 border-l border-slate-700 pl-4">
            <div className="hidden md:flex flex-col items-end">
              <span className="text-xs text-slate-400">User ID</span>
              <span className="text-sm font-medium">{userId?.slice(0, 8)}...</span>
            </div>
            <button 
              onClick={logout} 
              className="p-2 bg-slate-800 hover:bg-red-900/40 text-red-400 rounded-lg transition-colors"
            >
              <LogOut size={20} />
            </button>
          </div>
        ) : (
          <button 
            onClick={login} 
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg font-medium transition-colors"
          >
            <User size={18} /> Login
          </button>
        )}
      </div>
    </nav>
  );
};