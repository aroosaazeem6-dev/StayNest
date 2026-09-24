'use client';

import { useState } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { UserRole } from '@prisma/client';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { DashboardSidebar } from './DashboardSidebar';
import { DashboardTopbar } from './DashboardTopbar';

export function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user } = useAuth();

  const isHost = Boolean(
    user && (user.isHost === true || user.role === UserRole.HOST),
  );

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[#F5F4EF]">
        {/* Sidebar */}
        <DashboardSidebar
          open={menuOpen}
          onClose={() => setMenuOpen(false)}
        />

        {/* Main application area */}
        <div className="md:pl-[270px]">
          {/* Top navigation */}
          <DashboardTopbar
            onMenuToggle={() => setMenuOpen((value) => !value)}
          />

          {/* Page content */}
          <main className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
            <div className="mx-auto w-full max-w-[1400px]">
              {isHost && (
                <div className="mb-6 flex items-center gap-3 rounded-2xl border border-[#D8E2D7] bg-[#EEF4EC] px-5 py-3.5 text-sm text-[#405546]">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#DCE8D9] text-[#405546]">
                    ✓
                  </span>

                  <div>
                    <p className="font-medium">
                      Hosting capability is enabled
                    </p>
                    <p className="mt-0.5 text-xs text-[#68776B]">
                      You can now list and manage your properties.
                    </p>
                  </div>
                </div>
              )}

              {children}
            </div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}