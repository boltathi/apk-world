import {
  Sparkles, Code, BookOpen, Zap, ExternalLink, Twitter, Linkedin,
  ArrowRight, Heart, Eye,
} from "lucide-react";
import Link from "next/link";
import { PersonJsonLd } from "@/components/seo/JsonLd";
import type { Metadata } from "next";
import FaqAccordion from "./FaqAccordion";
import AboutStats from "./AboutStats";

export const metadata: Metadata = {
  title: "About",
  description: "Athithan Raj P & Pavithra Mohan — the team behind APK World. Building a lifestyle and learning platform for personal growth.",
};

const values = [
  { icon: Code, title: "Open Source", desc: "Our entire stack is transparent. No black boxes, no vendor lock-in. Learn from the code itself." },
  { icon: Eye, title: "Privacy First", desc: "Zero tracking, no analytics cookies. Your reading habits are your own business." },
  { icon: BookOpen, title: "Hands-On Learning", desc: "Every article has practical takeaways you can apply today. No fluff, no filler." },
  { icon: Heart, title: "Community Driven", desc: "Built for learners at every level. We simplify complex concepts without dumbing them down." },
];

const teamMembers = [
  {
    name: "Athithan Raj P",
    initials: "AR",
    role: "Full-Stack Developer & Content Creator",
    bio: "Builds and architects the APK World platform end-to-end — from the Flask API and Redis data layer to the Next.js frontend. Passionate about personal growth, finance, and making knowledge accessible to everyone.",
    linkedin: "https://www.linkedin.com/in/athithanraj/",
    gradient: "from-cyber-400 to-brand-500",
    initialsColor: "text-cyber-400",
    skills: ["Python", "Flask", "Next.js", "Redis", "Docker", "Nginx", "Finance", "Productivity"],
  },
  {
    name: "Pavithra Mohan",
    initials: "PM",
    role: "Content Strategist & Wellness Advocate",
    bio: "Co-maintains APK World with a focus on content quality, research accuracy, and making lifestyle education approachable for learners at every level. Ensures every article delivers real-world value.",
    linkedin: "https://www.linkedin.com/in/pavithrakavi/",
    gradient: "from-brand-400 to-cyber-500",
    initialsColor: "text-brand-400",
    skills: ["Content Strategy", "Nutrition", "Mindfulness", "Technical Writing", "Research"],
  },
];

const faqItems = [
  { q: "What is APK World?", a: "APK World is an independent lifestyle and learning platform. We publish practical articles on finance, health, mindfulness, productivity, and personal growth — designed to help you build better daily habits." },
  { q: "Is APK World free to use?", a: "Yes, 100%. All articles and resources on APK World are completely free. We believe knowledge should be accessible to everyone." },
  { q: "How can I contribute?", a: "Reach out via our Contact page or connect with us on LinkedIn. We welcome article suggestions, feedback, and collaboration ideas from the community." },
  { q: "Does APK World track users?", a: "No. We don't use analytics cookies or third-party trackers." },
];

