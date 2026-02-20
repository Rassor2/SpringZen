import React from 'react';

const TermsOfService = () => {
  return (
    <div className="max-w-4xl mx-auto py-12 px-6">
      <h1 className="text-3xl font-bold mb-6">Terms of Service</h1>
      <p className="mb-4 text-gray-600">Last Updated: {new Date().toLocaleDateString()}</p>
      
      <div className="prose prose-stone max-w-none">
        <h2 className="text-xl font-bold mt-6 mb-3">1. Agreement to Terms</h2>
        <p>These Terms of Use constitute a legally binding agreement made between you, whether personally or on behalf of an entity (“you”) and SpringZen (“we,” “us” or “our”), concerning your access to and use of the springzen.app website as well as any other media form, media channel, mobile website or mobile application related, linked, or otherwise connected thereto (collectively, the “Site”).</p>

        <h2 className="text-xl font-bold mt-6 mb-3">2. Intellectual Property Rights</h2>
        <p>Unless otherwise indicated, the Site is our proprietary property and all source code, databases, functionality, software, website designs, audio, video, text, photographs, and graphics on the Site (collectively, the “Content”) and the trademarks, service marks, and logos contained therein (the “Marks”) are owned or controlled by us or licensed to us, and are protected by copyright and trademark laws.</p>

        <h2 className="text-xl font-bold mt-6 mb-3">3. User Representations</h2>
        <p>By using the Site, you represent and warrant that: (1) all registration information you submit will be true, accurate, current, and complete; (2) you will maintain the accuracy of such information and promptly update such registration information as necessary.</p>

        <h2 className="text-xl font-bold mt-6 mb-3">4. Prohibited Activities</h2>
        <p>You may not access or use the Site for any purpose other than that for which we make the Site available. The Site may not be used in connection with any commercial endeavors except those that are specifically endorsed or approved by us.</p>

        <h2 className="text-xl font-bold mt-6 mb-3">5. Contact Us</h2>
        <p>In order to resolve a complaint regarding the Site or to receive further information regarding use of the Site, please contact us at:</p>
        <p>Email: support@springzen.app</p>
      </div>
    </div>
  );
};

export default TermsOfService;
