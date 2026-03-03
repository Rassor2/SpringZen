import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, Link } from 'react-router-dom';
import { Loader2, ArrowLeft, Calendar, User, Tag, Edit } from 'lucide-react';
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
import Markdown from 'react-markdown';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const GuideDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [guide, setGuide] = useState(null);
  const [loading, setLoading] = useState(true);

  // Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({});

  useEffect(() => {
    const fetchGuide = async () => {
        try {
          const res = await axios.get(`${API}/guides/${id}`);
          setGuide(res.data);
          setEditForm(res.data);
        } catch (error) {
          console.error('Failed to fetch guide', error);
          toast.error("Could not load article.");
        } finally {
          setLoading(false);
        }
    };
    fetchGuide();
  }, [id]);

  const handleUpdate = async () => {
    try {
      const res = await axios.put(`${API}/guides/${id}`, editForm, { withCredentials: true });
      setGuide(res.data);
      setIsEditing(false);
      toast.success("Article updated successfully!");
    } catch (error) {
      console.error("Update failed", error);
      toast.error("Failed to update article.");
    }
  };

  const handleChange = (e) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-stone-50"><Loader2 className="animate-spin text-emerald-600" size={40} /></div>;
  if (!guide) return <div className="min-h-screen flex items-center justify-center bg-stone-50">Article not found.</div>;

  return (
    <div className="bg-gradient-to-br from-emerald-50/50 to-stone-50 min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <Link to="/guides" className="inline-flex items-center text-stone-500 hover:text-emerald-600 mb-8 transition-colors group">
            <ArrowLeft size={16} className="mr-2 group-hover:-translate-x-1 transition-transform" /> Back to Guides
        </Link>

        <article className="bg-white/80 backdrop-blur-sm rounded-3xl overflow-hidden shadow-xl border border-white/50 ring-1 ring-stone-900/5 transition-all">
            {/* Header Image */}
            <div className="relative aspect-video w-full bg-stone-100">
                <img 
                    src={guide.image_url} 
                    alt={guide.title} 
                    className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                <div className="absolute bottom-0 left-0 p-8 md:p-12 w-full text-white">
                     <div className="flex items-center gap-4 text-emerald-200 text-sm font-bold uppercase tracking-wider mb-4 animate-fade-in">
                        <span className="bg-emerald-600/30 backdrop-blur-md px-3 py-1 rounded-full border border-emerald-400/30 flex items-center gap-2 shadow-sm">
                             <Tag size={12} /> {guide.category}
                        </span>
                        <span className="flex items-center gap-2">
                            <Calendar size={14} /> {new Date(guide.published_date).toLocaleDateString()}
                        </span>
                    </div>
                    <h1 className="text-3xl md:text-5xl font-serif font-bold mb-4 leading-tight drop-shadow-md">
                        {guide.title}
                    </h1>
                    <p className="text-xl md:text-2xl text-stone-200 font-light max-w-2xl drop-shadow-sm">
                        {guide.subtitle}
                    </p>
                </div>
            </div>

            {/* Content Body */}
            <div className="p-8 md:p-12">
                 <div className="flex justify-between items-start mb-10 pb-8 border-b border-stone-100">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-full flex items-center justify-center text-emerald-700 font-bold shadow-inner ring-2 ring-white">
                            {guide.author.charAt(0)}
                        </div>
                        <div>
                            <div className="font-bold text-stone-800 text-lg">{guide.author}</div>
                            <div className="text-sm text-stone-500 font-medium">Editor • SpringZen</div>
                        </div>
                    </div>
                    
                    {user?.role === 'admin' && (
                        <Dialog open={isEditing} onOpenChange={setIsEditing}>
                            <DialogTrigger asChild>
                                <button className="flex items-center gap-2 px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-600 rounded-full font-medium transition-colors text-sm shadow-sm hover:shadow">
                                    <Edit size={16} /> Edit Article
                                </button>
                            </DialogTrigger>
                            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                                <DialogHeader>
                                    <DialogTitle>Edit Article</DialogTitle>
                                </DialogHeader>
                                <div className="grid gap-4 py-4">
                                    <div className="grid gap-2">
                                        <label>Title</label>
                                        <input name="title" value={editForm.title} onChange={handleChange} className="border p-2 rounded text-lg font-bold" />
                                    </div>
                                    <div className="grid gap-2">
                                        <label>Subtitle</label>
                                        <input name="subtitle" value={editForm.subtitle} onChange={handleChange} className="border p-2 rounded" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="grid gap-2">
                                            <label>Category</label>
                                            <input name="category" value={editForm.category} onChange={handleChange} className="border p-2 rounded" />
                                        </div>
                                        <div className="grid gap-2">
                                            <label>Author</label>
                                            <input name="author" value={editForm.author} onChange={handleChange} className="border p-2 rounded" />
                                        </div>
                                    </div>
                                    <div className="grid gap-2">
                                        <label>Image URL</label>
                                        <input name="image_url" value={editForm.image_url} onChange={handleChange} className="border p-2 rounded font-mono text-sm" />
                                    </div>
                                    <div className="grid gap-2">
                                        <label>Content (Markdown supported)</label>
                                        <textarea name="content" value={editForm.content} onChange={handleChange} className="border p-2 rounded h-96 font-mono text-sm" />
                                    </div>
                                </div>
                                <DialogFooter>
                                    <button onClick={() => setIsEditing(false)} className="px-4 py-2 text-stone-500 hover:text-stone-800">Cancel</button>
                                    <button onClick={handleUpdate} className="px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700">Save Changes</button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    )}
                </div>

                <div className="prose prose-lg prose-stone max-w-none prose-headings:font-serif prose-headings:font-bold prose-a:text-emerald-600 prose-img:rounded-2xl prose-img:shadow-lg prose-p:leading-relaxed">
                    <Markdown>{guide.content}</Markdown>
                </div>
            </div>
        </article>
      </div>
    </div>
  );
};

export default GuideDetail;
