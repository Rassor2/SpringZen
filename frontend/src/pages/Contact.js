import React, { useState } from 'react';
import { toast } from 'sonner';
import { Loader2, Mail, Send } from 'lucide-react';

const Contact = () => {
  const [loading, setLoading] = useState(false);
  
  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
        setLoading(false);
        toast.success("Message sent! We'll get back to you shortly.");
        e.target.reset();
    }, 1500);
  };

  return (
    <div className="max-w-4xl mx-auto py-12 px-6">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-serif font-bold text-stone-800 mb-4">Contact Us</h1>
        <p className="text-stone-600">Have questions about SpringZen? We'd love to hear from you.</p>
      </div>
      
      <div className="grid md:grid-cols-2 gap-12">
        <div className="bg-emerald-50 p-8 rounded-3xl">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Mail size={20} className="text-emerald-600" /> Get in touch
            </h3>
            <p className="mb-6 text-stone-600">
                Whether you have a question about features, pricing, or anything else, our team is ready to answer all your questions.
            </p>
            <div className="space-y-4">
                <div>
                    <div className="font-bold text-stone-800">Email</div>
                    <div className="text-emerald-600">hello@springzen.app</div>
                </div>
                <div>
                    <div className="font-bold text-stone-800">Support Hours</div>
                    <div className="text-stone-600">Mon-Fri, 9am - 5pm EST</div>
                </div>
            </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
            <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Name</label>
                <input required type="text" className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
            <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Email</label>
                <input required type="email" className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
            <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Message</label>
                <textarea required rows={4} className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"></textarea>
            </div>
            <button disabled={loading} type="submit" className="w-full bg-stone-900 text-white py-3 rounded-xl font-bold hover:bg-emerald-600 transition-colors flex items-center justify-center gap-2">
                {loading ? <Loader2 className="animate-spin" /> : <><Send size={18} /> Send Message</>}
            </button>
        </form>
      </div>
    </div>
  );
};

export default Contact;
