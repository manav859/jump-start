import { Link } from "react-router-dom";

import w1 from "../../assets/w1.png";
import expert from "../../assets/expert.png";
import test from "../../assets/taketest.png";
import result from "../../assets/results.png";
import takeTestVisual from "../../assets/take_test_visual.png";
import getResultsVisual from "../../assets/get_results_visual.png";
import expertCounsellingVisual from "../../assets/expert_counselling_visual.png";

export default function HowWorks() {
  const steps = [
    {
      icon: test,
      visual: takeTestVisual,
      title: "Take the Test",
      desc: "Complete our psychology-designed aptitude tests at your own pace.",
      link: "/test",
    },
    {
      icon: result,
      visual: getResultsVisual,
      title: "Get Results",
      desc: "Receive detailed analysis of your strengths, interests, and career matches.",
      link: "/result",
    },
    {
      icon: expert,
      visual: expertCounsellingVisual,
      title: "Expert Counselling",
      desc: "Book one-on-one sessions with psychologists for personalized guidance.",
      link: "/bookcounselling",
    },
  ];

  return (
    <section className="py-20 bg-[#FAFAFA]">
      <div className="mx-auto max-w-7xl px-6">
        {/* Section Heading */}
        <h2 className="text-center text-[#0B0C0E] font-semibold !text-[48px]">
          How Jumpstart Works
        </h2>
        <p className="text-gray-500 mt-2 text-center">
          A simple, scientifically-backed process to discover your ideal career
        </p>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-14">
          {steps.map((step, index) => (
            <Link
              key={index}
              to={step.link}
              className="group block h-full"
            >
              <div className="bg-white h-full flex flex-col rounded-2xl border border-gray-200 p-6 shadow-sm transition group-hover:shadow-md group-hover:-translate-y-1">
                {/* Icon */}
                <div className="flex items-center">
                  <img
                    src={step.icon}
                    alt={step.title}
                    className="h-10 w-10 object-contain"
                  />
                </div>

                {/* Title */}
                <h3 className="mt-4 font-semibold text-[#0B0C0E] !text-[20px]">
                  {step.title}
                </h3>

                {/* Description */}
                <p className="mt-2 text-gray-500 leading-relaxed !text-[14px] flex-grow">
                  {step.desc}
                </p>

                {/* Bottom Image */}
                <div className="mt-[26px] overflow-hidden rounded-xl bg-[#F0FCFB]">
                  <img src={step.visual} alt="visual" className="w-full h-auto object-cover transform transition-transform group-hover:scale-105" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
