'use client';

import { useState } from 'react';

export default function Projects() {
  const [activeTab, setActiveTab] = useState(0);

  const projects = [
    {
      title: 'Revenue Office',
      description: 'Optimize sales, marketing, and revenue generation with AI-powered insights and automation.',
    },
    {
      title: 'Talent Office',
      description: 'Transform recruitment, onboarding, and talent development with intelligent automation.',
    },
    {
      title: 'AI Agents In Operations',
      description: 'Streamline workflows and boost efficiency with autonomous AI agents.',
    },
  ];

  return (
    <section className="py-16 md:py-24">
      <div className="max-w-[880px] mx-auto px-8 sm:px-10">
        {/* Section Label */}
        <div className="text-[#287BE8] text-[10px] font-bold tracking-[0.12em] uppercase mb-4">
          Projects
        </div>

        {/* Heading */}
        <h2 className="text-3xl md:text-4xl font-bold text-[#04102D] mb-4">
          Every project has its unique DNA
        </h2>

        {/* Intro */}
        <p className="text-[#2A3044] mb-12 max-w-2xl">
          Real Intelligence Workshop brings together real-world AI solutions designed to transform your business.
        </p>

        {/* Project Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {projects.map((project, index) => (
            <button
              key={index}
              onClick={() => setActiveTab(index)}
              className={`p-6 rounded-lg text-left transition-all ${
                activeTab === index
                  ? 'bg-[#04102D] text-white border-2 border-[#6FF2C1]'
                  : 'bg-white border border-[#D4D9E0] text-[#04102D] hover:border-[#287BE8]'
              }`}
            >
              <h3 className="font-bold text-lg mb-2">{project.title}</h3>
              <p className={`text-sm ${activeTab === index ? 'text-[#6FF2C1]' : 'text-[#6B7280]'}`}>
                {project.description}
              </p>
            </button>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center">
          <button className="bg-[#04102D] text-white px-6 py-3 rounded-md text-xs font-bold tracking-[0.05em] uppercase hover:bg-[#0a1844] transition-colors">
            Explore AI Solutions
          </button>
        </div>
      </div>
    </section>
  );
}
