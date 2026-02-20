import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Sparkles, ShoppingBag } from 'lucide-react';

const Home = () => {
  return (
    <div className="bg-stone-50 min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-emerald-900 text-white">
        <div className="absolute inset-0 opacity-20">
            {/* Abstract background pattern could go here */}
            <div className="absolute -top-24 -right-24 w-96 h-96 bg-emerald-400 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-teal-600 rounded-full blur-2xl"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-6xl font-serif font-bold mb-6 leading-tight">
              Reclaim Your Space, <br/> Refresh Your Mind.
            </h1>
            <p className="text-xl text-emerald-100 mb-10 leading-relaxed">
              Your ultimate companion for the Spring Cleaning season. 
              Organize your home, discover curated products, and follow expert guides.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/planner" className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-emerald-900 rounded-full font-bold hover:bg-emerald-50 transition-colors shadow-lg">
                Start Decluttering <ArrowRight size={20} />
              </Link>
              <Link to="/shop" className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-transparent border-2 border-emerald-200 text-white rounded-full font-bold hover:bg-emerald-800 transition-colors">
                Browse Shop
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-serif font-bold text-stone-800 mb-4">Everything you need for a fresh start</h2>
          <p className="text-stone-600 max-w-2xl mx-auto">
            We've gathered the best tools and resources to make your spring cleaning journey satisfying and effective.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Feature 1 */}
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-stone-100 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600 mb-6">
              <CheckCircle2 size={24} />
            </div>
            <h3 className="text-xl font-bold text-stone-800 mb-3">Smart Planner</h3>
            <p className="text-stone-600 mb-4">
              Interactive checklists categorized by room. Track your progress and celebrate small wins.
            </p>
            <Link to="/planner" className="text-emerald-600 font-medium hover:text-emerald-700 flex items-center gap-1">
              Try the planner <ArrowRight size={16} />
            </Link>
          </div>

          {/* Feature 2 */}
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-stone-100 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center text-teal-600 mb-6">
              <ShoppingBag size={24} />
            </div>
            <h3 className="text-xl font-bold text-stone-800 mb-3">Curated Essentials</h3>
            <p className="text-stone-600 mb-4">
              Hand-picked organization products and eco-friendly cleaning supplies that actually work.
            </p>
            <Link to="/shop" className="text-teal-600 font-medium hover:text-teal-700 flex items-center gap-1">
              Visit Shop <ArrowRight size={16} />
            </Link>
          </div>

          {/* Feature 3 */}
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-stone-100 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-lime-100 rounded-xl flex items-center justify-center text-lime-600 mb-6">
              <Sparkles size={24} />
            </div>
            <h3 className="text-xl font-bold text-stone-800 mb-3">Expert Guides</h3>
            <p className="text-stone-600 mb-4">
              From KonMari to Swedish Death Cleaning, find the method that fits your lifestyle.
            </p>
            <Link to="/guides" className="text-lime-600 font-medium hover:text-lime-700 flex items-center gap-1">
              Read Articles <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>
      
      {/* Newsletter Section */}
      <section className="bg-stone-900 text-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-serif font-bold mb-6">Join the 7-Day Challenge</h2>
            <p className="text-stone-300 mb-8 max-w-xl mx-auto">
                Sign up for our free email course. One simple task delivered to your inbox every morning for a week.
            </p>
            <form className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto" onSubmit={(e) => e.preventDefault()}>
                <input 
                    type="email" 
                    placeholder="Enter your email" 
                    className="px-6 py-4 rounded-full bg-stone-800 border border-stone-700 text-white focus:outline-none focus:border-emerald-500 flex-grow"
                />
                <button type="submit" className="px-8 py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-full transition-colors">
                    Join Now
                </button>
            </form>
        </div>
      </section>
    </div>
  );
};

export default Home;
