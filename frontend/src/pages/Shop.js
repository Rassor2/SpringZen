import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Loader2, ExternalLink } from 'lucide-react';

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
        <div className="text-center mb-12">
            <h1 className="text-3xl font-serif font-bold text-stone-800 mb-4">Curated for Your Home</h1>
            <p className="text-stone-600 max-w-2xl mx-auto">
                Discover our favorite tools, bins, and organizers to help you create a space you love.
            </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {products.map(product => (
                <div key={product.id} className="bg-white rounded-2xl shadow-sm overflow-hidden border border-stone-100 hover:shadow-md transition-shadow flex flex-col h-full">
                    <div className="aspect-w-16 aspect-h-9 bg-stone-100 relative h-64 overflow-hidden group">
                        <img 
                            src={product.image_url || "https://placehold.co/600x400?text=Product"} 
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-stone-800 shadow-sm">
                            {product.price_range}
                        </div>
                    </div>
                    <div className="p-6 flex flex-col flex-grow">
                        <div className="text-xs font-medium text-emerald-600 mb-2 uppercase tracking-wide">
                            {product.category}
                        </div>
                        <h3 className="text-xl font-bold text-stone-800 mb-2">{product.name}</h3>
                        <p className="text-stone-600 mb-6 flex-grow text-sm leading-relaxed">
                            {product.description}
                        </p>
                        <a 
                            href={product.affiliate_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-stone-900 text-white rounded-xl font-medium hover:bg-stone-800 transition-colors"
                        >
                            View Details <ExternalLink size={16} />
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
