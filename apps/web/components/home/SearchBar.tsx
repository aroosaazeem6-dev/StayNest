export function SearchBar() {
  return (
    <section id="search" className="container-section -mt-8 pb-2">
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label
              htmlFor="destination"
              className="mb-1 block text-xs font-medium text-gray-500"
            >
              Destination
            </label>
            <input
              id="destination"
              type="text"
              placeholder="City, property, or area"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
              readOnly
            />
          </div>

          <div>
            <label
              htmlFor="checkin"
              className="mb-1 block text-xs font-medium text-gray-500"
            >
              Check-in
            </label>
            <input
              id="checkin"
              type="date"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
              readOnly
            />
          </div>

          <div>
            <label
              htmlFor="checkout"
              className="mb-1 block text-xs font-medium text-gray-500"
            >
              Check-out
            </label>
            <input
              id="checkout"
              type="date"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
              readOnly
            />
          </div>

          <div>
            <label
              htmlFor="guests"
              className="mb-1 block text-xs font-medium text-gray-500"
            >
              Guests
            </label>
            <input
              id="guests"
              type="number"
              min={1}
              placeholder="1+"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
              readOnly
            />
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <button type="button" className="btn-primary" disabled>
            Search
          </button>
        </div>
      </div>
    </section>
  );
}

export default SearchBar;