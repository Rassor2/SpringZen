import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from 'sonner';
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Planner from "./pages/Planner";
import Shop from "./pages/Shop";
import ProductDetail from "./pages/ProductDetail";
import Guides from "./pages/Guides";
import GuideDetail from "./pages/GuideDetail";
import Glossary from "./pages/Glossary";
import Trends from "./pages/Trends";
import { AuthProvider } from "./context/AuthContext";
import "@/App.css";

function App() {
  return (
    <div className="App font-sans text-stone-800">
      <BrowserRouter>
        <AuthProvider>
            <div className="min-h-screen flex flex-col bg-stone-50">
            <Navbar />
            <main className="flex-grow">
                <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/planner" element={<Planner />} />
                <Route path="/shop" element={<Shop />} />
                <Route path="/products/:id" element={<ProductDetail />} />
                <Route path="/guides" element={<Guides />} />
                <Route path="/guides/:id" element={<GuideDetail />} />
                <Route path="/glossary" element={<Glossary />} />
                <Route path="/trends" element={<Trends />} />
                </Routes>
            </main>
            
            <footer className="bg-stone-900 text-stone-400 py-12 px-6">
                <div className="max-w-7xl mx-auto grid md:grid-cols-4 gap-8">
                    <div className="col-span-1 md:col-span-2">
                        <h3 className="text-white text-lg font-serif font-bold mb-4">SpringZen</h3>
                        <p className="max-w-xs mb-6">Making spring cleaning simple, satisfying, and sustainable for everyone.</p>
                    </div>
                    <div>
                        <h4 className="text-white font-bold mb-4">Explore</h4>
                        <ul className="space-y-2">
                            <li><a href="/planner" className="hover:text-emerald-400 transition-colors">Planner</a></li>
                            <li><a href="/shop" className="hover:text-emerald-400 transition-colors">Shop</a></li>
                            <li><a href="/guides" className="hover:text-emerald-400 transition-colors">Guides</a></li>
                            <li><a href="/trends" className="hover:text-emerald-400 transition-colors">Trends</a></li>
                            <li><a href="/glossary" className="hover:text-emerald-400 transition-colors">Glossary</a></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="text-white font-bold mb-4">Contact</h4>
                        <ul className="space-y-2">
                            <li><a href="mailto:hello@springzen.app" className="hover:text-emerald-400 transition-colors">Support</a></li>
                            <li><a href="/privacy" className="hover:text-emerald-400 transition-colors">Privacy Policy</a></li>
                            <li><a href="/terms" className="hover:text-emerald-400 transition-colors">Terms of Service</a></li>
                        </ul>
                    </div>
                </div>
                <div className="max-w-7xl mx-auto mt-12 pt-8 border-t border-stone-800 text-sm text-center">
                    © 2025 SpringZen. All rights reserved.
                </div>
            </footer>
            </div>
            <Toaster position="top-center" richColors closeButton />
        </AuthProvider>
      </BrowserRouter>
    </div>
  );
}

export default App;
