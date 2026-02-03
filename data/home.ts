export const homeHero = {
  eyebrow: "Governance + Institutional Design",
  headline: "Designing the systems that let progress compound.",
  subhead:
    "I work on acceleration zones, institutional innovation, and the tools that make policy experiments legible and repeatable.",
  highlights: [
    "Acceleration zones",
    "Institutional innovation",
    "Knowledge infrastructure",
  ],
  ctas: {
    primary: { label: "Read the work", href: "/writing" },
    secondary: { label: "Explore projects", href: "/projects" },
    tertiary: { label: "Subscribe", href: "/subscribe" },
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
  eyebrow: "Open channel",
  title: "Get the signal",
  description:
    "Essays, dispatches, and project notes on building the next generation of governance.",
  primary: { label: "Subscribe for updates", href: "/subscribe" },
  secondary: { label: "See the latest essay", href: "/writing" },
};
