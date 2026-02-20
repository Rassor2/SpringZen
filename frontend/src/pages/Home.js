import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Sparkles, ShoppingBag, Star } from 'lucide-react';

const Home = () => {
  return (
    <div className="bg-stone-50 min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-emerald-900 to-teal-900 text-white min-h-[90vh] flex items-center">
        <div className="absolute inset-0 opacity-20">
            {/* Abstract background pattern */}
            <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-emerald-400 rounded-full blur-[150px] opacity-20 -translate-y-1/2 translate-x-1/2"></div>
            <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-teal-500 rounded-full blur-[150px] opacity-20 translate-y-1/3 -translate-x-1/3"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="text-left animate-fade-in-up">
                <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/20 mb-8">
                    <Star size={14} className="text-yellow-300 fill-yellow-300" />
                    <span className="text-sm font-medium text-emerald-50">Spring 2025 Collection is here</span>
                </div>
                <h1 className="text-5xl md:text-7xl font-serif font-bold mb-8 leading-tight tracking-tight">
                  Reclaim Your Space, <br/> 
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-200 to-teal-200">
                    Refresh Your Mind.
                  </span>
                </h1>
                <p className="text-xl text-emerald-50/80 mb-12 leading-relaxed max-w-lg">
                  Your ultimate companion for the Spring Cleaning season. 
                  Organize your home, discover curated products, and follow expert guides.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link to="/planner" className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-emerald-950 rounded-full font-bold hover:bg-emerald-50 transition-all shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:shadow-[0_0_30px_rgba(255,255,255,0.5)] transform hover:-translate-y-1">
                    Start Decluttering <ArrowRight size={20} />
                  </Link>
                  <Link to="/shop" className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-full font-bold hover:bg-white/20 transition-all">
                    Browse Shop
                  </Link>
                </div>
            </div>
            
            <div className="hidden md:block relative">
                <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/20 to-teal-500/20 rounded-full blur-3xl"></div>
                 {/* Placeholder for a hero illustration or just abstract shapes */}
                 <div className="grid grid-cols-2 gap-4 relative z-10">
                    <div className="space-y-4 pt-12">
                        <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-6 rounded-3xl h-64 w-full animate-float-slow"></div>
                        <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-6 rounded-3xl h-48 w-full"></div>
                    </div>
                    <div className="space-y-4">
                        <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-6 rounded-3xl h-48 w-full"></div>
                        <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-6 rounded-3xl h-64 w-full animate-float-medium"></div>
                    </div>
                 </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center mb-20">
          <h2 className="text-4xl font-serif font-bold text-stone-900 mb-6">Everything you need for a fresh start</h2>
          <p className="text-stone-500 max-w-2xl mx-auto text-lg">
            We've gathered the best tools and resources to make your spring cleaning journey satisfying and effective.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Feature 1 */}
          <div className="bg-white p-10 rounded-[2rem] shadow-xl shadow-stone-200/50 border border-stone-100 hover:shadow-2xl hover:shadow-emerald-900/5 transition-all duration-500 hover:-translate-y-2 group">
            <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 mb-8 group-hover:scale-110 transition-transform duration-500">
              <CheckCircle2 size={28} />
            </div>
            <h3 className="text-2xl font-bold text-stone-900 mb-4">Smart Planner</h3>
            <p className="text-stone-500 mb-8 leading-relaxed">
              Interactive checklists categorized by room. Track your progress and celebrate small wins.
            </p>
            <Link to="/planner" className="text-emerald-600 font-bold hover:text-emerald-700 flex items-center gap-2 group-hover:gap-3 transition-all">
              Try the planner <ArrowRight size={18} />
            </Link>
          </div>

          {/* Feature 2 */}
          <div className="bg-white p-10 rounded-[2rem] shadow-xl shadow-stone-200/50 border border-stone-100 hover:shadow-2xl hover:shadow-teal-900/5 transition-all duration-500 hover:-translate-y-2 group">
            <div className="w-14 h-14 bg-teal-50 rounded-2xl flex items-center justify-center text-teal-600 mb-8 group-hover:scale-110 transition-transform duration-500">
              <ShoppingBag size={28} />
            </div>
            <h3 className="text-2xl font-bold text-stone-900 mb-4">Curated Essentials</h3>
            <p className="text-stone-500 mb-8 leading-relaxed">
              Hand-picked organization products and eco-friendly cleaning supplies that actually work.
            </p>
            <Link to="/shop" className="text-teal-600 font-bold hover:text-teal-700 flex items-center gap-2 group-hover:gap-3 transition-all">
              Visit Shop <ArrowRight size={18} />
            </Link>
          </div>

          {/* Feature 3 */}
          <div className="bg-white p-10 rounded-[2rem] shadow-xl shadow-stone-200/50 border border-stone-100 hover:shadow-2xl hover:shadow-lime-900/5 transition-all duration-500 hover:-translate-y-2 group">
            <div className="w-14 h-14 bg-lime-50 rounded-2xl flex items-center justify-center text-lime-600 mb-8 group-hover:scale-110 transition-transform duration-500">
              <Sparkles size={28} />
            </div>
            <h3 className="text-2xl font-bold text-stone-900 mb-4">Expert Guides</h3>
            <p className="text-stone-500 mb-8 leading-relaxed">
              From KonMari to Swedish Death Cleaning, find the method that fits your lifestyle.
            </p>
            <Link to="/guides" className="text-lime-600 font-bold hover:text-lime-700 flex items-center gap-2 group-hover:gap-3 transition-all">
              Read Articles <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>
      
      {/* Newsletter Section */}
      <section className="bg-stone-900 text-white py-24 px-4 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
        <div className="max-w-4xl mx-auto text-center relative z-10">
            <h2 className="text-4xl md:text-5xl font-serif font-bold mb-8">Join the 7-Day Challenge</h2>
            <p className="text-stone-300 mb-10 max-w-xl mx-auto text-lg">
                Sign up for our free email course. One simple task delivered to your inbox every morning for a week.
            </p>
            <form className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto" onSubmit={(e) => e.preventDefault()}>
                <input 
                    type="email" 
                    placeholder="Enter your email" 
                    className="px-6 py-4 rounded-full bg-stone-800 border border-stone-700 text-white focus:outline-none focus:border-emerald-500 flex-grow shadow-inner"
                />
                <button type="submit" className="px-8 py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-full transition-all hover:shadow-lg hover:shadow-emerald-500/20 hover:-translate-y-1">
                    Join Now
                </button>
            </form>
        </div>
      </section>
    </div>
  );
};

export default Home;
