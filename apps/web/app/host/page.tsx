import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { UserRole } from '@prisma/client';

export default function HostPage() {
  return (
    <ProtectedRoute allowedRoles={[UserRole.HOST]}>
      <div className="container-section py-16">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Hosting</h1>
        <p className="mt-2 text-gray-600">
          Manage your listings and hosting activity. The host dashboard is
          coming soon.
        </p>
      </div>
    </ProtectedRoute>
  );
}