export default function AboutPage() {
  return (
    <>
      <PersonJsonLd
        name="Athithan Raj P"
        jobTitle="Full-Stack Developer & Content Creator"
        description="Co-founder of APK World. Building a lifestyle and learning platform for personal growth."
        linkedinUrl="https://www.linkedin.com/in/athithanraj/"
      />
      <PersonJsonLd
        name="Pavithra Mohan"
        jobTitle="Content Strategist & Wellness Advocate"
        description="Co-maintainer of APK World. Focused on content quality, research accuracy, and accessible lifestyle education."
        linkedinUrl="https://www.linkedin.com/in/pavithrakavi/"
      />
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Hero */}
        <div className="mb-12">
          <div className="flex flex-col items-center text-center sm:flex-row sm:items-start sm:text-left gap-8">
            <div className="flex-shrink-0">
              <div className="h-28 w-28 rounded-full bg-gradient-to-br from-cyber-400 to-brand-500 p-1">
                <div className="flex h-full w-full items-center justify-center rounded-full bg-gray-950 text-3xl font-bold text-cyber-400">
                  AW
                </div>
              </div>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white sm:text-4xl">
                About Us
              </h1>
              <p className="mt-2 text-lg text-cyber-400 font-medium">
                Lifestyle & Learning Platform
              </p>
              <p className="mt-4 text-gray-400 leading-relaxed max-w-2xl">
                We built APK World to make personal growth accessible to everyone — from
                students exploring finance basics to professionals looking for better
                productivity systems. Our mission is to publish practical, actionable content
                on lifestyle, health, and learning that you can apply today.
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <a href="https://x.com/apkworldin" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-gray-800/50 px-4 py-1.5 text-sm text-gray-300 hover:border-cyber-400/30 hover:text-white transition-colors">
                  <Twitter className="h-4 w-4" /> Twitter
                </a>
                <a href="https://www.linkedin.com/company/apkworldin" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-gray-800/50 px-4 py-1.5 text-sm text-gray-300 hover:border-cyber-400/30 hover:text-white transition-colors">
                  <Linkedin className="h-4 w-4" /> APK World LinkedIn
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Platform Stats (admin-only) */}
        <AboutStats />

        {/* Team Members */}
        <section className="mb-16">
          <div className="grid gap-6 sm:grid-cols-2">
            {teamMembers.map((member) => (
              <div key={member.name} className="rounded-xl border border-white/10 bg-gray-900/50 p-6">
                <div className="flex items-center gap-4">
                  <div className={`h-14 w-14 rounded-full bg-gradient-to-br ${member.gradient} p-0.5`}>
                    <div className={`flex h-full w-full items-center justify-center rounded-full bg-gray-950 text-lg font-bold ${member.initialsColor}`}>
                      {member.initials}
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">{member.name}</h3>
                    <p className="text-sm text-cyber-400">{member.role}</p>
                  </div>
                </div>
                <p className="mt-4 text-sm text-gray-400 leading-relaxed">
                  {member.bio}
                </p>
                {/* Skills Tags */}
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {member.skills.map((skill) => (
                    <span key={skill} className="rounded-full border border-white/10 bg-gray-800/60 px-2.5 py-0.5 text-xs text-gray-300">
                      {skill}
                    </span>
                  ))}
                </div>
                <a href={member.linkedin} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-1.5 text-sm text-cyber-400 hover:text-cyber-300 transition-colors">
                  <Linkedin className="h-4 w-4" /> LinkedIn Profile
                </a>
              </div>
            ))}
          </div>
        </section>

        {/* What We Focus On */}
        <section className="mb-16">
          <h2 className="mb-6 text-xl font-bold text-white">What We Focus On</h2>
          <div className="grid gap-5 sm:grid-cols-2">
            {[
              {
                icon: BookOpen,
                title: "Finance & Book Reviews",
                desc: "Personal finance fundamentals, saving strategies, investing basics, and curated book reviews that expand your worldview.",
              },
              {
                icon: Code,
                title: "Full-Stack Development",
                desc: "Building production-grade applications with Flask, Next.js, and Redis. Every tool on APK World is built from scratch — no templates.",
              },
              {
                icon: Sparkles,
                title: "Health & Wellness",
                desc: "Nutrition guides, exercise routines, meditation practices, and mental health insights for a balanced, intentional lifestyle.",
              },
              {
                icon: Zap,
                title: "Productivity & Growth",
                desc: "Practical systems, lifestyle hacks, and daily habits that compound over time. Every article gives you something actionable.",
              },
            ].map((area) => (
              <div key={area.title} className="rounded-xl border border-white/10 bg-gray-900/50 p-5">
                <area.icon className="mb-3 h-6 w-6 text-cyber-400" />
                <h3 className="font-semibold text-white">{area.title}</h3>
                <p className="mt-2 text-sm text-gray-400 leading-relaxed">{area.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Our Values */}
        <section className="mb-16">
          <h2 className="mb-6 text-xl font-bold text-white">Our Values</h2>
          <div className="grid gap-5 sm:grid-cols-2">
            {values.map((v) => (
              <div key={v.title} className="flex gap-4 rounded-xl border border-white/10 bg-gray-900/50 p-5">
                <v.icon className="mt-0.5 h-6 w-6 flex-shrink-0 text-cyber-400" />
                <div>
                  <h3 className="font-semibold text-white">{v.title}</h3>
                  <p className="mt-1 text-sm text-gray-400 leading-relaxed">{v.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* About APK World */}
        <section className="mb-16">
          <h2 className="mb-4 text-xl font-bold text-white">About APK World</h2>
          <div className="prose-cyber space-y-4">
            <p className="text-gray-300 leading-relaxed">
              APK World is an independent platform dedicated to lifestyle education and personal
              growth. Every article is written to be <strong>practical</strong> — you
              won&apos;t just read about budgeting, you&apos;ll get templates and frameworks you can use
              today.
            </p>
          </div>
        </section>

        {/* FAQ */}
        <section className="mb-16">
          <h2 className="mb-6 text-xl font-bold text-white">Frequently Asked Questions</h2>
          <FaqAccordion items={faqItems} />
        </section>

        {/* CTA */}
        <section className="rounded-xl border border-white/10 bg-gradient-to-r from-cyber-950/50 to-brand-950/30 p-8 text-center">
          <h2 className="text-xl font-bold text-white">Ready to start learning?</h2>
          <p className="mt-2 text-gray-400">
            Explore our articles — every one is designed to give you something actionable.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
            <Link href="/articles" className="cyber-btn gap-2">
              Read Articles <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/contact" className="cyber-btn-outline gap-2">
              Get in Touch <ExternalLink className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </div>
    </>
  );
}
