import React from 'react'

const PrivacyPolicy = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
      
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">Introduction</h2>
        <p className="text-gray-400 mb-4">
          This Privacy Policy explains how our Chrome extension collects, uses, and protects your information.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">Data Collection</h2>
        <p className="text-gray-400 mb-4">
          Our extension only collects website content from pages you actively interact with. We do not collect:
        </p>
        <ul className="list-disc list-inside text-gray-400 space-y-2">
          <li>Personal information (names, emails, passwords)</li>
          <li>Browsing history</li>
          <li>Cookies or tracking data</li>
          <li>Any data without your explicit action</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">How We Use Your Data</h2>
        <p className="text-gray-400">
          Website content (text only) is sent to a third-party AI service to generate responses. No data is stored or used for any other purpose.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">Data Security</h2>
        <p className="text-gray-400">
          We are committed to protecting your data. No data is transmitted to external servers.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">Contact Us</h2>
        <p className="text-gray-400">
          For privacy concerns, please contact us through the Chrome Web Store extension page.
        </p>
      </section>
    </div>
  )
}

export default PrivacyPolicy;