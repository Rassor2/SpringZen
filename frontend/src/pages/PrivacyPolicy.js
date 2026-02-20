import React from 'react';

const PrivacyPolicy = () => {
  return (
    <div className="max-w-4xl mx-auto py-12 px-6">
      <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
      <p className="mb-4 text-gray-600">Effective Date: {new Date().toLocaleDateString()}</p>
      
      <div className="prose prose-stone max-w-none">
        <p>At SpringZen, we are committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclosure, and safeguard your information when you visit our website springzen.app.</p>
        
        <h2 className="text-xl font-bold mt-6 mb-3">1. Information We Collect</h2>
        <p>We may collect information about you in a variety of ways. The information we may collect on the Site includes:</p>
        <ul className="list-disc ml-6 mb-4">
            <li><strong>Personal Data:</strong> Personally identifiable information, such as your name, shipping address, email address, and telephone number, that you voluntarily give to us when you register with the Site or when you choose to participate in various activities related to the Site.</li>
            <li><strong>Derivative Data:</strong> Information our servers automatically collect when you access the Site, such as your IP address, your browser type, your operating system, your access times, and the pages you have viewed directly before and after accessing the Site.</li>
        </ul>

        <h2 className="text-xl font-bold mt-6 mb-3">2. Use of Your Information</h2>
        <p>Having accurate information about you permits us to provide you with a smooth, efficient, and customized experience. Specifically, we may use information collected about you via the Site to:</p>
        <ul className="list-disc ml-6 mb-4">
            <li>Create and manage your account.</li>
            <li>Email you regarding your account or order.</li>
            <li>Enable user-to-user communications.</li>
            <li>Generate a personal profile about you to make future visits to the Site more personalized.</li>
        </ul>

        <h2 className="text-xl font-bold mt-6 mb-3">3. Disclosure of Your Information</h2>
        <p>We may share information we have collected about you in certain situations. Your information may be disclosed as follows:</p>
        <ul className="list-disc ml-6 mb-4">
            <li><strong>By Law or to Protect Rights:</strong> If we believe the release of information about you is necessary to respond to legal process, to investigate or remedy potential violations of our policies, or to protect the rights, property, and safety of others, we may share your information as permitted or required by any applicable law, rule, or regulation.</li>
        </ul>

        <h2 className="text-xl font-bold mt-6 mb-3">4. Cookies and Web Beacons</h2>
        <p>We may use cookies, web beacons, tracking pixels, and other tracking technologies on the Site to help customize the Site and improve your experience. When you access the Site, your personal information is not collected through the use of tracking technology.</p>

        <h2 className="text-xl font-bold mt-6 mb-3">5. Contact Us</h2>
        <p>If you have questions or comments about this Privacy Policy, please contact us at:</p>
        <p>Email: privacy@springzen.app</p>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
