import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "HayeMedia — Viral Content Creation Agency",
  description:
    "HayeMedia is a viral content creation agency that has generated 500M+ organic views and scaled 30+ businesses across TikTok, Instagram Reels, YouTube Shorts, and LinkedIn.",
  openGraph: {
    title: "HayeMedia — Viral Content Creation Agency",
    description:
      "500M+ organic views. 30+ businesses scaled. $10M+ client revenue. We architect high-performance content strategies and viral frameworks.",
    type: "website",
  },
};

const APPLY_EMAIL = "hello@hayemedia.com";
const applyHref = `mailto:${APPLY_EMAIL}?subject=Application%20%E2%80%94%20Work%20with%20HayeMedia`;

const stats = [
  { value: "500M+", label: "Organic views generated" },
  { value: "30+", label: "Businesses scaled" },
  { value: "$10M+", label: "Client revenue driven" },
  { value: "100%", label: "Success rate" },
];

const services = [
  {
    title: "Social Media Mastery",
    body: "Reach millions of users and explode your business with viral frameworks tailored to each platform — converting views into sales.",
  },
  {
    title: "Viral Consultancy",
    body: "1-on-1 coaching to learn the exact frameworks used to go viral, build your personal brand, and guarantee success with hands-on guidance.",
  },
];

const process = [
  { title: "Profile Audit", body: "We analyse your content and identify the traits setting you up for failure." },
  { title: "Primary Research", body: "Analyse competitor accounts and collect 100+ reference videos." },
  { title: "1-1 Coaching", body: "Teaching you everything we know on virality to set you up for success." },
  { title: "Ideation", body: "Preparing the content planner with concepts we believe will work." },
  { title: "Execution", body: "Our team handles everything from A–Z, shooting content we know will go viral." },
  { title: "Refinement", body: "Final review by specialist editors before upload." },
];

const faqs = [
  {
    q: "How fast can I expect results?",
    a: "Our viral frameworks typically start showing significant traction within the first 30–45 days of execution.",
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
    a: "Yes — 500,000+ views or we work for free.",
  },
  {
    q: "Who is HayeMedia for?",
    a: "High-growth founders, category-leading businesses, and executives who need total market dominance through leveraged personal branding.",
  },
];

const Eyebrow = ({ children }: { children: React.ReactNode }) => (
  <p className="mb-4 font-mono text-xs uppercase tracking-[0.2em] text-neutral-500">{children}</p>
);

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white text-neutral-900">
      {/* Nav */}
      <header className="sticky top-0 z-50 border-b border-neutral-200 bg-white/80 backdrop-blur-xl">
        <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <span className="font-mono text-sm font-bold uppercase tracking-[0.15em]">HAYEMEDIA</span>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/login"
              className="rounded-full border border-neutral-300 px-4 py-2 text-xs font-medium transition-colors hover:border-neutral-900 sm:text-sm"
            >
              Client Login
            </Link>
            <a
              href={applyHref}
              className="rounded-full bg-neutral-900 px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-neutral-700 sm:text-sm"
            >
              Apply
            </a>
          </div>
        </nav>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-6 pt-20 pb-16 sm:pt-28 sm:pb-24">
        <Eyebrow>Viral Content Creation Agency</Eyebrow>
        <h1 className="max-w-4xl text-4xl font-bold leading-[1.05] tracking-tight sm:text-6xl md:text-7xl">
          We turn brands into
          <br />
          cultural moments.
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-neutral-600">
          HayeMedia has generated over 500 million organic views and transformed 30+ businesses. We architect
          high-performance content strategies, brand identities, and viral frameworks for TikTok, Instagram Reels,
          YouTube Shorts, and LinkedIn.
        </p>
        <div className="mt-10 flex flex-wrap items-center gap-3">
          <a
            href={applyHref}
            className="rounded-full bg-neutral-900 px-7 py-3.5 text-sm font-medium text-white transition-colors hover:bg-neutral-700"
          >
            Apply to work with us
          </a>
          <Link
            href="/login"
            className="rounded-full border border-neutral-300 px-7 py-3.5 text-sm font-medium transition-colors hover:border-neutral-900"
          >
            Client Login
          </Link>
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
      <section className="mx-auto max-w-6xl px-6 py-20 sm:py-28">
        <Eyebrow>What we do</Eyebrow>
        <h2 className="mb-12 max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl">
          Two ways to dominate your market.
        </h2>
        <div className="grid gap-6 md:grid-cols-2">
          {services.map((s) => (
            <div key={s.title} className="rounded-2xl border border-neutral-200 p-8 transition-colors hover:border-neutral-900">
              <h3 className="text-xl font-semibold">{s.title}</h3>
              <p className="mt-3 leading-relaxed text-neutral-600">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Process */}
      <section className="border-y border-neutral-200 bg-neutral-50">
        <div className="mx-auto max-w-6xl px-6 py-20 sm:py-28">
          <Eyebrow>Our process</Eyebrow>
          <h2 className="mb-12 max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl">
            A proven system, from audit to upload.
          </h2>
          <div className="grid gap-px overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-200 sm:grid-cols-2 lg:grid-cols-3">
            {process.map((p, i) => (
              <div key={p.title} className="bg-neutral-50 p-8">
                <div className="font-mono text-sm text-neutral-400">{String(i + 1).padStart(2, "0")}</div>
                <h3 className="mt-3 text-lg font-semibold">{p.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-neutral-600">{p.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-3xl px-6 py-20 sm:py-28">
        <Eyebrow>FAQ</Eyebrow>
        <h2 className="mb-10 text-3xl font-bold tracking-tight sm:text-4xl">Questions, answered.</h2>
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
      </section>

      {/* Closing CTA (inverted) */}
      <section className="bg-neutral-900 text-white">
        <div className="mx-auto max-w-6xl px-6 py-20 text-center sm:py-28">
          <h2 className="mx-auto max-w-3xl text-3xl font-bold tracking-tight sm:text-5xl">
            500,000+ views, or we work for free.
          </h2>
          <p className="mx-auto mt-5 max-w-xl leading-relaxed text-neutral-400">
            For high-growth founders and category-leading businesses ready for total market dominance.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <a
              href={applyHref}
              className="rounded-full bg-white px-7 py-3.5 text-sm font-medium text-neutral-900 transition-colors hover:bg-neutral-200"
            >
              Apply to work with us
            </a>
            <Link
              href="/login"
              className="rounded-full border border-neutral-700 px-7 py-3.5 text-sm font-medium text-white transition-colors hover:border-white"
            >
              Client Login
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-neutral-200">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-10 sm:flex-row">
          <span className="font-mono text-sm font-bold uppercase tracking-[0.15em]">HAYEMEDIA</span>
          <Link href="/login" className="text-sm text-neutral-500 transition-colors hover:text-neutral-900">
            Client Login
          </Link>
          <span className="text-xs text-neutral-400">
            © {new Date().getFullYear()} HayeMedia. All rights reserved.
          </span>
        </div>
      </footer>
    </div>
  );
}
