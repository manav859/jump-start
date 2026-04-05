import { useContext } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle2, Sparkles, Star } from "lucide-react";
import { AuthContext } from "../context/AuthContext";
import takeTestImg from "../assets/Take-the-Test.png";
import getResultsImg from "../assets/Get-Results.png";
import counsellingImg from "../assets/Expert-Counselling.png";

const journeyCards = [
  {
    title: "Take the Test",
    description:
      "Answer psychologist-designed assessments that measure aptitude, interests, and personality.",
    image: takeTestImg,
    link: "/test",
  },
  {
    title: "Get Results",
    description:
      "See your strengths, section scores, and top-matched career directions in one place.",
    image: getResultsImg,
    link: "/result",
  },
  {
    title: "Expert Counselling",
    description:
      "Book a guided session to understand your report and plan the right next step.",
    image: counsellingImg,
    link: "/bookcounselling",
  },
];

const stats = [
  { label: "Students Assessed", value: "50K+" },
  { label: "Satisfaction Rate", value: "98%" },
  { label: "Career Paths", value: "200+" },
  { label: "Expert Support", value: "15+" },
];

export default function Home() {
  const { user } = useContext(AuthContext);
  const primaryDestination = user ? "/test" : "/signup";
  const secondaryDestination = user ? "/dashboard" : "/test";

  return (
    <div className="bg-white">
      <section className="relative overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(52,211,203,0.24),_transparent_36%),linear-gradient(180deg,#F4FEFE_0%,#FFFFFF_54%)]">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 md:py-20 lg:grid-cols-[1.02fr_0.98fr] lg:items-center lg:px-8">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#BAECEA] bg-white/80 px-4 py-2 text-sm font-semibold text-[#188B8B] shadow-sm">
              <Sparkles className="h-4 w-4" />
              Career Aptitude Assessment
            </div>

            <h1 className="mt-6 max-w-xl text-4xl font-bold leading-tight text-[#0F1729] sm:text-5xl lg:text-6xl">
              Discover Your Perfect Career Path
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-8 text-[#65758B]">
              Take scientifically-designed aptitude tests and get personalized
              career guidance from expert psychologists that help you move with
              clarity.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link to={primaryDestination} className="primary-btn gap-2">
                Start Your Test
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to={secondaryDestination} className="secondary-btn gap-2">
                View Dashboard
              </Link>
            </div>

            <div className="mt-8 flex flex-wrap gap-6 text-sm font-semibold text-[#4B5565]">
              <div className="inline-flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-[#188B8B]" />
                Scientifically validated
              </div>
              <div className="inline-flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-[#188B8B]" />
                Expert guidance
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-x-6 top-8 h-64 rounded-[32px] bg-[#D8F6F5] blur-3xl" />
            <div className="surface-card relative rounded-[32px] border border-white/80 bg-white/90 p-6 sm:p-8">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-[28px] bg-[linear-gradient(180deg,#E8FBFA_0%,#F8FEFE_100%)] p-6">
                  <p className="text-sm font-semibold text-[#188B8B]">
                    Personalized Insights
                  </p>
                  <p className="mt-2 text-3xl font-bold text-[#0F1729]">
                    92%
                  </p>
                  <p className="mt-3 text-sm leading-6 text-[#65758B]">
                    Match your strengths with future-ready career choices.
                  </p>
                </div>
                <div className="rounded-[28px] bg-[#0F1729] p-6 text-white">
                  <p className="text-sm font-semibold text-white/70">
                    What you unlock
                  </p>
                  <ul className="mt-4 space-y-3 text-sm text-white/90">
                    <li>Career fit report</li>
                    <li>Section-wise progress tracking</li>
                    <li>Action-oriented next steps</li>
                  </ul>
                </div>
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-3">
                <div className="rounded-3xl border border-[#E6EFF5] bg-[#F8FAFC] p-5">
                  <Star className="h-5 w-5 text-[#F59F0A]" />
                  <p className="mt-4 text-sm font-semibold text-[#0F1729]">
                    Aptitude
                  </p>
                  <p className="mt-1 text-sm leading-6 text-[#65758B]">
                    Understand how you solve, reason, and learn.
                  </p>
                </div>
                <div className="rounded-3xl border border-[#E6EFF5] bg-[#F8FAFC] p-5">
                  <Star className="h-5 w-5 text-[#188B8B]" />
                  <p className="mt-4 text-sm font-semibold text-[#0F1729]">
                    Interests
                  </p>
                  <p className="mt-1 text-sm leading-6 text-[#65758B]">
                    See what environments and roles energize you.
                  </p>
                </div>
                <div className="rounded-3xl border border-[#E6EFF5] bg-[#F8FAFC] p-5">
                  <Star className="h-5 w-5 text-[#0F1729]" />
                  <p className="mt-4 text-sm font-semibold text-[#0F1729]">
                    Guidance
                  </p>
                  <p className="mt-1 text-sm leading-6 text-[#65758B]">
                    Turn assessment results into a real plan of action.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-[#0F1729] sm:text-4xl">
            How Jumpstart Works
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-base text-[#65758B]">
            A simple, scientifically-backed process to discover your ideal
            career path.
          </p>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          {journeyCards.map((card) => (
            <Link
              key={card.title}
              to={card.link}
              className="surface-card group rounded-[28px] p-6 hover:-translate-y-1"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#E8F9F8] text-sm font-bold text-[#188B8B]">
                {card.title.charAt(0)}
              </div>
              <h3 className="mt-5 text-2xl font-semibold text-[#0F1729]">
                {card.title}
              </h3>
              <p className="mt-3 text-sm leading-7 text-[#65758B]">
                {card.description}
              </p>
              <div className="mt-6 overflow-hidden rounded-[24px] bg-[linear-gradient(180deg,#E5FBFB_0%,#CDEEEE_100%)] p-4">
                <img
                  src={card.image}
                  alt={card.title}
                  className="h-64 w-full rounded-[20px] object-cover transition duration-300 group-hover:scale-[1.02]"
                />
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="bg-[#188B8B]">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-10 text-white sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-8">
          {stats.map((item) => (
            <div key={item.label} className="text-center">
              <p className="text-3xl font-bold">{item.value}</p>
              <p className="mt-2 text-sm text-white/75">{item.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="surface-card rounded-[32px] bg-[radial-gradient(circle_at_top_right,_rgba(52,211,203,0.2),_transparent_36%),linear-gradient(180deg,#F4FEFE_0%,#FFFFFF_100%)] px-6 py-10 text-center sm:px-10">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#E8F9F8] text-[#188B8B]">
            <Sparkles className="h-6 w-6" />
          </div>
          <h2 className="mt-5 text-3xl font-bold text-[#0F1729] sm:text-4xl">
            Ready to Find Your Calling?
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-8 text-[#65758B]">
            Join thousands of students who have discovered their best career
            path through our scientifically calibrated aptitude assessments.
          </p>

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link to={primaryDestination} className="primary-btn gap-2">
              Explore Packages
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link to="/bookcounselling" className="secondary-btn">
              Schedule a Counselling Call
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
