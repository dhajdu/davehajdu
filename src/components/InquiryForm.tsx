'use client';

import { useState } from 'react';

export type InquiryFieldType = 'text' | 'email' | 'tel' | 'select' | 'textarea';

export type InquiryField = {
  name: string;
  label: string;
  type: InquiryFieldType;
  required?: boolean;
  placeholder?: string;
  options?: { value: string; label: string }[];
  fullWidth?: boolean;
};

type Props = {
  inquiryType: 'general' | 'keynote' | 'consultation';
  fields: InquiryField[];
  submitLabel?: string;
};

export default function InquiryForm({
  inquiryType,
  fields,
  submitLabel = 'Send Inquiry',
}: Props) {
  const [formData, setFormData] = useState<Record<string, string>>(() =>
    Object.fromEntries(fields.map((f) => [f.name, '']))
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitState, setSubmitState] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitState('idle');
    setErrorMessage('');

    try {
      const response = await fetch('/api/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, inquiry_type: inquiryType }),
      });

      if (response.ok) {
        setSubmitState('success');
        setFormData(Object.fromEntries(fields.map((f) => [f.name, ''])));
      } else {
        const data = await response.json().catch(() => ({}));
        setSubmitState('error');
        setErrorMessage(data.error || 'Something went wrong. Please try again.');
      }
    } catch (error) {
      setSubmitState('error');
      setErrorMessage('Error submitting form. Please try again.');
      console.error('Form submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass =
    'w-full px-4 py-3 border border-[#D4D9E0] rounded-md focus:outline-none focus:border-[#287BE8] focus:ring-1 focus:ring-[#287BE8] text-[#2A3044] placeholder-[#6B7280] bg-white';

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg p-8">
      <div className="grid md:grid-cols-2 gap-4">
        {fields.map((field) => {
          const wrapperClass = field.fullWidth ? 'md:col-span-2' : '';

          if (field.type === 'select') {
            return (
              <div key={field.name} className={wrapperClass}>
                <label className="block text-xs font-bold text-[#2A3044] uppercase tracking-wider mb-1">
                  {field.label}
                  {field.required && <span className="text-[#D1458B]"> *</span>}
                </label>
                <select
                  name={field.name}
                  value={formData[field.name]}
                  onChange={handleChange}
                  required={field.required}
                  className={inputClass}
                >
                  <option value="">{field.placeholder || 'Select...'}</option>
                  {field.options?.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            );
          }

          if (field.type === 'textarea') {
            return (
              <div key={field.name} className={wrapperClass}>
                <label className="block text-xs font-bold text-[#2A3044] uppercase tracking-wider mb-1">
                  {field.label}
                  {field.required && <span className="text-[#D1458B]"> *</span>}
                </label>
                <textarea
                  name={field.name}
                  value={formData[field.name]}
                  onChange={handleChange}
                  required={field.required}
                  placeholder={field.placeholder}
                  rows={4}
                  className={inputClass}
                />
              </div>
            );
          }

          return (
            <div key={field.name} className={wrapperClass}>
              <label className="block text-xs font-bold text-[#2A3044] uppercase tracking-wider mb-1">
                {field.label}
                {field.required && <span className="text-[#D1458B]"> *</span>}
              </label>
              <input
                type={field.type}
                name={field.name}
                value={formData[field.name]}
                onChange={handleChange}
                required={field.required}
                placeholder={field.placeholder}
                className={inputClass}
              />
            </div>
          );
        })}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full mt-6 bg-[#04102D] text-white px-6 py-3 rounded-md text-xs font-bold tracking-[0.05em] uppercase hover:bg-[#0a1844] disabled:opacity-50 transition-colors"
      >
        {isSubmitting ? 'Sending...' : submitLabel}
      </button>

      {submitState === 'success' && (
        <div className="text-center mt-4 text-sm text-[#D1458B]">
          <p>Thanks for reaching out, We&apos;ll be in touch within the day</p>
          <p className="mt-1">
            Add me on WhatsApp |{' '}
            <a
              href="https://wa.me/84909958581"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:no-underline"
            >
              +84 90 995 8581
            </a>
          </p>
        </div>
      )}

      {submitState === 'error' && (
        <p className="text-center mt-4 text-sm text-red-600">{errorMessage}</p>
      )}
    </form>
  );
}
