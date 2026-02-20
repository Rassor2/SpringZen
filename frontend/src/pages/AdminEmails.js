import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Loader2, Trash2, Mail, Download } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AdminEmails = () => {
  const { user, loading: authLoading } = useAuth();
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.role === 'admin') {
        fetchEmails();
    } else {
        setLoading(false);
    }
  }, [user]);

  const fetchEmails = async () => {
    try {
      const res = await axios.get(`${API}/admin/subscribers`, { withCredentials: true });
      setEmails(res.data);
    } catch (error) {
      console.error('Failed to fetch emails', error);
      toast.error("Could not load subscribers.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if(!window.confirm("Are you sure you want to remove this subscriber?")) return;
    try {
        await axios.delete(`${API}/admin/subscribers/${id}`, { withCredentials: true });
        setEmails(emails.filter(e => e.id !== id));
        toast.success("Subscriber removed");
    } catch (error) {
        console.error("Delete failed", error);
        toast.error("Failed to remove subscriber");
    }
  };

  const handleExport = () => {
    const csvContent = "data:text/csv;charset=utf-8," + 
        "Email,Date Joined\n" +
        emails.map(e => `${e.email},${new Date(e.created_at).toLocaleDateString()}`).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "springzen_subscribers.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (authLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>;
  if (!user || user.role !== 'admin') return <Navigate to="/" />;

  return (
    <div className="max-w-4xl mx-auto py-12 px-6 min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <div>
            <h1 className="text-3xl font-serif font-bold text-stone-800">Subscriber Management</h1>
            <p className="text-stone-500">Manage your newsletter audience ({emails.length} subscribers)</p>
        </div>
        <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 bg-emerald-100 text-emerald-700 rounded-lg font-bold hover:bg-emerald-200 transition-colors">
            <Download size={18} /> Export CSV
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden">
        <div className="overflow-x-auto">
            <table className="w-full text-left">
                <thead className="bg-stone-50 border-b border-stone-100">
                    <tr>
                        <th className="px-6 py-4 font-bold text-stone-600">Email Address</th>
                        <th className="px-6 py-4 font-bold text-stone-600">Date Joined</th>
                        <th className="px-6 py-4 font-bold text-stone-600 text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-stone-50">
                    {emails.map(subscriber => (
                        <tr key={subscriber.id} className="hover:bg-stone-50/50 transition-colors">
                            <td className="px-6 py-4 font-medium text-stone-800 flex items-center gap-2">
                                <Mail size={16} className="text-stone-400" />
                                {subscriber.email}
                            </td>
                            <td className="px-6 py-4 text-stone-500 text-sm">
                                {new Date(subscriber.created_at).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 text-right">
                                <button 
                                    onClick={() => handleDelete(subscriber.id)}
                                    className="p-2 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                                    title="Remove Subscriber"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </td>
                        </tr>
                    ))}
                    {emails.length === 0 && !loading && (
                        <tr>
                            <td colSpan="3" className="px-6 py-12 text-center text-stone-500">
                                No subscribers yet.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
      </div>
    </div>
  );
};

export default AdminEmails;
