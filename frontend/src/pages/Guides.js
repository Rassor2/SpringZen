import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Loader2, Calendar, User, Clock, ArrowRight, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog"
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Guides = () => {
  const { user } = useAuth();
  const [guides, setGuides] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Add Guide State
  const [isAdding, setIsAdding] = useState(false);
  const [newGuide, setNewGuide] = useState({
    title: "", subtitle: "", category: "Methodology", content: "", image_url: "", author: "SpringZen Team"
  });

  useEffect(() => {
    fetchGuides();
  }, []);

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

  const handleAddGuide = async () => {
    try {
        const res = await axios.post(`${API}/guides`, newGuide, { withCredentials: true });
        setGuides([...guides, res.data]);
        setIsAdding(false);
        setNewGuide({ title: "", subtitle: "", category: "Methodology", content: "", image_url: "", author: "SpringZen Team" });
        toast.success("Article published");
    } catch (error) {
        console.error("Add failed", error);
        toast.error("Failed to add article");
    }
  };

  const handleChange = (e) => {
    setNewGuide({ ...newGuide, [e.target.name]: e.target.value });
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-emerald-600" size={40} /></div>;

  return (
    <div className="bg-stone-50 min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
            <div className="text-center md:text-left">
                <h1 className="text-4xl font-serif font-bold text-stone-800 mb-4">Expert Guides</h1>
                <p className="text-stone-600 max-w-2xl text-lg">
                    Deep dive into proven organization philosophies.
                </p>
            </div>

            {user?.role === 'admin' && (
                <Dialog open={isAdding} onOpenChange={setIsAdding}>
                    <DialogTrigger asChild>
                        <button className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-lg transition-all hover:-translate-y-1">
                            <Plus size={20} /> New Article
                        </button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Write New Article</DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <label>Title</label>
                                <input name="title" value={newGuide.title} onChange={handleChange} className="border p-2 rounded text-lg font-bold" />
                            </div>
                            <div className="grid gap-2">
                                <label>Subtitle</label>
                                <input name="subtitle" value={newGuide.subtitle} onChange={handleChange} className="border p-2 rounded" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <label>Category</label>
                                    <input name="category" value={newGuide.category} onChange={handleChange} className="border p-2 rounded" />
                                </div>
                                <div className="grid gap-2">
                                    <label>Author</label>
                                    <input name="author" value={newGuide.author} onChange={handleChange} className="border p-2 rounded" />
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <label>Image URL</label>
                                <input name="image_url" value={newGuide.image_url} onChange={handleChange} className="border p-2 rounded font-mono text-sm" />
                            </div>
                            <div className="grid gap-2">
                                <label>Content (Markdown)</label>
                                <textarea name="content" value={newGuide.content} onChange={handleChange} className="border p-2 rounded h-64 font-mono text-sm" />
                            </div>
                        </div>
                        <DialogFooter>
                            <button onClick={() => setIsAdding(false)} className="px-4 py-2 text-stone-500 hover:text-stone-800">Cancel</button>
                            <button onClick={handleAddGuide} className="px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700">Publish</button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}
        </div>

        <div className="space-y-16">
            {guides.map((guide, index) => (
                <article key={guide.id} className="flex flex-col md:flex-row gap-8 md:gap-12 items-start group">
                    <Link to={`/guides/${guide.id}`} className="w-full md:w-5/12 aspect-[4/3] rounded-3xl overflow-hidden bg-stone-100 shadow-sm border border-stone-100 flex-shrink-0 relative cursor-pointer">
                         <img 
                            src={guide.image_url || "https://placehold.co/600x400?text=Guide"} 
                            alt={guide.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                        />
                        <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    </Link>
                    <div className="flex-grow py-2">
                        <div className="flex items-center gap-4 text-stone-400 text-xs font-medium uppercase tracking-wider mb-4">
                            <span className="flex items-center gap-1"><Calendar size={12} /> {new Date(guide.published_date).toLocaleDateString()}</span>
                            <span className="w-1 h-1 bg-stone-300 rounded-full"></span>
                            <span className="flex items-center gap-1"><User size={12} /> {guide.author}</span>
                            <span className="w-1 h-1 bg-stone-300 rounded-full"></span>
                            <span className="flex items-center gap-1"><Clock size={12} /> 5 min read</span>
                        </div>
                        <Link to={`/guides/${guide.id}`}>
                            <h2 className="text-3xl font-serif font-bold text-stone-800 mb-3 leading-tight group-hover:text-emerald-700 transition-colors cursor-pointer">
                                {guide.title}
                            </h2>
                        </Link>
                        <h3 className="text-emerald-600 font-medium text-lg mb-4">
                            {guide.subtitle}
                        </h3>
                        <div className="text-stone-600 mb-6 leading-relaxed whitespace-pre-wrap line-clamp-3">
                            {guide.content}
                        </div>
                        <Link to={`/guides/${guide.id}`} className="inline-flex items-center gap-2 text-stone-900 font-bold hover:text-emerald-600 transition-colors group/btn">
                            Read Full Article 
                            <ArrowRight size={16} className="group-hover/btn:translate-x-1 transition-transform" />
                        </Link>
                    </div>
                </article>
            ))}
        </div>
      </div>
    </div>
  );
};

export default Guides;
