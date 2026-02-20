import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
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
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import Contact from "./pages/Contact";
import AdminEmails from "./pages/AdminEmails";
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
                
                {/* Legal & Contact */}
                <Route path="/privacy" element={<PrivacyPolicy />} />
                <Route path="/terms" element={<TermsOfService />} />
                <Route path="/contact" element={<Contact />} />
                
                {/* Admin */}
                <Route path="/admin/emails" element={<AdminEmails />} />
                </Routes>
            </main>
            
            <footer className="bg-stone-900 text-stone-400 py-16 px-6 relative z-10">
                <div className="max-w-7xl mx-auto grid md:grid-cols-4 gap-12">
                    <div className="col-span-1 md:col-span-2">
                        <h3 className="text-white text-2xl font-serif font-bold mb-6 flex items-center gap-2">
                            SpringZen
                        </h3>
                        <p className="max-w-xs mb-8 leading-relaxed">
                            Making spring cleaning simple, satisfying, and sustainable for everyone. 
                            Reclaim your space today.
                        </p>
                    </div>
                    <div>
                        <h4 className="text-white font-bold mb-6 text-sm uppercase tracking-wider">Explore</h4>
                        <ul className="space-y-4">
                            <li><Link to="/planner" className="hover:text-emerald-400 transition-colors">Planner</Link></li>
                            <li><Link to="/shop" className="hover:text-emerald-400 transition-colors">Shop</Link></li>
                            <li><Link to="/guides" className="hover:text-emerald-400 transition-colors">Guides</Link></li>
                            <li><Link to="/trends" className="hover:text-emerald-400 transition-colors">Trends</Link></li>
                            <li><Link to="/glossary" className="hover:text-emerald-400 transition-colors">Glossary</Link></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="text-white font-bold mb-6 text-sm uppercase tracking-wider">Support</h4>
                        <ul className="space-y-4">
                            <li><Link to="/contact" className="hover:text-emerald-400 transition-colors">Contact Us</Link></li>
                            <li><Link to="/privacy" className="hover:text-emerald-400 transition-colors">Privacy Policy</Link></li>
                            <li><Link to="/terms" className="hover:text-emerald-400 transition-colors">Terms of Service</Link></li>
                        </ul>
                    </div>
                </div>
                <div className="max-w-7xl mx-auto mt-16 pt-8 border-t border-stone-800 text-sm text-center flex flex-col md:flex-row justify-between items-center gap-4">
                    <span>© 2025 SpringZen. All rights reserved.</span>
                    <span className="flex gap-4">
                       
                    </span>
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
