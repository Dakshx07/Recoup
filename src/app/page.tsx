'use client';

import { useState, useEffect } from 'react';
import {
  Navbar,
  HeroSection,
  ProblemSection,
  ArchitectureSection,
  SafetySection,
  GuardrailsSection,
  AuditLedgerSection,
  BenchmarkSection,
  FinalCtaSection,
  Footer,
} from '@/components/landing';

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-[#FDFCFB] text-neutral-900 selection:bg-blue-100 selection:text-blue-900 font-sans flex flex-col">
      {/* Skip to Main Content for WCAG Accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-neutral-950 focus:text-white focus:rounded-md focus:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-600 font-medium text-xs motion-reduce:transition-none"
      >
        Skip to main content
      </a>

      {/* 1. Persistent Sticky Navigation */}
      <Navbar scrolled={scrolled} />

      {/* Main Landmark Container */}
      <main id="main-content" tabIndex={-1} className="flex-1 outline-none">
        {/* 2. Hero Section */}
        <HeroSection />

        {/* 3. The Problem Section */}
        <ProblemSection />

        {/* 4. Architecture & Lifecycle Pipeline */}
        <ArchitectureSection />

        {/* 5. AI Boundary & Architectural Safety */}
        <SafetySection />

        {/* 6. Hardcoded Policy Rules & Constant Registry */}
        <GuardrailsSection />

        {/* 7. Decision Ledger & Live Product Proof */}
        <AuditLedgerSection />

        {/* 8. Measured Empirical Benchmark */}
        <BenchmarkSection />

        {/* 9. Final Call to Action */}
        <FinalCtaSection />
      </main>

      {/* 10. Master Footer */}
      <Footer />
    </div>
  );
}
