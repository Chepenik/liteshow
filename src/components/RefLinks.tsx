'use client';

const LINKS = [
  {
    href: 'https://bitcoincoloring.com/',
    label: 'Bitcoin Coloring Book',
    icon: '\uD83C\uDFA8',
  },
  {
    href: 'https://creditcard.exchange.gemini.com/credit-card/apply?referral_code=jljkt4e94',
    label: 'Gemini Card',
    icon: '\u264A',
  },
  {
    href: 'https://www.binmucker.com/',
    label: 'Binmucker',
    icon: '\u26A1',
  },
] as const;

export default function RefLinks() {
  return (
    <nav id="ref-links">
      {LINKS.map(link => (
        <a
          key={link.href}
          href={link.href}
          target="_blank"
          rel="noopener noreferrer"
          className="ref-link"
          onMouseDown={e => e.stopPropagation()}
        >
          <span className="ref-icon">{link.icon}</span>
          <span className="ref-label">{link.label}</span>
        </a>
      ))}
    </nav>
  );
}
