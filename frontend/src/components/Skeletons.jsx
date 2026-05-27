// Shared skeleton placeholders for the user-facing pages. Each variant
// matches the shape of the real layout it replaces, so the page doesn't
// jump when data arrives. All variants use the same `animate-pulse`
// gray block so the loading state reads as one unified UI vocabulary
// across Test / Dashboard / Result / StudentReport / Careerdetail.
//
// Admin-side TableSkeleton already lives under components/admin/Skeletons.jsx.

const Bar = ({ className = "" }) => (
  <div className={`rounded bg-gray-200 ${className}`} />
);

// /test — 3 package cards
export const PackageCardsSkeleton = () => (
  <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
    <div className="mx-auto max-w-2xl text-center">
      <Bar className="mx-auto h-4 w-32 mb-4" />
      <Bar className="mx-auto h-9 w-3/4 mb-4" />
      <Bar className="mx-auto h-4 w-5/6" />
    </div>
    <div className="mt-12 grid gap-6 lg:grid-cols-3 animate-pulse">
      {[0, 1, 2].map((i) => (
        <article
          key={i}
          className="rounded-[30px] border-2 border-[#E1E7EF] p-8"
        >
          <Bar className="h-6 w-24 mb-6" />
          <Bar className="h-8 w-2/3 mb-3" />
          <Bar className="h-4 w-full mb-2" />
          <Bar className="h-4 w-5/6 mb-8" />
          <Bar className="h-10 w-1/3 mb-3" />
          <Bar className="h-4 w-1/2 mb-8" />
          <div className="space-y-3 mb-8">
            <Bar className="h-3 w-full" />
            <Bar className="h-3 w-11/12" />
            <Bar className="h-3 w-10/12" />
            <Bar className="h-3 w-9/12" />
          </div>
          <Bar className="h-12 w-full mb-4" />
          <Bar className="mx-auto h-3 w-2/5" />
        </article>
      ))}
    </div>
  </main>
);

// /dashboard — top stat row + purchased packages list
export const DashboardSkeleton = () => (
  <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 animate-pulse">
    <div className="flex flex-col gap-2 mb-8">
      <Bar className="h-9 w-1/2" />
      <Bar className="h-4 w-2/3" />
    </div>
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-10">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="rounded-[20px] border border-[#E1E7EF] p-5">
          <Bar className="h-10 w-10 mb-4" />
          <Bar className="h-8 w-1/3 mb-2" />
          <Bar className="h-3 w-2/3" />
        </div>
      ))}
    </div>
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
      <div className="rounded-[26px] border border-[#E1E7EF] p-6">
        <Bar className="h-6 w-1/3 mb-2" />
        <Bar className="h-4 w-1/2 mb-7" />
        <div className="space-y-4">
          {[0, 1].map((i) => (
            <div key={i} className="rounded-[20px] border border-[#E5EEF2] p-6">
              <Bar className="h-6 w-1/2 mb-4" />
              <div className="flex gap-5 mb-4">
                <Bar className="h-3 w-20" />
                <Bar className="h-3 w-24" />
                <Bar className="h-3 w-20" />
              </div>
              <Bar className="h-4 w-1/3" />
            </div>
          ))}
        </div>
      </div>
      <div className="space-y-6">
        <div className="rounded-[26px] border border-[#E1E7EF] p-6">
          <Bar className="h-5 w-2/3 mb-5" />
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="rounded-[18px] border border-[#E5EEF2] p-4">
                <Bar className="h-5 w-2/3 mb-2" />
                <Bar className="h-3 w-1/3" />
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-[26px] border border-[#E1E7EF] p-6">
          <Bar className="h-5 w-1/2 mb-4" />
          <Bar className="h-4 w-full mb-3" />
          <Bar className="h-12 w-full" />
        </div>
      </div>
    </div>
  </main>
);

// /result — summary cards + career list
export const ResultPageSkeleton = () => (
  <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 animate-pulse">
    <Bar className="h-8 w-1/3 mb-2" />
    <Bar className="h-4 w-1/2 mb-8" />
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-10">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="rounded-[20px] border border-[#E1E7EF] p-5">
          <Bar className="h-8 w-1/3 mb-2" />
          <Bar className="h-3 w-2/3" />
        </div>
      ))}
    </div>
    <div className="rounded-[26px] border border-[#E1E7EF] p-6 mb-8">
      <Bar className="h-5 w-1/3 mb-4" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="rounded-[18px] border border-[#E5EEF2] p-4">
            <Bar className="h-5 w-2/3 mb-3" />
            <Bar className="h-3 w-1/2 mb-2" />
            <Bar className="h-3 w-1/3" />
          </div>
        ))}
      </div>
    </div>
  </main>
);

// /result/:reportId — printable report layout
export const StudentReportSkeleton = () => (
  <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8 animate-pulse">
    <Bar className="h-4 w-24 mb-5" />
    <Bar className="h-9 w-2/3 mb-3" />
    <Bar className="h-4 w-3/4 mb-10" />
    {[0, 1, 2].map((i) => (
      <div key={i} className="rounded-[26px] border border-[#E1E7EF] p-6 mb-6">
        <Bar className="h-6 w-1/3 mb-4" />
        <Bar className="h-3 w-full mb-2" />
        <Bar className="h-3 w-5/6 mb-2" />
        <Bar className="h-3 w-3/4 mb-5" />
        <div className="grid gap-4 sm:grid-cols-2">
          <Bar className="h-20 w-full" />
          <Bar className="h-20 w-full" />
        </div>
      </div>
    ))}
  </main>
);

// /careerdetail — hero + body two-column
export const CareerdetailSkeleton = () => (
  <main className="bg-[#F7F8FA]">
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 animate-pulse">
      <Bar className="h-9 w-9 mb-6 rounded-full" />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_340px]">
        <div>
          <Bar className="h-10 w-3/4 mb-4" />
          <Bar className="h-2 w-1/3 mb-4" />
          <Bar className="h-4 w-full mb-2" />
          <Bar className="h-4 w-5/6 mb-2" />
          <Bar className="h-4 w-4/5 mb-6" />
          <div className="flex gap-2">
            <Bar className="h-7 w-20" />
            <Bar className="h-7 w-24" />
            <Bar className="h-7 w-16" />
          </div>
        </div>
        <div className="rounded-[26px] border border-[#E1E7EF] p-6">
          <Bar className="mx-auto h-11 w-11 rounded-full mb-4" />
          <Bar className="h-4 w-2/3 mx-auto mb-4" />
          <Bar className="h-10 w-full" />
        </div>
      </div>
      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_340px]">
        <div className="space-y-6">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="rounded-[26px] border border-[#E1E7EF] p-6">
              <Bar className="h-6 w-1/3 mb-4" />
              <Bar className="h-3 w-full mb-2" />
              <Bar className="h-3 w-11/12 mb-2" />
              <Bar className="h-3 w-3/4" />
            </div>
          ))}
        </div>
        <div className="space-y-6">
          <div className="rounded-[26px] border border-[#E1E7EF] p-6">
            <Bar className="h-6 w-1/3 mb-4" />
            <div className="space-y-3">
              <Bar className="h-3 w-full" />
              <Bar className="h-3 w-5/6" />
              <Bar className="h-3 w-4/5" />
            </div>
          </div>
          <div className="rounded-[26px] border border-[#E1E7EF] p-6">
            <Bar className="h-6 w-1/3 mb-4" />
            <div className="space-y-4">
              {[0, 1, 2].map((i) => (
                <div key={i}>
                  <Bar className="h-3 w-1/3 mb-2" />
                  <Bar className="h-2 w-full" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  </main>
);
