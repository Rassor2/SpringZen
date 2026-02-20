import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Loader2, TrendingUp, Users, DollarSign, BarChart3, ArrowUpRight } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Trends = () => {
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await axios.get(`${API}/stats`);
        setStats(res.data);
      } catch (error) {
        console.error('Failed to fetch stats', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-emerald-600" size={40} /></div>;

  return (
    <div className="bg-stone-50 min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
            <h1 className="text-4xl font-serif font-bold text-stone-800 mb-4">Industry Trends & Insights</h1>
            <p className="text-stone-600 max-w-2xl mx-auto text-lg">
                Key data points shaping the future of home organization and cleaning in 2025.
            </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {stats.map((stat, index) => (
                <div key={stat.id} className="bg-white rounded-3xl p-8 shadow-sm border border-stone-100 relative overflow-hidden group hover:shadow-lg transition-all duration-500">
                    <div className="absolute top-0 right-0 p-32 bg-emerald-50 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 translate-x-1/2 -translate-y-1/2"></div>
                    
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-6 text-stone-400 text-xs font-bold uppercase tracking-wider">
                            <BarChart3 size={14} /> Source: {stat.source}
                        </div>
                        
                        <div className="text-5xl md:text-6xl font-bold text-stone-900 mb-4 tracking-tight">
                            {stat.value}
                        </div>
                        
                        <h3 className="text-xl font-bold text-emerald-700 mb-3">
                            {stat.label}
                        </h3>
                        
                        <p className="text-stone-600 mb-6 leading-relaxed">
                            {stat.description}
                        </p>
                        
                        <div className="flex items-center gap-2 text-xs font-medium text-stone-400 bg-stone-50 inline-flex px-3 py-1 rounded-full border border-stone-100">
                            <CalendarIcon /> Reported: {stat.year}
                        </div>
                    </div>
                </div>
            ))}
            
            {/* Callout Box */}
            <div className="bg-stone-900 rounded-3xl p-8 shadow-xl text-white flex flex-col justify-center relative overflow-hidden">
                <div className="relative z-10">
                    <h3 className="text-2xl font-serif font-bold mb-4">Why this matters?</h3>
                    <p className="text-stone-300 mb-6 leading-relaxed">
                        The shift towards decluttering isn't just a trend—it's a mental health movement. As the market grows, so does the focus on sustainable, long-term organization solutions.
                    </p>
                    <a href="/guides" className="inline-flex items-center gap-2 text-emerald-400 font-bold hover:text-emerald-300 transition-colors">
                        Read our analysis <ArrowUpRight size={18} />
                    </a>
                </div>
                 {/* Decorative */}
                 <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-emerald-600/20 rounded-full blur-2xl"></div>
            </div>
        </div>
      </div>
    </div>
  );
};

const CalendarIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
);

export default Trends;
