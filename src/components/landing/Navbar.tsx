'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { ArrowRight, Code2 } from 'lucide-react';
import { RecoupLogo } from '@/components/ui/logo';

interface NavbarProps {
  scrolled?: boolean;
}

export function Navbar({ scrolled: externalScrolled }: NavbarProps = {}) {
  const [internalScrolled, setInternalScrolled] = useState(false);

  useEffect(() => {
    if (externalScrolled !== undefined) return;
    const handleScroll = () => {
      setInternalScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [externalScrolled]);

  const scrolled = externalScrolled !== undefined ? externalScrolled : internalScrolled;

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white/85 backdrop-blur-md border-b border-neutral-200/80 shadow-xs py-3.5'
          : 'bg-transparent py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2.5 group">
            <RecoupLogo size={32} className="w-8 h-8 group-hover:scale-105 transition-transform" />
            <span className="font-bold text-lg tracking-tight text-neutral-900">
              Recoup
            </span>
            <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-neutral-100 text-neutral-600 border border-neutral-200">
              AI Recovery Agent
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-neutral-600">
            <a href="#problem" className="hover:text-neutral-900 transition-colors">The Problem</a>
            <a href="#how-it-works" className="hover:text-neutral-900 transition-colors">How It Works</a>
            <a href="#ai-boundary" className="hover:text-neutral-900 transition-colors">AI Boundary</a>
            <a href="#guardrails" className="hover:text-neutral-900 transition-colors">Guardrails</a>
            <a href="#audit-trail" className="hover:text-neutral-900 transition-colors">Audit Ledger</a>
            <a href="#evaluation" className="hover:text-neutral-900 transition-colors">Benchmark</a>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <a
            href="https://github.com/Dakshx07/Recoup"
            target="_blank"
            rel="noreferrer"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 transition-colors"
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Specs & ADRs</span>
          </a>
          <Link
            href="/app"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-neutral-900 text-white text-xs font-semibold hover:bg-black transition-all shadow-sm hover:shadow active:scale-95 cursor-pointer"
          >
            <span>Explore Live Dashboard</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </header>
  );
}
