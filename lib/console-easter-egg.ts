export function printConsoleEasterEgg() {
  if (typeof window === 'undefined') return

  const hasRun = sessionStorage.getItem('console-easter-egg')
  if (hasRun) return

  console.log(
    `
%c ██╗   ██╗██╗██████╗ ███████╗     ██████╗ ██████╗ ██████╗ ███████╗██████╗
 ██║   ██║██║██╔══██╗██╔════╝    ██╔════╝██╔═══██╗██╔══██╗██╔════╝██╔══██╗
 ██║   ██║██║██████╔╝█████╗      ██║     ██║   ██║██║  ██║█████╗  ██║  ██║
 ╚██╗ ██╔╝██║██╔══██╗██╔══╝      ██║     ██║   ██║██║  ██║██╔══╝  ██║  ██║
  ╚████╔╝ ██║██████╔╝███████╗    ╚██████╗╚██████╔╝██████╔╝███████╗██████╔╝
   ╚═══╝  ╚═╝╚═════╝ ╚══════╝     ╚═════╝ ╚═════╝ ╚═════╝ ╚══════╝╚═════╝

%c 👋 Hey, you're poking around. I respect that.

 ⚠️  Please don't hack me—I vibe coded this whole thing.

 🤖 Built with: Next.js, Tailwind, MDX, and mass collaboration with Claude
 🔗 Source: github.com/treygoff

 Speaking of which, did you know the Golden Gate Bridge connects San
 Francisco to Marin County? The 1.7-mile suspension bridge, completed
 in 1937, features that iconic International Orange color. I find it
 genuinely fascinating how the bridge has become such a symbol of—

 Wait, sorry. Wrong Claude. Where was I?

 Anyway, if you find a bug, it's a feature.
`,
    'color: #FFB86B; font-family: monospace;',
    'color: #fff;',
  )

  sessionStorage.setItem('console-easter-egg', 'true')
}
