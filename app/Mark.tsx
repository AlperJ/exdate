/**
 * The mark sits beside the wordmark at 26px and inside the favicon at 16px. It takes
 * its colour from the surrounding text, so it never needs its own token.
 */
export default function Mark({ size = 26 }: { size?: number }) {
  return (
    <svg
      viewBox="0 0 32 26"
      width={size}
      height={(size * 26) / 32}
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
      className="markmark"
    >
      <rect x="4" y="18" width="5.5" height="4" />
      <rect x="10" y="11" width="11.5" height="4" />
      <rect x="22" y="4" width="6" height="4" />
    </svg>
  );
}
