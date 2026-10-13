'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Scroll reveal. One observer per element, unobserved after it fires, and a
 * no-op for anyone who asked for reduced motion.
 */
export function Reveal({
  children,
  delay,
  as: Tag = 'div',
  className = '',
  ...rest
}: {
  children: React.ReactNode;
  delay?: 1 | 2 | 3 | 4;
  as?: keyof React.JSX.IntrinsicElements;
  className?: string;
} & React.HTMLAttributes<HTMLElement>) {
  const ref = useRef<HTMLElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setShown(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setShown(true);
            io.unobserve(entry.target);
          }
        }
      },
      { rootMargin: '0px 0px -12% 0px', threshold: 0.08 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const classes = [
    'rv',
    delay ? `rv-d${delay}` : '',
    shown ? 'in' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Component = Tag as any;
  return (
    <Component ref={ref} className={classes} {...rest}>
      {children}
    </Component>
  );
}
