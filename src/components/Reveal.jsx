import { useRef } from 'react';
import { useReveal } from '../hooks/useReveal.js';

/** Fade/slide-up on scroll. Same `data-reveal` CSS as the original build. */
export default function Reveal({ as: Tag = 'div', className, children, ...rest }) {
  const ref = useRef(null);
  useReveal(ref);
  return <Tag ref={ref} data-reveal="" className={className} {...rest}>{children}</Tag>;
}
