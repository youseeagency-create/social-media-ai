import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "HayeMedia | Viral Content Creation Agency",
  description:
    "HayeMedia is a viral content creation agency that has generated 500M+ organic views and scaled 30+ businesses across TikTok, Instagram Reels, YouTube Shorts, and LinkedIn.",
  openGraph: {
    title: "HayeMedia | Viral Content Creation Agency",
    description:
      "500M+ organic views. 30+ businesses scaled. $10M+ client revenue. We architect high-performance content strategies and viral frameworks.",
    type: "website",
  },
};

const APPLY_EMAIL = "hello@hayemedia.com";
const applyHref = `mailto:${APPLY_EMAIL}?subject=Application%20to%20work%20with%20HayeMedia`;
const joinHref = `mailto:${APPLY_EMAIL}?subject=Weekly%20insights%20signup`;

const stats = [
  { value: "500M+", label: "Organic Views Generated" },
  { value: "30+", label: "Businesses Scaled" },
  { value: "$10M+", label: "Client Revenue Driven" },
  { value: "100%", label: "Success Rate" },
];

const services = [
  {
    title: "Social Media Mastery",
    body: "Reach millions of users and explode your business/brand in only a few weeks.",
    points: [
      "Create content that reaches your ICP",
      "Viral frameworks tailored specifically to each platform",
      "Content that actually converts views into sales",
      "Create a leveraged personal brand to drive new revenue in",
    ],
  },
  {
    title: "Viral Consultancy",
    body: "Learn the exact frameworks we’ve used to go viral every time.",
    points: [
      "Build the most leveraged skillset and apply it to any part of your business",
      "Have us hold your hand every step of the way and build your brand online",
      "Understand the mind of a growth specialist with almost a billion views",
      "1-1 Coaching to guarantee your success",
    ],
  },
];

const process = [
  {
    title: "Profile Audit",
    body: "We begin by analysing your content and what traits you have that are setting you up for failure.",
  },
  { title: "Primary Research", body: "Analyse competitor accounts and collect 100+ reference videos." },
  { title: "1-1 Coaching", body: "Teaching you everything we know on virality to set you up for success." },
  { title: "Ideation", body: "Preparing the content planner with concepts we believe will work." },
  { title: "Execution", body: "Our team handles everything from A to Z, shooting content we know will go viral." },
  { title: "Refinement", body: "Final review by specialist editors before upload." },
];

const fireBullets = [
  "Showing them they can command market share without aggressive ad spend by leveraging proprietary narrative frameworks.",
  "Eliminating the ‘commoditized’ feel of their service, teaching them the authority mindset needed to lead rather than follow.",
];

const caseStudies = [
  {
    business: "BuiltByMumtaz",
    name: "Jerry",
    quote:
      "In just 40 Days we got Jerry over 10,000,000 views, broke record days over 8x, and received opportunity after opportunity with franchising, investment, and hiring staff. People are driving from all over the UK just to try his desserts.",
    stats: [
      { value: "10,000,000+", label: "Views in 40 days" },
      { value: "8x", label: "Record days broken" },
      { value: "Secured", label: "Franchising and investment" },
    ],
  },
  {
    business: "Construction & Extensions",
    name: "Rakib",
    quote:
      "With no script and no ideation, Rakib’s first time recording went viral. 110,000 views across socials and over 1000 new followers. More importantly, it generated almost £300,000 in qualified bookings and a confirmed £80,000 extension job.",
    stats: [
      { value: "£80,000", label: "Confirmed job" },
      { value: "£300,000", label: "In qualified bookings" },
      { value: "110,000", label: "Views from 1 video" },
    ],
  },
  {
    business: "City Careers Coach",
    name: "Hassan",
    quote:
      "We grew Hassan on LinkedIn to over 19,000 followers and generated over 4,000,000 views. His inbox was getting flooded with DMs from dream prospects. Scaled from 2,000 to 36,000 followers (18x) and grew a free Skool community to 2,000 active members in just 3 months.",
    stats: [
      { value: "19,000+", label: "Followers" },
      { value: "4,000,000+", label: "Views" },
      { value: "18x", label: "Follower growth" },
    ],
  },
];

