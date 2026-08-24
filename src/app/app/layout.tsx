'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import {
  LayoutDashboard,
  Inbox,
  ScrollText,
  BarChart3,
  Shield,
  FlaskConical,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useState, useEffect } from 'react';

const NAV_ITEMS = [
  { href: '/app', label: 'Overview', icon: LayoutDashboard },
  { href: '/app/cases', label: 'Case queue', icon: Inbox, badge: true },
  { href: '/app/audit', label: 'Audit log', icon: ScrollText },
  { href: '/app/evaluation', label: 'Evaluation', icon: BarChart3 },
  { href: '/app/policy', label: 'Policy', icon: Shield },
];

const DEMO_ITEMS = [
  { href: '/app/simulation', label: 'Simulation', icon: FlaskConical },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [attentionCount, setAttentionCount] = useState(0);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUserEmail(user?.email ?? null);
    });

    // Fetch attention count for badge
    fetch('/api/cases?tab=attention&limit=0')
      .then((r) => r.json())
      .then((d) => setAttentionCount(d.total ?? 0))
      .catch(() => {});
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  function isActive(href: string) {
    if (href === '/app') return pathname === '/app';
    return pathname.startsWith(href);
  }

  return (
    <div className="flex h-screen overflow-hidden bg-neutral-50">
      {/* Sidebar */}
      <aside
        className={`flex flex-col border-r border-neutral-200 bg-white transition-all duration-200 ${
          collapsed ? 'w-16' : 'w-56'
        }`}
      >
        {/* Logo + collapse toggle */}
        <div className="flex items-center justify-between px-4 h-14 border-b border-neutral-200">
          {!collapsed && (
            <span className="text-lg font-semibold tracking-tight text-neutral-900">
              Recoup
            </span>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1 rounded hover:bg-neutral-100 text-neutral-400 hover:text-neutral-600 transition-colors"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Nav items */}
        <nav className="flex-1 py-2 px-2 space-y-0.5 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium
                            transition-colors group relative
                            ${
                              active
                                ? 'bg-blue-50 text-blue-700'
                                : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
                            }`}
                title={collapsed ? item.label : undefined}
              >
                <Icon
                  className={`w-[18px] h-[18px] flex-shrink-0 ${
                    active ? 'text-blue-600' : 'text-neutral-400 group-hover:text-neutral-600'
                  }`}
                />
                {!collapsed && (
                  <>
                    <span>{item.label}</span>
                    {item.badge && attentionCount > 0 && (
                      <span className="ml-auto text-xs font-medium bg-red-100 text-red-700 rounded-full px-1.5 py-0.5 min-w-[20px] text-center">
                        {attentionCount > 99 ? '99+' : attentionCount}
                      </span>
                    )}
                  </>
                )}
                {collapsed && item.badge && attentionCount > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500" />
                )}
              </Link>
            );
          })}

          {/* Divider */}
          <div className="!my-3 border-t border-neutral-200" />
          {!collapsed && (
            <div className="px-3 py-1">
              <span className="text-[11px] font-medium uppercase tracking-wider text-neutral-400">
                Demo tools
              </span>
            </div>
          )}

          {DEMO_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium
                            transition-colors group
                            ${
                              active
                                ? 'bg-blue-50 text-blue-700'
                                : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
                            }`}
                title={collapsed ? item.label : undefined}
              >
                <Icon
                  className={`w-[18px] h-[18px] flex-shrink-0 ${
                    active ? 'text-blue-600' : 'text-neutral-400 group-hover:text-neutral-600'
                  }`}
                />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* User identity + logout */}
        <div className="border-t border-neutral-200 px-2 py-3">
          <div
            className={`flex items-center gap-3 px-3 py-2 ${
              collapsed ? 'justify-center' : ''
            }`}
          >
            <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-semibold text-blue-700">
                {userEmail ? userEmail[0].toUpperCase() : 'R'}
              </span>
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-neutral-800 truncate">
                  {userEmail ?? 'Reviewer'}
                </p>
                <p className="text-[11px] text-neutral-400">Reviewer</p>
              </div>
            )}
            {!collapsed && (
              <button
                onClick={handleLogout}
                className="p-1 rounded hover:bg-neutral-100 text-neutral-400 hover:text-neutral-600 transition-colors"
                aria-label="Sign out"
                title="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-6 py-6">{children}</div>
      </main>
    </div>
  );
}
