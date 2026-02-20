import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Leaf, CheckSquare, ShoppingBag, BookOpen, Menu, X, LogIn, LogOut, Search, TrendingUp, Book } from 'lucide-react';
import { useState } from 'react';
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
    <nav className="bg-white border-b border-stone-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 flex items-center gap-2">
              <div className="bg-emerald-100 p-2 rounded-full">
                <Leaf className="h-6 w-6 text-emerald-600" />
              </div>
              <span className="font-serif text-xl font-bold text-stone-800">SpringZen</span>
            </Link>
          </div>

          {/* Desktop Menu */}
          <div className="hidden lg:flex lg:items-center lg:space-x-6">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive(link.path)
                    ? 'text-emerald-700 bg-emerald-50'
                    : 'text-stone-600 hover:text-emerald-600 hover:bg-stone-50'
                }`}
              >
                {link.icon}
                {link.name}
              </Link>
            ))}
            
            {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger className="focus:outline-none">
                    <Avatar className="h-9 w-9 border-2 border-emerald-100 cursor-pointer hover:border-emerald-300 transition-colors">
                      <AvatarImage src={user.picture} />
                      <AvatarFallback className="bg-emerald-100 text-emerald-700 font-bold">
                        {user.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 bg-white border border-stone-100 shadow-lg rounded-xl p-2">
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{user.name}</p>
                        <p className="text-xs leading-none text-muted-foreground text-stone-500">
                          {user.email}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-stone-100 my-1" />
                    <DropdownMenuItem 
                        onClick={logout}
                        className="text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer rounded-lg px-2 py-2 flex items-center gap-2"
                    >
                      <LogOut size={16} />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
            ) : (
                <button 
                    onClick={login}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-2 shadow-sm hover:shadow"
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
              className="inline-flex items-center justify-center p-2 rounded-md text-stone-600 hover:text-emerald-600 hover:bg-stone-50 focus:outline-none"
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="lg:hidden bg-white border-b border-stone-100 shadow-lg absolute w-full z-50">
          <div className="px-4 pt-4 pb-6 space-y-2">
             {user && (
                <div className="flex items-center gap-3 px-3 py-3 mb-4 bg-stone-50 rounded-xl">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={user.picture} />
                      <AvatarFallback className="bg-emerald-100 text-emerald-700 font-bold">
                        {user.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                        <span className="font-medium text-stone-800">{user.name}</span>
                        <span className="text-xs text-stone-500">{user.email}</span>
                    </div>
                </div>
            )}

            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 px-3 py-3 rounded-lg text-base font-medium transition-colors ${
                  isActive(link.path)
                    ? 'text-emerald-700 bg-emerald-50'
                    : 'text-stone-600 hover:text-emerald-600 hover:bg-stone-50'
                }`}
              >
                {link.icon}
                {link.name}
              </Link>
            ))}

             <div className="pt-4 mt-4 border-t border-stone-100">
                {user ? (
                    <button 
                        onClick={() => { logout(); setIsOpen(false); }}
                        className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-base font-medium text-red-600 hover:bg-red-50 transition-colors"
                    >
                        <LogOut size={18} />
                        Log out
                    </button>
                ) : (
                    <button 
                        onClick={() => { login(); setIsOpen(false); }}
                        className="w-full flex items-center justify-center gap-2 px-3 py-3 rounded-xl text-base font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-sm"
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
