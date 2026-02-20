import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Loader2, Search, Book } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Glossary = () => {
  const [terms, setTerms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchGlossary = async () => {
      try {
        const res = await axios.get(`${API}/glossary`);
        setTerms(res.data);
      } catch (error) {
        console.error('Failed to fetch glossary', error);
      } finally {
        setLoading(false);
      }
    };
    fetchGlossary();
  }, []);

  const filteredTerms = terms.filter(t => 
    t.term.toLowerCase().includes(search.toLowerCase()) || 
    t.definition.toLowerCase().includes(search.toLowerCase())
  );

  // Group by first letter
  const groupedTerms = filteredTerms.reduce((acc, term) => {
    const letter = term.term.charAt(0).toUpperCase();
    if (!acc[letter]) acc[letter] = [];
    acc[letter].push(term);
    return acc;
  }, {});

  const sortedLetters = Object.keys(groupedTerms).sort();

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-emerald-600" size={40} /></div>;

  return (
    <div className="bg-stone-50 min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
            <h1 className="text-4xl font-serif font-bold text-stone-800 mb-4">SpringZen Glossary</h1>
            <p className="text-stone-600 max-w-2xl mx-auto text-lg">
                Understand the terminology behind professional organizing and cleaning.
            </p>
        </div>

        {/* Search */}
        <div className="max-w-xl mx-auto mb-16 relative">
            <input 
                type="text" 
                placeholder="Search for a term..." 
                className="w-full pl-12 pr-6 py-4 rounded-full border border-stone-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-lg"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
            />
            <Search className="absolute left-5 top-1/2 transform -translate-y-1/2 text-stone-400" size={20} />
        </div>

        <div className="space-y-12">
            {sortedLetters.length === 0 && (
                <div className="text-center text-stone-500 py-12">No terms found matching "{search}"</div>
            )}

            {sortedLetters.map(letter => (
                <div key={letter} id={`letter-${letter}`}>
                    <div className="flex items-center gap-4 mb-6">
                        <span className="text-3xl font-serif font-bold text-emerald-600 bg-emerald-50 w-12 h-12 flex items-center justify-center rounded-xl">
                            {letter}
                        </span>
                        <div className="h-px bg-stone-200 flex-grow"></div>
                    </div>
                    <div className="grid md:grid-cols-2 gap-6">
                        {groupedTerms[letter].map(term => (
                            <div key={term.id} className="bg-white p-6 rounded-2xl shadow-sm border border-stone-100 hover:shadow-md transition-shadow">
                                <h3 className="text-xl font-bold text-stone-800 mb-2">{term.term}</h3>
                                <p className="text-stone-600 leading-relaxed text-sm">
                                    {term.definition}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default Glossary;
