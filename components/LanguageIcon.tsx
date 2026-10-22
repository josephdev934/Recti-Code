'use client';

import { useState } from 'react';
import { getLanguageIcon, getLanguageIconUrl } from '@/lib/languageIcons';

interface LanguageIconProps {
  language: string;
  className?: string;
}

// Shows the language's logo, falling back to the emoji if there is no logo or it fails to load
export default function LanguageIcon({ language, className = 'w-5 h-5' }: LanguageIconProps) {
  const [failed, setFailed] = useState(false);
  const url = getLanguageIconUrl(language);

  if (!url || failed) {
    return <span className="text-sm leading-none">{getLanguageIcon(language)}</span>;
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt={`${language} logo`}
      className={className}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}
