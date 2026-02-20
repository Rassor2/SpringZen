import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, Link } from 'react-router-dom';
import { Loader2, ArrowLeft, ExternalLink, ThumbsUp, ThumbsDown, Edit } from 'lucide-react';
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

const ProductDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({});

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    try {
      const res = await axios.get(`${API}/products/${id}`);
      setProduct(res.data);
      setEditForm(res.data);
    } catch (error) {
      console.error('Failed to fetch product', error);
      toast.error("Could not load product details.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    try {
      const res = await axios.put(`${API}/products/${id}`, editForm, { withCredentials: true });
      setProduct(res.data);
      setIsEditing(false);
      toast.success("Product updated successfully!");
    } catch (error) {
      console.error("Update failed", error);
      toast.error("Failed to update product.");
    }
  };

  const handleChange = (e) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-emerald-600" size={40} /></div>;
  if (!product) return <div className="min-h-screen flex items-center justify-center">Product not found.</div>;

  return (
    <div className="bg-stone-50 min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <Link to="/shop" className="inline-flex items-center text-stone-500 hover:text-emerald-600 mb-8 transition-colors">
            <ArrowLeft size={16} className="mr-2" /> Back to Shop
        </Link>

        <div className="grid md:grid-cols-2 gap-12 bg-white rounded-3xl p-8 shadow-sm border border-stone-100">
            {/* Image Section */}
            <div className="relative aspect-square rounded-2xl overflow-hidden bg-stone-100">
                <img 
                    src={product.image_url} 
                    alt={product.name} 
                    className="w-full h-full object-cover"
                />
                 {product.brand && (
                    <div className="absolute top-4 left-4 bg-white/90 backdrop-blur shadow-sm px-4 py-1 rounded-full text-sm font-bold text-stone-800">
                        {product.brand}
                    </div>
                )}
            </div>

            {/* Details Section */}
            <div className="flex flex-col justify-center">
                <div className="flex justify-between items-start mb-4">
                    <span className="text-sm font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full uppercase tracking-wider">
                        {product.category}
                    </span>
                    {user && (
                        <Dialog open={isEditing} onOpenChange={setIsEditing}>
                            <DialogTrigger asChild>
                                <button className="p-2 text-stone-400 hover:text-stone-800 hover:bg-stone-100 rounded-full transition-colors" title="Edit Product">
                                    <Edit size={18} />
                                </button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                                <DialogHeader>
                                    <DialogTitle>Edit Product</DialogTitle>
                                </DialogHeader>
                                <div className="grid gap-4 py-4">
                                    <div className="grid gap-2">
                                        <label>Name</label>
                                        <input name="name" value={editForm.name} onChange={handleChange} className="border p-2 rounded" />
                                    </div>
                                    <div className="grid gap-2">
                                        <label>Short Description</label>
                                        <textarea name="description" value={editForm.description} onChange={handleChange} className="border p-2 rounded h-20" />
                                    </div>
                                    <div className="grid gap-2">
                                        <label>Long Description</label>
                                        <textarea name="long_description" value={editForm.long_description || ''} onChange={handleChange} className="border p-2 rounded h-32" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="grid gap-2">
                                            <label>Price Range</label>
                                            <select name="price_range" value={editForm.price_range} onChange={handleChange} className="border p-2 rounded">
                                                <option value="$">$</option>
                                                <option value="$$">$$</option>
                                                <option value="$$$">$$$</option>
                                            </select>
                                        </div>
                                        <div className="grid gap-2">
                                            <label>Brand</label>
                                            <input name="brand" value={editForm.brand} onChange={handleChange} className="border p-2 rounded" />
                                        </div>
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

                <h1 className="text-4xl font-serif font-bold text-stone-900 mb-2 leading-tight">
                    {product.name}
                </h1>
                <div className="text-2xl font-bold text-stone-500 mb-6">{product.price_range}</div>

                <p className="text-lg text-stone-600 mb-8 leading-relaxed">
                    {product.long_description || product.description}
                </p>

                {/* Pros & Cons */}
                {(product.pros?.length > 0 || product.cons?.length > 0) && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
                        {product.pros?.length > 0 && (
                            <div className="bg-emerald-50/50 p-5 rounded-xl border border-emerald-100">
                                <h3 className="font-bold text-emerald-800 mb-3 flex items-center gap-2">
                                    <ThumbsUp size={16} /> Why we love it
                                </h3>
                                <ul className="space-y-2">
                                    {product.pros.map((pro, i) => (
                                        <li key={i} className="text-sm text-stone-700 flex items-start gap-2">
                                            <span className="text-emerald-500 mt-1">•</span> {pro}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                         {product.cons?.length > 0 && (
                            <div className="bg-stone-50 p-5 rounded-xl border border-stone-200">
                                <h3 className="font-bold text-stone-600 mb-3 flex items-center gap-2">
                                    <ThumbsDown size={16} /> Considerations
                                </h3>
                                <ul className="space-y-2">
                                    {product.cons.map((con, i) => (
                                        <li key={i} className="text-sm text-stone-600 flex items-start gap-2">
                                            <span className="text-stone-400 mt-1">•</span> {con}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                )}

                <a 
                    href={product.affiliate_link}
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 bg-stone-900 text-white rounded-xl font-bold hover:bg-emerald-600 transition-all shadow-lg hover:shadow-xl hover:-translate-y-1"
                >
                    View on Amazon <ExternalLink size={18} className="opacity-70" />
                </a>
            </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
