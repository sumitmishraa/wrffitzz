// Heading that reveals word by word, blurred to sharp (reference epica2.js).
// The words are decorative spans; the full text stays in aria-label.
export default function SplitHeading({ as: Tag = 'h2', text, className = '', ...rest }) {
  const words = String(text).trim().split(/\s+/);
  return (
    <Tag className={`split ${className}`.trim()} aria-label={text} {...rest}>
      {words.map((word, i) => (
        <span key={`${word}-${i}`}>
          <span className="pal" aria-hidden="true" style={{ '--w': i }}>{word}</span>
          {i < words.length - 1 ? ' ' : null}
        </span>
      ))}
    </Tag>
  );
}
