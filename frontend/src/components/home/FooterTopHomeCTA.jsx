import bedge from '../../assets/bedge.png'

export default function FooterTopHomeCTA() {
  return (
    <section className="py-20 bg-[#F5F5F5]">
      <div className="max-w-5xl mx-auto px-6">

        <div className="rounded-3xl p-12 text-center shadow-md border
                        bg-gradient-to-br from-[#E5FBFB] to-[#FFFFFF]">

          {/* Icon */}
          <div className="flex justify-center mb-4">
            <img src={bedge}/>
          </div>

          {/* Heading */}
          <h2 className="text-3xl font-semibold text-[#0B0C0E] text-[36px]">
            Ready to Find Your Calling?
          </h2>

          {/* Description */}
          <p className="text-gray-600 max-w-xl mx-auto mt-3">
            Join thousands of students who have discovered their ideal career path 
            through our scientifically-validated aptitude tests.
          </p>

          {/* Buttons */}
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center justify-center">
            <a
              href="/test"
              className="primary-btn inline-flex items-center justify-center rounded-full bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-300"
            >
              Browse Test Packages
              <svg
                className="ml-3 h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7"></path>
              </svg>
            </a>
            <a
              href="/bookcounselling"
              className="secondary-btn inline-flex items-center justify-center rounded-full border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-teal-100"
            >
              Schedule a Consultation
            </a>
          </div>
        </div>

      </div>
    </section>
  );
}
