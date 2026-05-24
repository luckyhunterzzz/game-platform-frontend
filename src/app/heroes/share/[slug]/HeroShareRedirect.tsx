'use client';

import { useEffect } from 'react';

type HeroShareRedirectProps = {
  targetUrl: string;
};

export default function HeroShareRedirect({ targetUrl }: HeroShareRedirectProps) {
  useEffect(() => {
    window.location.replace(targetUrl);
  }, [targetUrl]);

  return null;
}
