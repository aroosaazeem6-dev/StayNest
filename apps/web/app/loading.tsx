export default function Loading() {
  return (
    <div className="container-section flex min-h-[60vh] items-center justify-center py-16">
      <div className="flex flex-col items-center gap-3 text-gray-500">
         <div className="h-8 w-8 animate-spin rounded-full border-2 border-sage-200 border-t-forest-900" />
        <span className="text-sm">Loading StayNest…</span>
      </div>
    </div>
  );
}