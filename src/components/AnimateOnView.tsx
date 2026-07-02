"use client";

import { useEffect, useRef } from "react";

interface Props extends React.HTMLAttributes<HTMLDivElement> {
  delay?: number; // ms, for staggered entrance
}

export default function AnimateOnView({
  children,
  className = "",
  delay = 0,
  style,
  ...rest
}: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.style.transitionDelay = delay ? `${delay}ms` : "";
          el.classList.add("in-view");
          observer.unobserve(el);
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [delay]);

  return (
    <div
      ref={ref}
      className={`animate-on-view ${className}`}
      style={style}
      {...rest}
    >
      {children}
    </div>
  );
}
