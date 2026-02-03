"use client";

import { motion, useReducedMotion, type MotionProps } from "framer-motion";
import type { HTMLAttributes, ReactNode, ComponentType } from "react";
import { fadeInUpVariants, staggerContainerVariants } from "./variants";
import { cn } from "@/lib/utils";

type MotionTag = keyof typeof motion;

type BaseProps = Omit<HTMLAttributes<HTMLElement>, keyof MotionProps>;

type RevealProps = BaseProps & {
  as?: MotionTag;
  children: ReactNode;
  delay?: number;
  once?: boolean;
  amount?: number;
};

export function Reveal({
  as = "div",
  children,
  className,
  delay = 0,
  once = true,
  amount = 0.2,
  ...props
}: RevealProps) {
  const shouldReduceMotion = useReducedMotion();
  type MotionComponent = ComponentType<MotionProps & BaseProps>;
  const Tag = (motion[as] ?? motion.div) as MotionComponent;

  return (
    <Tag
      className={cn(className)}
      variants={shouldReduceMotion ? undefined : fadeInUpVariants}
      initial={shouldReduceMotion ? undefined : "hidden"}
      whileInView={shouldReduceMotion ? undefined : "visible"}
      viewport={shouldReduceMotion ? undefined : { once, amount }}
      custom={delay}
      {...props}
    >
      {children}
    </Tag>
  );
}

type StaggerProps = BaseProps & {
  as?: MotionTag;
  children: ReactNode;
  once?: boolean;
  amount?: number;
};

export function Stagger({
  as = "div",
  children,
  className,
  once = true,
  amount = 0.2,
  ...props
}: StaggerProps) {
  const shouldReduceMotion = useReducedMotion();
  type MotionComponent = ComponentType<MotionProps & BaseProps>;
  const Tag = (motion[as] ?? motion.div) as MotionComponent;

  return (
    <Tag
      className={cn(className)}
      variants={shouldReduceMotion ? undefined : staggerContainerVariants}
      initial={shouldReduceMotion ? undefined : "hidden"}
      whileInView={shouldReduceMotion ? undefined : "visible"}
      viewport={shouldReduceMotion ? undefined : { once, amount }}
      {...props}
    >
      {children}
    </Tag>
  );
}
