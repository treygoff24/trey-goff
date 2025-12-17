// Motion configuration for reduced motion support and animation variants

export const motionConfig = {
  // Disabled under reduced motion
  ambient: { disabled: true },
  parallax: { disabled: true },
  autoPlay: { disabled: true },

  // Converted to instant
  pageTransition: { reduced: { duration: 0 } },
  scrollReveal: { reduced: { duration: 0 } },

  // Always preserved
  focus: { preserved: true },
  hover: { preserved: true },
  pressed: { preserved: true },
}

export function getMotionProps(reducedMotion: boolean) {
  return {
    transition: reducedMotion
      ? { duration: 0 }
      : { duration: 0.2, ease: 'easeOut' },
  }
}

// Animation variants for Motion for React
export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
}

export const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
}

export const fadeInDown = {
  initial: { opacity: 0, y: -20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 20 },
}

export const slideInFromRight = {
  initial: { x: '100%' },
  animate: { x: 0 },
  exit: { x: '100%' },
}

export const slideInFromBottom = {
  initial: { y: '100%' },
  animate: { y: 0 },
  exit: { y: '100%' },
}

export const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
}

// Default transition
export const defaultTransition = {
  duration: 0.2,
  ease: [0.25, 0.1, 0.25, 1], // ease-out
}

// Reduced motion variant
export const reducedMotionTransition = {
  duration: 0,
}

// Spring transitions for natural movement
export const springTransition = {
  type: 'spring' as const,
  damping: 25,
  stiffness: 300,
}
