import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Loader2, Calendar, User, Clock, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Guides = () => {
  const [guides, setGuides] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGuides = async () => {
      try {
        const res = await axios.get(`${API}/guides`);
        setGuides(res.data);
      } catch (error) {
        console.error('Failed to fetch guides', error);
      } finally {
        setLoading(false);
      }
    };
    fetchGuides();
  }, []);

  if (loading) {
    return (
        <div className="min-h-screen flex items-center justify-center">
            <Loader2 className="animate-spin text-emerald-600" size={40} />
        </div>
    );
  }

  return (
    <div className="bg-stone-50 min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
            <h1 className="text-4xl font-serif font-bold text-stone-800 mb-4">Expert Guides & Methods</h1>
            <p className="text-stone-600 max-w-2xl mx-auto text-lg">
                Deep dive into proven organization philosophies and step-by-step cleaning strategies.
            </p>
        </div>

        <div className="space-y-16">
            {guides.map((guide, index) => (
                <article key={guide.id} className="flex flex-col md:flex-row gap-8 md:gap-12 items-start group">
                    <div className="w-full md:w-5/12 aspect-[4/3] rounded-3xl overflow-hidden bg-stone-100 shadow-sm border border-stone-100 flex-shrink-0 relative">
                         <img 
                            src={guide.image_url || "https://placehold.co/600x400?text=Guide"} 
                            alt={guide.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                        />
                        <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    </div>
                    <div className="flex-grow py-2">
                        <div className="flex items-center gap-4 text-stone-400 text-xs font-medium uppercase tracking-wider mb-4">
                            <span className="flex items-center gap-1"><Calendar size={12} /> {new Date(guide.published_date).toLocaleDateString()}</span>
                            <span className="w-1 h-1 bg-stone-300 rounded-full"></span>
                            <span className="flex items-center gap-1"><User size={12} /> {guide.author}</span>
                            <span className="w-1 h-1 bg-stone-300 rounded-full"></span>
                            <span className="flex items-center gap-1"><Clock size={12} /> 5 min read</span>
                        </div>
                        <h2 className="text-3xl font-serif font-bold text-stone-800 mb-3 leading-tight group-hover:text-emerald-700 transition-colors cursor-pointer">
                            {guide.title}
                        </h2>
                        <h3 className="text-emerald-600 font-medium text-lg mb-4">
                            {guide.subtitle}
                        </h3>
                        <div className="text-stone-600 mb-6 leading-relaxed whitespace-pre-wrap">
                            {guide.content.length > 300 ? guide.content.substring(0, 300) + "..." : guide.content}
                        </div>
                        <button className="inline-flex items-center gap-2 text-stone-900 font-bold hover:text-emerald-600 transition-colors group/btn">
                            Read Full Article 
                            <ArrowRight size={16} className="group-hover/btn:translate-x-1 transition-transform" />
                        </button>
                    </div>
                </article>
            ))}
        </div>
      </div>
    </div>
  );
};

export default Guides;
