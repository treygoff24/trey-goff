import { isNewsletterEnabled } from '@/lib/site-config'

export const homeHero = {
  eyebrow: "Governance + Institutional Design",
  headline: "Designing the systems that let progress compound.",
  subhead:
    "I work on governance innovation, institutional design, and the tools that make policy experiments legible and repeatable.",
  highlights: [
    "Governance innovation",
    "Institutional innovation",
    "Knowledge infrastructure",
  ],
  ctas: {
    primary: { label: "Read the work", href: "/writing" },
    secondary: { label: "Explore projects", href: "/projects" },
    tertiary: isNewsletterEnabled
      ? { label: "Subscribe", href: "/subscribe" }
      : { label: "See what's current", href: "/now" },
  },
};

export const homeSignals = {
  eyebrow: "Start anywhere",
  title: "Four paths into the work",
  description:
    "Choose a path into the work: long-form essays, active projects, a living library, and the idea graph.",
  items: [
    {
      href: "/writing",
      label: "Writing",
      description: "Essays and field notes on governance reform.",
      icon: "writing",
    },
    {
      href: "/projects",
      label: "Projects",
      description: "Case studies and systems I am building.",
      icon: "projects",
    },
    {
      href: "/library",
      label: "Library",
      description: "Books, references, and my research stack.",
      icon: "library",
    },
    {
      href: "/graph",
      label: "Graph",
      description: "Connected ideas across essays and notes.",
      icon: "graph",
    },
  ] as const,
};

export const homeCta = {
  eyebrow: isNewsletterEnabled ? "Open channel" : "Keep exploring",
  title: isNewsletterEnabled ? "Get the signal" : "Keep up with the work",
  description: isNewsletterEnabled
    ? "Essays, dispatches, and project notes on building the next generation of governance."
    : "Start with the essays, browse the projects, and follow the threads connecting the work.",
  primary: isNewsletterEnabled
    ? { label: "Subscribe for updates", href: "/subscribe" }
    : { label: "Read the latest essays", href: "/writing" },
  secondary: isNewsletterEnabled
    ? { label: "See the latest essay", href: "/writing" }
    : { label: "Browse projects", href: "/projects" },
};