const faqs = [
  {
    q: "How fast can I expect results?",
    a: "Our viral frameworks typically start showing significant traction within the first 30 to 45 days of execution.",
  },
  {
    q: "Do I need to come up with video ideas?",
    a: "No. Our team handles the entire ideation process with proven concepts tailored to your brand.",
  },
  {
    q: "What platforms do you specialize in?",
    a: "TikTok, Instagram Reels, YouTube Shorts, and LinkedIn for B2B personal branding.",
  },
  {
    q: "Do you guarantee views?",
    a: "Yes. 500,000+ views or we work for free.",
  },
  {
    q: "Who is HayeMedia for?",
    a: "High-growth founders, category-leading businesses, and executives who need total market dominance through leveraged personal branding.",
  },
];

const marqueeItems = ["Content Creation", "Viral Strategy", "Brand Identity", "Revenue Growth"];

const footerColumns = [
  {
    heading: "Solutions",
    links: [
      { label: "Identity", href: "#services" },
      { label: "Digital", href: "#services" },
      { label: "Systems", href: "#process" },
      { label: "Agency", href: "#" },
    ],
  },
  {
    heading: "Company",
    links: [
      { label: "Success Stories", href: "#case-studies" },
      { label: "The Strategy", href: "#process" },
      { label: "Terms", href: "#" },
    ],
  },
  {
    heading: "Connect",
    links: [
      { label: "Twitter / X", href: "#" },
      { label: "Instagram", href: "#" },
      { label: "YouTube", href: "#" },
    ],
  },
];

const Eyebrow = ({ children }: { children: React.ReactNode }) => (
  <p className="mb-4 font-mono text-sm font-semibold uppercase tracking-[0.15em] text-neutral-600">{children}</p>
);

