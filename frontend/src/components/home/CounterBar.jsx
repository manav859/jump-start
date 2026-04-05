export default function CounterBar() {
  const stats = [
    { number: "50K+", label: "Students Guided" },
    { number: "98%", label: "Satisfaction Rate" },
    { number: "200+", label: "Career Paths" },
    { number: "15+", label: "Expert Psychologists" }
  ];

  return (
    <section className="bg-[#197E7C] py-12">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 text-center gap-8">

          {stats.map((item, index) => (
            <div key={index}>
              <h2 className="text-white text-3xl font-semibold">
                {item.number}
              </h2>
              <p className="!text-white text-sm opacity-90 mt-1">
                {item.label}
              </p>
            </div>
          ))}

        </div>
      </div>
    </section>
  );
}
