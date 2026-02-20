import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from 'sonner';
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Planner from "./pages/Planner";
import Shop from "./pages/Shop";
import Guides from "./pages/Guides";
import "@/App.css";

function App() {
  return (
    <div className="App font-sans text-stone-800">
      <BrowserRouter>
        <div className="min-h-screen flex flex-col bg-stone-50">
          <Navbar />
          <main className="flex-grow">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/planner" element={<Planner />} />
              <Route path="/shop" element={<Shop />} />
              <Route path="/guides" element={<Guides />} />
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
                        <li><a href="/planner" className="hover:text-emerald-400">Planner</a></li>
                        <li><a href="/shop" className="hover:text-emerald-400">Shop</a></li>
                        <li><a href="/guides" className="hover:text-emerald-400">Guides</a></li>
                    </ul>
                </div>
                <div>
                    <h4 className="text-white font-bold mb-4">Connect</h4>
                    <ul className="space-y-2">
                        <li><a href="#" className="hover:text-emerald-400">Instagram</a></li>
                        <li><a href="#" className="hover:text-emerald-400">TikTok</a></li>
                        <li><a href="#" className="hover:text-emerald-400">Newsletter</a></li>
                    </ul>
                </div>
            </div>
            <div className="max-w-7xl mx-auto mt-12 pt-8 border-t border-stone-800 text-sm text-center">
                © 2025 SpringZen. All rights reserved.
            </div>
          </footer>
        </div>
        <Toaster position="top-center" />
      </BrowserRouter>
    </div>
  );
}

export default App;