const CheckIcon = ({ dark = false }: { dark?: boolean }) => (
  <span
    aria-hidden
    className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
      dark ? "bg-white" : "bg-neutral-900"
    }`}
  >
    <svg
      viewBox="0 0 24 24"
      className="h-3 w-3"
      fill="none"
      stroke={dark ? "#111111" : "white"}
      strokeWidth={3}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 13l4 4L19 7" />
    </svg>
  </span>
);

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white text-neutral-900">
      {/* Nav */}
      <header className="sticky top-0 z-50 border-b border-neutral-200 bg-white/80 backdrop-blur-xl">
        <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <span className="text-xl font-bold tracking-tight">HayeMedia</span>
          <div className="flex items-center gap-1 sm:gap-2">
            <div className="hidden items-center lg:flex">
              <a href="#services" className="rounded-full px-3 py-2 text-sm font-medium text-neutral-600 transition-colors hover:text-neutral-900">
                Services
              </a>
              <a href="#case-studies" className="rounded-full px-3 py-2 text-sm font-medium text-neutral-600 transition-colors hover:text-neutral-900">
                Case Studies
              </a>
              <a href="#process" className="rounded-full px-3 py-2 text-sm font-medium text-neutral-600 transition-colors hover:text-neutral-900">
                Process
              </a>
              <a href="#faq" className="rounded-full px-3 py-2 text-sm font-medium text-neutral-600 transition-colors hover:text-neutral-900">
                FAQ
              </a>
            </div>
            <Link
              href="/login"
              className="rounded-full border border-neutral-300 px-4 py-2 text-xs font-medium transition-all hover:border-neutral-900 hover:bg-neutral-50 sm:text-sm"
            >
              Client Login
            </Link>
            <a
              href={applyHref}
              className="rounded-full bg-neutral-900 px-4 py-2 text-xs font-medium text-white transition-all hover:bg-black hover:shadow-lg hover:shadow-neutral-900/20 sm:text-sm"
            >
              Apply
            </a>
          </div>
        </nav>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-6 pt-20 pb-16 sm:pt-28 sm:pb-24">
        <Eyebrow>Viral Content Creation Agency</Eyebrow>
        <h1 className="max-w-4xl text-5xl font-bold leading-[1.02] tracking-tight sm:text-7xl md:text-8xl">
          Rebuild your brand.
          <br />
          Rewire your content.
          <br />
          Redesign your reach.
        </h1>
        <p className="mt-8 max-w-2xl text-lg leading-relaxed text-neutral-600">
          We architect high-performance content strategies and brand identities that command attention, followed by
          viral frameworks that remove the operational bottlenecks holding your growth back.
        </p>
        <p className="mt-6 max-w-2xl text-lg font-semibold leading-snug text-neutral-900">
          From Content Creation to Viral Distribution, we make your results inevitable.
        </p>
        <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-4">
          <a
            href={applyHref}
            className="rounded-full bg-neutral-900 px-7 py-3.5 text-sm font-medium text-white transition-all hover:-translate-y-0.5 hover:bg-black hover:shadow-lg hover:shadow-neutral-900/20"
          >
            Apply to work with us
          </a>
          <div className="text-sm">
            <p className="font-medium text-neutral-900">(Q3 intake: 3 select partners remaining)</p>
            <p className="text-neutral-500">30+ businesses transformed</p>
          </div>
        </div>
        <div className="mt-12 inline-block rounded-2xl border border-neutral-200 bg-neutral-50 px-8 py-6">
          <p className="mb-1 font-mono text-sm font-semibold uppercase tracking-[0.15em] text-neutral-500">
            Our guarantee
          </p>
          <p className="text-2xl font-bold leading-tight tracking-tight sm:text-3xl">
            Generate 500,000+ views or we work for
            <br />
            <span className="italic">free.</span>
          </p>
        </div>
      </section>

      {/* Stats band (inverted) */}
      <section className="bg-neutral-900 text-white">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-8 px-6 py-16 sm:grid-cols-4 sm:py-20">
          {stats.map((s) => (
            <div key={s.label}>
              <div className="text-4xl font-bold tracking-tight sm:text-5xl">{s.value}</div>
              <div className="mt-2 font-mono text-xs uppercase tracking-wider text-neutral-400">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Services */}
      <section id="services" className="mx-auto max-w-6xl scroll-mt-20 px-6 py-20 sm:py-28">
        <Eyebrow>What we do</Eyebrow>
        <h2 className="mb-12 max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl">
          Two ways to dominate your market.
        </h2>
        <div className="grid gap-6 md:grid-cols-2">
          {services.map((s) => (
            <div
              key={s.title}
              className="flex flex-col rounded-2xl border border-neutral-200 bg-white p-8 transition-all hover:-translate-y-1 hover:border-neutral-900 hover:shadow-xl hover:shadow-neutral-900/5"
            >
              <h3 className="text-2xl font-semibold tracking-tight">{s.title}</h3>
              <p className="mt-3 leading-relaxed text-neutral-600">{s.body}</p>
              <ul className="mt-6 space-y-3">
                {s.points.map((point) => (
                  <li key={point} className="flex items-start gap-3 text-sm leading-relaxed text-neutral-800">
                    <CheckIcon />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-8 pt-2">
                <a
                  href={applyHref}
                  className="inline-flex items-center gap-2 rounded-full bg-neutral-900 px-6 py-3 text-sm font-medium text-white transition-all hover:-translate-y-0.5 hover:bg-black hover:shadow-lg hover:shadow-neutral-900/20"
                >
                  Apply Now
                  <span aria-hidden>→</span>
                </a>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Philosophy — Results-First Branding */}
      <section className="border-y border-neutral-200 bg-neutral-50">
        <div className="mx-auto max-w-3xl px-6 py-20 text-center sm:py-28">
          <Eyebrow>Our philosophy</Eyebrow>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Results-First Branding. Trust the execution.
          </h2>
          <p className="mx-auto mt-6 max-w-2xl leading-relaxed text-neutral-600">
            Our approach is designed to challenge your beliefs and provide you with a new way of looking at identity,
            positioning, and market scale. Everything is designed to achieve your market potential, while emphasizing
            the importance of high-velocity execution and an authoritative result. Building the brand you want, and the
            dominance you want, should be inevitable.
          </p>
          <div className="mt-10 flex flex-col items-center gap-3">
            <a
              href="#process"
              className="rounded-full bg-neutral-900 px-7 py-3.5 text-sm font-medium text-white transition-all hover:-translate-y-0.5 hover:bg-black hover:shadow-lg hover:shadow-neutral-900/20"
            >
              View Execution Strategy
            </a>
            <p className="text-sm text-neutral-500">Limited to 3 new partners per quarter.</p>
          </div>
        </div>
      </section>

      {/* Process */}
      <section id="process" className="mx-auto max-w-6xl scroll-mt-20 px-6 py-20 sm:py-28">
        <Eyebrow>Our process</Eyebrow>
        <h2 className="mb-12 max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl">
          Here’s everything included in Our Strategy:
        </h2>
        <div className="grid gap-px overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-200 sm:grid-cols-2 lg:grid-cols-3">
          {process.map((p, i) => (
            <div key={p.title} className="bg-white p-8 transition-colors hover:bg-neutral-50">
              <div className="font-mono text-sm text-neutral-400">{String(i + 1).padStart(2, "0")}</div>
              <h3 className="mt-3 text-lg font-semibold">{p.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-neutral-600">{p.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* The Fire Rises (inverted) */}
      <section className="bg-neutral-900 text-white">
        <div className="mx-auto max-w-6xl px-6 py-20 sm:py-28">
          <Eyebrow>The transformation</Eyebrow>
          <h2 className="max-w-3xl text-3xl font-bold tracking-tight sm:text-4xl">
            The Fire Rises.
            <br />
            <span className="text-neutral-400">30+ Businesses Transformed.</span>
          </h2>
          <p className="mt-6 max-w-2xl leading-relaxed text-neutral-300">
            Our strategy has helped market leaders transform their trajectory by:
          </p>
          <ul className="mt-8 max-w-3xl space-y-4">
            {fireBullets.map((b) => (
              <li key={b} className="flex items-start gap-3 leading-relaxed text-neutral-200">
                <CheckIcon dark />
                <span>{b}</span>
              </li>
            ))}
          </ul>
          <a
            href="#process"
            className="mt-10 inline-flex items-center gap-2 text-sm font-medium text-white underline-offset-4 transition-colors hover:underline"
          >
            Learn about Our Strategy
            <span aria-hidden>→</span>
          </a>
        </div>
      </section>

      {/* The Views Rise */}
      <section className="border-b border-neutral-200 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-20 sm:py-28">
          <Eyebrow>The reach</Eyebrow>
          <h2 className="max-w-3xl text-3xl font-bold tracking-tight sm:text-4xl">
            The Views Rise.
            <br />
            <span className="text-neutral-500">30+ businesses transformed.</span>
          </h2>
          <p className="mt-6 max-w-2xl leading-relaxed text-neutral-600">
            Our approach has helped over 30+ businesses transform their reach, showing them they can scale their
            personal brands and reach millions of people every month.
          </p>
        </div>
      </section>

      {/* Case Studies */}
      <section id="case-studies" className="scroll-mt-20 border-b border-neutral-200 bg-neutral-50">
        <div className="mx-auto max-w-6xl px-6 py-20 sm:py-28">
          <Eyebrow>Case studies</Eyebrow>
          <h2 className="mb-3 max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl">
            Real clients, real results.
          </h2>
          <p className="mb-12 max-w-2xl text-lg text-neutral-600">
            The numbers speak louder than any pitch. Here is what happens when the frameworks meet execution.
          </p>
          <div className="grid gap-6 lg:grid-cols-3">
            {caseStudies.map((c) => (
              <div
                key={c.business}
                className="flex flex-col rounded-2xl border border-neutral-200 bg-white p-8 transition-all hover:-translate-y-1 hover:border-neutral-900 hover:shadow-xl hover:shadow-neutral-900/5"
              >
                <h3 className="text-2xl font-bold tracking-tight">{c.business}</h3>
                <p className="mt-1 text-sm font-medium text-neutral-500">{c.name}</p>
                <p className="mt-4 flex-1 leading-relaxed text-neutral-600">{c.quote}</p>
                <dl className="mt-8 space-y-4 border-t border-neutral-200 pt-6">
                  {c.stats.map((stat) => (
                    <div key={stat.label} className="flex items-baseline justify-between gap-4">
                      <dt className="text-sm text-neutral-500">{stat.label}</dt>
                      <dd className="text-right text-lg font-bold tracking-tight text-neutral-900">{stat.value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="scroll-mt-20 bg-white">
        <div className="mx-auto max-w-3xl px-6 py-20 sm:py-28">
          <Eyebrow>FAQ</Eyebrow>
          <h2 className="mb-12 text-3xl font-bold tracking-tight sm:text-4xl">Your Questions. Answered.</h2>
          <div className="divide-y divide-neutral-200 border-y border-neutral-200">
            {faqs.map((f) => (
              <details key={f.q} className="group py-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium">
                  {f.q}
                  <span className="font-mono text-xl text-neutral-400 transition-transform group-open:rotate-45">+</span>
                </summary>
                <p className="mt-3 leading-relaxed text-neutral-600">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Closing CTA (inverted) */}
      <section className="bg-neutral-900 text-white">
        <div className="mx-auto max-w-6xl px-6 py-20 text-center sm:py-28">
          <h2 className="mx-auto max-w-3xl text-4xl font-bold leading-[1.05] tracking-tight sm:text-6xl">
            Ready to dominate your industry?
          </h2>
          <p className="mx-auto mt-6 max-w-xl leading-relaxed text-neutral-400">
            Stop leaving money and attention on the table. Let’s build a content engine that actually drives revenue.
          </p>
          <div className="mt-10 flex justify-center">
            <a
              href={applyHref}
              className="rounded-full bg-white px-7 py-3.5 text-sm font-medium text-neutral-900 transition-all hover:-translate-y-0.5 hover:bg-neutral-200 hover:shadow-lg hover:shadow-black/30"
            >
              Apply to work with us
            </a>
          </div>
        </div>
      </section>

      {/* Marquee ticker */}
      <div className="overflow-hidden border-y border-neutral-200 bg-white py-5">
        <div className="flex w-max animate-marquee items-center whitespace-nowrap">
          {[0, 1].map((copy) => (
            <div key={copy} className="flex items-center" aria-hidden={copy === 1}>
              {marqueeItems.map((item) => (
                <span key={`${copy}-${item}`} className="flex items-center">
                  <span className="px-8 font-mono text-sm font-semibold uppercase tracking-[0.2em] text-neutral-900">
                    {item}
                  </span>
                  <span className="text-neutral-300">•</span>
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-neutral-950 text-neutral-400">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4">
            <div className="lg:col-span-2">
              <span className="text-xl font-bold tracking-tight text-white">HayeMedia</span>
              <p className="mt-4 max-w-sm text-sm leading-relaxed">
                Join other founders receiving our weekly insights.
              </p>
              <div className="mt-4 flex max-w-sm flex-col gap-2 sm:flex-row">
                <input
                  type="email"
                  placeholder="Founder's email address"
                  className="h-11 flex-1 rounded-full border border-white/15 bg-white/5 px-4 text-sm text-white placeholder:text-neutral-500 focus:border-white/40 focus:outline-none"
                />
                <a
                  href={joinHref}
                  className="inline-flex h-11 items-center justify-center rounded-full bg-white px-6 text-sm font-medium text-neutral-900 transition-all hover:-translate-y-0.5 hover:bg-neutral-200"
                >
                  Join
                </a>
              </div>
            </div>
            {footerColumns.map((col) => (
              <div key={col.heading}>
                <p className="font-mono text-sm font-semibold uppercase tracking-[0.15em] text-neutral-500">
                  {col.heading}
                </p>
                <ul className="mt-4 space-y-3">
                  {col.links.map((link) => (
                    <li key={link.label}>
                      <a href={link.href} className="text-sm text-neutral-400 transition-colors hover:text-white">
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="mt-16 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 sm:flex-row">
            <span className="font-mono text-xs uppercase tracking-[0.2em] text-neutral-500">
              © 2026 HAYEMEDIA • BUILT FOR DOMINANCE
            </span>
            <Link href="/login" className="text-sm text-neutral-400 transition-colors hover:text-white">
              Client Login
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
