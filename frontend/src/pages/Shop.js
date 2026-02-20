import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Loader2, ExternalLink, ShoppingBag } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Shop = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
    fetchProducts();
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
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
            <h1 className="text-4xl font-serif font-bold text-stone-800 mb-4">Curated Essentials</h1>
            <p className="text-stone-600 max-w-2xl mx-auto text-lg">
                High-quality tools and organizers we recommend for a thorough spring clean.
            </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {products.map(product => (
                <div key={product.id} className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-stone-100 flex flex-col group">
                    <div className="relative aspect-[4/3] overflow-hidden bg-stone-100">
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
                    </div>
                    <div className="p-6 flex flex-col flex-grow">
                        <div className="flex items-center gap-2 mb-3">
                            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded uppercase tracking-wider">
                                {product.category}
                            </span>
                        </div>
                        <h3 className="text-xl font-bold text-stone-800 mb-3 leading-tight group-hover:text-emerald-700 transition-colors">
                            {product.name}
                        </h3>
                        <p className="text-stone-600 mb-6 flex-grow text-sm leading-relaxed">
                            {product.description}
                        </p>
                        <a 
                            href={product.affiliate_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full inline-flex items-center justify-center gap-2 px-6 py-4 bg-stone-900 text-white rounded-xl font-bold hover:bg-emerald-600 transition-all shadow-sm hover:shadow-lg group-hover:translate-y-[-2px]"
                        >
                            <ShoppingBag size={18} />
                            Buy on Amazon
                            <ExternalLink size={14} className="opacity-70" />
                        </a>
                    </div>
                </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default Shop;
