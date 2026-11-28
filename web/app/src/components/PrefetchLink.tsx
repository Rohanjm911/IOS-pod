import { Link, NavLink, type LinkProps, type NavLinkProps } from 'react-router';
import { preloadRoute } from '@/pageRegistry';

function warm(to: LinkProps['to']) {
  preloadRoute(typeof to === 'string' ? to : (to.pathname ?? ''));
}

function shouldUseViewTransition(): boolean {
  return (
    typeof document !== 'undefined' &&
    'startViewTransition' in document &&
    typeof window !== 'undefined' &&
    !window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  );
}

/** A link that loads its page's chunk on hover or focus (prompt §3, "Prefetch"). */
export function PrefetchLink({ to, onPointerEnter, onFocus, viewTransition, ...rest }: LinkProps) {
  return (
    <Link
      to={to}
      viewTransition={viewTransition ?? shouldUseViewTransition()}
      onPointerEnter={(e) => {
        warm(to);
        onPointerEnter?.(e);
      }}
      onFocus={(e) => {
        warm(to);
        onFocus?.(e);
      }}
      {...rest}
    />
  );
}

export function PrefetchNavLink({ to, onPointerEnter, onFocus, viewTransition, ...rest }: NavLinkProps) {
  return (
    <NavLink
      to={to}
      viewTransition={viewTransition ?? shouldUseViewTransition()}
      onPointerEnter={(e) => {
        warm(to);
        onPointerEnter?.(e);
      }}
      onFocus={(e) => {
        warm(to);
        onFocus?.(e);
      }}
      {...rest}
    />
  );
}
