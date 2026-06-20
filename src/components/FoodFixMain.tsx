import { categories, foodItems } from '../data';
import { SearchBar } from './SearchBar';
import { FoodGrid } from './FoodGrid';
import { SupportChat } from './SupportChat';
import { supabase } from '../lib/supabase';
import { LogOut, User } from 'lucide-react';

interface FoodFixMainProps {
  userEmail?: string | null;
  onSignOut?: () => void;
}

export const FoodFixMain = ({ userEmail }: FoodFixMainProps) => {
  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error('Error signing out:', err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      <nav className="bg-white border-b border-slate-100 py-4 px-8 flex justify-between items-center sticky top-0 z-10">
        <h1 className="text-2xl font-bold text-orange-500 tracking-tight">Food<span className="text-slate-800">Fix</span></h1>
        
        {/* User profile action */}
        <div className="flex items-center gap-3.5">
          {userEmail && (
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-xl">
              <User className="w-3.5 h-3.5 text-orange-500" />
              <span className="text-xs font-semibold text-slate-700 max-w-40 truncate">{userEmail}</span>
            </div>
          )}
          <button
            onClick={handleSignOut}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-red-500 bg-white hover:bg-red-50 border border-slate-200 hover:border-red-100 px-3 py-2 rounded-xl transition cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </nav>


      <header className="py-12 bg-orange-50 text-center px-4">
        <h2 className="text-4xl font-bold text-slate-900 mb-6">Hungry? We've got you covered.</h2>
        <SearchBar />
      </header>

      <main className="max-w-7xl mx-auto px-8 py-8">
        <section className="mb-12">
          <div className="flex gap-6 overflow-x-auto pb-4 justify-between">
            {categories.map(c => (
              <button key={c.id} className="flex flex-col items-center gap-2 min-w-20 bg-white p-4 rounded-2xl border border-slate-100 hover:border-orange-200 transition">
                <span className="text-3xl">{c.icon}</span>
                <span className="font-semibold text-xs text-slate-600">{c.name}</span>
              </button>
            ))}
          </div>
        </section>

        <section>
          <h3 className="text-2xl font-bold text-slate-900 mb-6">Popular near you</h3>
          <FoodGrid items={foodItems} />
        </section>
      </main>
      
      <SupportChat />
    </div>
  );
};
