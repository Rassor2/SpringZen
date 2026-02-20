import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Loader2, Calendar } from 'lucide-react';

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
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
            <h1 className="text-3xl font-serif font-bold text-stone-800 mb-4">Expert Guides & Tips</h1>
            <p className="text-stone-600 max-w-2xl mx-auto">
                Read our latest articles on home organization, cleaning hacks, and creating a peaceful environment.
            </p>
        </div>

        <div className="space-y-12">
            {guides.map((guide, index) => (
                <article key={guide.id} className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-stone-100 flex flex-col md:flex-row gap-8 items-start hover:shadow-md transition-shadow">
                    <div className="w-full md:w-1/3 aspect-[4/3] rounded-2xl overflow-hidden bg-stone-100 flex-shrink-0">
                         <img 
                            src={guide.image_url || "https://placehold.co/600x400?text=Guide"} 
                            alt={guide.title}
                            className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                        />
                    </div>
                    <div className="flex-grow">
                        <div className="flex items-center gap-2 text-stone-400 text-sm mb-3">
                            <Calendar size={14} />
                            <span>{new Date(guide.published_date).toLocaleDateString()}</span>
                            <span>•</span>
                            <span>{guide.author}</span>
                        </div>
                        <h2 className="text-2xl font-bold text-stone-800 mb-3 font-serif">
                            {guide.title}
                        </h2>
                        <h3 className="text-emerald-700 font-medium mb-4">
                            {guide.subtitle}
                        </h3>
                        <p className="text-stone-600 mb-6 line-clamp-3 leading-relaxed">
                            {guide.content}
                        </p>
                        <button className="text-emerald-600 font-bold hover:text-emerald-800 hover:underline">
                            Read Full Article
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
