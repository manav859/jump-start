/**
 * Shared test package definitions for /test and /payment.
 * amount is in INR (number) for calculations; price is display string.
 */
export const TEST_PACKAGES = [
  {
    id: "essential",
    badge: "Most Popular",
    badgeBg: "bg-[#E6F8F8]",
    badgeText: "text-[#0B908E]",
    border: "border-[#E4E7EC]",
    title: "Essential Package",
    price: "₹1,499",
    amount: 1499,
    strike: "",
    features: [
      "Personality Assessment",
      "Aptitude Test",
      "Basic career recommendations",
      "Detailed PDF report",
      "Email support",
    ],
    button: "bg-[#0B908E]",
    text: "Get Started",
    duration: "Total duration: ~180 minutes",
    checkColor: "text-[#0B908E]",
  },
  {
    id: "standard",
    badge: "Best Value",
    badgeBg: "bg-[#FEF2D6]",
    badgeText: "text-[#B98500]",
    border: "border-[#F8A300]",
    title: "Standard Package",
    price: "₹1,999",
    amount: 1999,
    strike: "",
    features: [
      "Everything in Basic, plus:",
      "Advanced cognitive assessment",
      "Top 10 career matches with pathways",
      "Interactive dashboard",
    ],
    button: "bg-[#F8A300]",
    text: "Get Started",
    duration: "Total duration: ~180 minutes",
    checkColor: "text-[#F8A300]",
  },
  {
    id: "premium",
    badge: "Premium",
    badgeBg: "bg-[#E6F8F8]",
    badgeText: "text-[#0B908E]",
    border: "border-[#0B908E]",
    title: "Premium Package",
    price: "₹4,999",
    amount: 4999,
    strike: "₹6,999",
    features: [
      "Everything in Standard, plus:",
      "Work values & culture fit analysis",
      "Personalized action plan",
      "3 counselling sessions (90 mins total)",
      "6-month follow-up support",
    ],
    button: "bg-[#0B908E]",
    text: "Get Started",
    duration: "Total duration: ~180 minutes + counselling",
    checkColor: "text-[#0B908E]",
  },
];

export const GST_RATE = 0.18; // 18%

export function getPackageById(id) {
  return TEST_PACKAGES.find((p) => p.id === id) || null;
}
