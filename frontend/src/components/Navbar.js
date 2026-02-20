import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Leaf, CheckSquare, ShoppingBag, BookOpen, Menu, X, LogIn, LogOut, Search, TrendingUp, Book, ShieldCheck, Mail } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"


const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const { user, login, logout } = useAuth();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Home', path: '/', icon: <Leaf size={18} /> },
    { name: 'Planner', path: '/planner', icon: <CheckSquare size={18} /> },
    { name: 'Shop', path: '/shop', icon: <ShoppingBag size={18} /> },
    { name: 'Guides', path: '/guides', icon: <BookOpen size={18} /> },
    { name: 'Trends', path: '/trends', icon: <TrendingUp size={18} /> },
    { name: 'Glossary', path: '/glossary', icon: <Book size={18} /> },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled ? 'bg-white/90 backdrop-blur-md shadow-sm border-b border-stone-200/50 py-2' : 'bg-transparent py-4'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 flex items-center gap-2 group">
              <div className="bg-gradient-to-br from-emerald-100 to-teal-100 p-2 rounded-xl group-hover:rotate-12 transition-transform">
                <Leaf className="h-6 w-6 text-emerald-600" />
              </div>
              <span className={`font-serif text-xl font-bold transition-colors ${scrolled ? 'text-stone-800' : 'text-stone-800'}`}>SpringZen</span>
            </Link>
          </div>

          {/* Desktop Menu */}
          <div className="hidden lg:flex lg:items-center lg:space-x-4">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all ${
                  isActive(link.path)
                    ? 'text-emerald-700 bg-emerald-50 shadow-sm'
                    : 'text-stone-600 hover:text-emerald-600 hover:bg-stone-50'
                }`}
              >
                {link.icon}
                {link.name}
              </Link>
            ))}
            
            <div className="h-6 w-px bg-stone-200 mx-2"></div>
            
            {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger className="focus:outline-none">
                    <Avatar className="h-10 w-10 border-2 border-white shadow-sm cursor-pointer hover:border-emerald-300 transition-colors ring-2 ring-transparent hover:ring-emerald-100">
                      <AvatarImage src={user.picture} />
                      <AvatarFallback className="bg-emerald-100 text-emerald-700 font-bold">
                        {user.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-64 bg-white/95 backdrop-blur border border-stone-100 shadow-xl rounded-2xl p-2 mt-2">
                    <DropdownMenuLabel className="font-normal px-2 py-3">
                      <div className="flex flex-col space-y-1">
                        <div className="flex items-center gap-2">
                            <p className="text-sm font-bold leading-none">{user.name}</p>
                            {user.role === 'admin' && <span className="text-[10px] bg-stone-900 text-white px-2 py-0.5 rounded-full font-bold">ADMIN</span>}
                        </div>
                        <p className="text-xs leading-none text-muted-foreground text-stone-500 truncate">
                          {user.email}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-stone-100 my-1" />
                    {user.role === 'admin' && (
                        <>
                         <DropdownMenuItem 
                            asChild
                            className="cursor-pointer rounded-xl px-2 py-2.5 flex items-center gap-2 mb-1 text-emerald-600 bg-emerald-50"
                        >
                           <div className="flex items-center gap-2 w-full font-medium">
                                <ShieldCheck size={16} />
                                <span>Admin Mode Active</span>
                           </div>
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                            asChild
                            className="cursor-pointer rounded-xl px-2 py-2.5 flex items-center gap-2 mb-1 text-stone-600 hover:bg-stone-50"
                        >
                           <Link to="/admin/emails" className="flex items-center gap-2 w-full font-medium">
                                <Mail size={16} />
                                <span>Manage Subscribers</span>
                           </Link>
                        </DropdownMenuItem>
                        </>
                    )}
                    <DropdownMenuItem 
                        onClick={logout}
                        className="text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer rounded-xl px-2 py-2.5 flex items-center gap-2"
                    >
                      <LogOut size={16} />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
            ) : (
                <button 
                    onClick={login}
                    className="bg-stone-900 hover:bg-stone-800 text-white px-6 py-2.5 rounded-full text-sm font-bold transition-all flex items-center gap-2 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                >
                  <LogIn size={16} />
                  Login
                </button>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center lg:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-xl text-stone-600 hover:text-emerald-600 hover:bg-stone-50 focus:outline-none bg-white shadow-sm border border-stone-100"
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="lg:hidden bg-white/95 backdrop-blur-md border-b border-stone-100 shadow-xl absolute w-full z-50">
          <div className="px-4 pt-4 pb-6 space-y-2">
             {user && (
                <div className="flex items-center gap-3 px-3 py-3 mb-4 bg-stone-50 rounded-2xl border border-stone-100">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={user.picture} />
                      <AvatarFallback className="bg-emerald-100 text-emerald-700 font-bold">
                        {user.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                            <span className="font-bold text-stone-800">{user.name}</span>
                            {user.role === 'admin' && <span className="text-[10px] bg-stone-900 text-white px-2 py-0.5 rounded-full font-bold">ADMIN</span>}
                        </div>
                        <span className="text-xs text-stone-500">{user.email}</span>
                    </div>
                </div>
            )}

            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-base font-bold transition-colors ${
                  isActive(link.path)
                    ? 'text-emerald-700 bg-emerald-50'
                    : 'text-stone-600 hover:text-emerald-600 hover:bg-stone-50'
                }`}
              >
                {link.icon}
                {link.name}
              </Link>
            ))}
            
            {user?.role === 'admin' && (
                <Link
                to="/admin/emails"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-base font-bold text-stone-600 hover:bg-stone-50"
                >
                    <Mail size={18} />
                    Manage Subscribers
                </Link>
            )}

             <div className="pt-4 mt-4 border-t border-stone-100">
                {user ? (
                    <button 
                        onClick={() => { logout(); setIsOpen(false); }}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-base font-bold text-red-600 hover:bg-red-50 transition-colors"
                    >
                        <LogOut size={18} />
                        Log out
                    </button>
                ) : (
                    <button 
                        onClick={() => { login(); setIsOpen(false); }}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-base font-bold bg-stone-900 text-white hover:bg-stone-800 transition-colors shadow-sm"
                    >
                        <LogIn size={18} />
                        Login / Sign up
                    </button>
                )}
             </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
