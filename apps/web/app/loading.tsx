export default function Loading() {
  return (
    <div className="container-section flex min-h-[60vh] items-center justify-center py-16">
      <div className="flex flex-col items-center gap-3 text-gray-500">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-brand-600" />
        <span className="text-sm">Loading StayNest…</span>
      </div>
    </div>
  );
}