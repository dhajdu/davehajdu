'use client';

import { useState } from 'react';

export default function ContactCTA() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    message: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitMessage('');

    try {
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setSubmitMessage("Thanks for reaching out! We'll be in touch soon.");
        setFormData({ name: '', email: '', company: '', message: '' });
      } else {
        setSubmitMessage('Something went wrong. Please try again.');
      }
    } catch (error) {
      setSubmitMessage('Error submitting form. Please try again.');
      console.error('Form submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="bg-[#04102D] w-full py-16 md:py-24">
      <div className="max-w-[880px] mx-auto px-8 sm:px-5">
        {/* Label */}
        <div className="text-[#6FF2C1] text-[11px] font-bold tracking-[0.13em] uppercase mb-5 text-center">
          Let&apos;s Work Together
        </div>

        {/* Headline */}
        <h2
          className="text-white font-black tracking-tight leading-[1.05] text-center mb-6"
          style={{ fontSize: 'clamp(32px, 4.5vw, 54px)' }}
        >
          Ready to bridge
          <br />
          the gap?
        </h2>

        {/* Supporting Text */}
        <p className="text-white/50 text-center mb-12 max-w-xl mx-auto text-[17px] leading-relaxed">
          In five years, there will be two kinds of leaders: those who learned
          to lead with AI, and those who got replaced by someone who did.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-16">
          <button className="bg-[#6FF2C1] text-[#04102D] px-8 py-4 rounded-[7px] text-[13px] font-bold tracking-[0.06em] uppercase hover:bg-[#5de8b3] transition-colors w-full sm:w-auto">
            Book a Keynote
          </button>
          <button className="border border-white/25 text-white px-8 py-4 rounded-[7px] text-[13px] font-bold tracking-[0.06em] uppercase hover:border-white/50 hover:bg-white/5 transition-all w-full sm:w-auto">
            Schedule a Consultation
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="max-w-2xl mx-auto bg-white rounded-lg p-8">
          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <input
              type="text"
              name="name"
              placeholder="Your Name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-[#D4D9E0] rounded-md focus:outline-none focus:border-[#287BE8] focus:ring-1 focus:ring-[#287BE8] text-[#2A3044] placeholder-[#6B7280]"
            />
            <input
              type="email"
              name="email"
              placeholder="Your Email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-[#D4D9E0] rounded-md focus:outline-none focus:border-[#287BE8] focus:ring-1 focus:ring-[#287BE8] text-[#2A3044] placeholder-[#6B7280]"
            />
          </div>

          <input
            type="text"
            name="company"
            placeholder="Company"
            value={formData.company}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-[#D4D9E0] rounded-md focus:outline-none focus:border-[#287BE8] focus:ring-1 focus:ring-[#287BE8] text-[#2A3044] placeholder-[#6B7280] mb-4"
          />

          <textarea
            name="message"
            placeholder="Tell us about your needs..."
            value={formData.message}
            onChange={handleChange}
            rows={4}
            className="w-full px-4 py-3 border border-[#D4D9E0] rounded-md focus:outline-none focus:border-[#287BE8] focus:ring-1 focus:ring-[#287BE8] text-[#2A3044] placeholder-[#6B7280] mb-4"
          />

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-[#04102D] text-white px-6 py-3 rounded-md text-xs font-bold tracking-[0.05em] uppercase hover:bg-[#0a1844] disabled:opacity-50 transition-colors"
          >
            {isSubmitting ? 'Sending...' : 'Send Message'}
          </button>

          {submitMessage && (
            <p className="text-center mt-4 text-sm text-[#287BE8]">
              {submitMessage}
            </p>
          )}
        </form>
      </div>
    </section>
  );
}
