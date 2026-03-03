import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Loader2, ExternalLink, ShoppingBag, Plus } from 'lucide-react';
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

const Shop = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Add Product State
  const [isAdding, setIsAdding] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: "", brand: "", category: "Organization", price_range: "$$", description: "", 
    long_description: "", image_url: "", affiliate_link: ""
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await axios.get(`${API}/products`);
      setProducts(res.data);
    } catch (error) {
      console.error('Failed to fetch products', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddProduct = async () => {
    try {
        const res = await axios.post(`${API}/products`, newProduct, { withCredentials: true });
        setProducts([...products, res.data]);
        setIsAdding(false);
        setNewProduct({ name: "", brand: "", category: "Organization", price_range: "$$", description: "", long_description: "", image_url: "", affiliate_link: "" });
        toast.success("Product added to marketplace");
    } catch (error) {
        console.error("Add failed", error);
        toast.error("Failed to add product");
    }
  };

  const handleChange = (e) => {
    setNewProduct({ ...newProduct, [e.target.name]: e.target.value });
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-emerald-600" size={40} /></div>;

  return (
    <div className="bg-stone-50 min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
            <div className="text-center md:text-left">
                <h1 className="text-4xl font-serif font-bold text-stone-800 mb-4">Marketplace</h1>
                <p className="text-stone-600 max-w-2xl text-lg">
                    Curated tools, bins, and organizers for a thorough spring clean.
                </p>
            </div>
            
            {user?.role === 'admin' && (
                <Dialog open={isAdding} onOpenChange={setIsAdding}>
                    <DialogTrigger asChild>
                        <button className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-lg transition-all hover:-translate-y-1">
                            <Plus size={20} /> Add Item
                        </button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Add New Product</DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <label>Name</label>
                                <input name="name" value={newProduct.name} onChange={handleChange} className="border p-2 rounded" placeholder="Product Name" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <label>Brand</label>
                                    <input name="brand" value={newProduct.brand} onChange={handleChange} className="border p-2 rounded" placeholder="Brand" />
                                </div>
                                <div className="grid gap-2">
                                    <label>Category</label>
                                    <input name="category" value={newProduct.category} onChange={handleChange} className="border p-2 rounded" placeholder="Category" />
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <label>Price Range</label>
                                <select name="price_range" value={newProduct.price_range} onChange={handleChange} className="border p-2 rounded">
                                    <option value="$">$</option>
                                    <option value="$$">$$</option>
                                    <option value="$$$">$$$</option>
                                </select>
                            </div>
                            <div className="grid gap-2">
                                <label>Short Description</label>
                                <textarea name="description" value={newProduct.description} onChange={handleChange} className="border p-2 rounded h-20" placeholder="Brief summary for card" />
                            </div>
                            <div className="grid gap-2">
                                <label>Long Description</label>
                                <textarea name="long_description" value={newProduct.long_description} onChange={handleChange} className="border p-2 rounded h-32" placeholder="Detailed info for page" />
                            </div>
                            <div className="grid gap-2">
                                <label>Image URL</label>
                                <input name="image_url" value={newProduct.image_url} onChange={handleChange} className="border p-2 rounded font-mono text-sm" placeholder="https://..." />
                            </div>
                            <div className="grid gap-2">
                                <label>Affiliate Link</label>
                                <input name="affiliate_link" value={newProduct.affiliate_link} onChange={handleChange} className="border p-2 rounded font-mono text-sm" placeholder="https://amazon.com/..." />
                            </div>
                        </div>
                        <DialogFooter>
                            <button onClick={() => setIsAdding(false)} className="px-4 py-2 text-stone-500 hover:text-stone-800">Cancel</button>
                            <button onClick={handleAddProduct} className="px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700">Add Product</button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {products.map(product => (
                <div key={product.id} className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-stone-100 flex flex-col group">
                    <Link to={`/products/${product.id}`} className="block relative aspect-[4/3] overflow-hidden bg-stone-100 cursor-pointer">
                        <img 
                            src={product.image_url || "https://placehold.co/600x400?text=Product"} 
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                        />
                        <div className="absolute top-4 right-4 bg-white/95 backdrop-blur shadow-sm px-3 py-1 rounded-full text-xs font-bold text-stone-800 border border-stone-100">
                            {product.price_range}
                        </div>
                        {product.brand && (
                            <div className="absolute bottom-4 left-4 bg-emerald-600/90 backdrop-blur shadow-sm px-3 py-1 rounded-full text-xs font-bold text-white">
                                {product.brand}
                            </div>
                        )}
                    </Link>
                    <div className="p-6 flex flex-col flex-grow">
                        <div className="flex items-center gap-2 mb-3">
                            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded uppercase tracking-wider">
                                {product.category}
                            </span>
                        </div>
                        <Link to={`/products/${product.id}`}>
                            <h3 className="text-xl font-bold text-stone-800 mb-3 leading-tight group-hover:text-emerald-700 transition-colors">
                                {product.name}
                            </h3>
                        </Link>
                        <p className="text-stone-600 mb-6 flex-grow text-sm leading-relaxed line-clamp-3">
                            {product.description}
                        </p>
                        
                        <div className="grid grid-cols-2 gap-3 mt-auto">
                            <Link 
                                to={`/products/${product.id}`}
                                className="inline-flex items-center justify-center gap-2 px-4 py-3 bg-stone-100 text-stone-700 rounded-xl font-bold hover:bg-stone-200 transition-colors"
                            >
                                Details
                            </Link>
                            <a 
                                href={product.affiliate_link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center justify-center gap-2 px-4 py-3 bg-stone-900 text-white rounded-xl font-bold hover:bg-emerald-600 transition-colors shadow-sm"
                            >
                                Buy <ExternalLink size={14} className="opacity-70" />
                            </a>
                        </div>
                    </div>
                </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default Shop;
