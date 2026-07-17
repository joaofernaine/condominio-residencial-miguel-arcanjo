import type { ComponentPropsWithoutRef, ElementType, ReactNode } from "react";
import { useReveal } from "@/hooks/use-reveal";
import { cn } from "@/lib/utils";

/**
 * Envolve conteúdo para animar sua entrada quando cruza a viewport.
 * Use `delay` (ms) para escalonar cards em cascata.
 */
export function Reveal({
  children,
  delay = 0,
  as: Component = "div",
  className,
  style,
  ...rest
}: {
  children: ReactNode;
  delay?: number;
  as?: ElementType;
  className?: string;
} & Omit<ComponentPropsWithoutRef<"div">, "children" | "className" | "id">) {
  const { id, className: revealClassName, style: revealStyle } = useReveal({ delay });

  return (
    <Component id={id} className={cn(revealClassName, className)} style={{ ...revealStyle, ...style }} {...rest}>
      {children}
    </Component>
  );
}
