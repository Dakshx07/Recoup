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
    <div className="min-h-screen bg-[#FDFCFB] text-neutral-900 selection:bg-blue-100 selection:text-blue-900 font-sans">
      {/* 1. Persistent Sticky Navigation */}
      <Navbar scrolled={scrolled} />

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

      {/* 10. Master Footer */}
      <Footer />
    </div>
  );
}
