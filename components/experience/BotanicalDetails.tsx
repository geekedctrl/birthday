export function Rose({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 140 220" fill="none" aria-hidden="true" focusable="false">
      <path d="M70 205C58 162 89 125 70 83M69 169C45 160 34 144 32 124C56 127 70 142 69 169ZM72 147C94 140 109 124 110 108C88 112 77 125 72 147Z" stroke="currentColor" strokeWidth="1.4" />
      <path d="M69 92C45 100 23 83 28 63C9 44 31 23 48 29C54 7 82 12 90 29C114 22 126 47 111 63C118 84 91 102 69 92Z" fill="var(--rose-fill, #e8c7bd)" stroke="currentColor" strokeWidth="1.3" />
      <path d="M70 84C49 79 35 66 42 49C46 36 60 33 71 39C84 29 100 43 98 56C98 71 85 82 70 84ZM70 73C54 67 51 54 61 48C70 42 82 48 85 57C84 66 78 69 70 73ZM61 49C57 63 72 66 79 56M28 63C35 79 49 83 70 84M90 29C85 31 78 34 71 39M48 29C47 36 45 43 42 49M111 63C105 68 95 73 87 75" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

function Butterfly({ className }: { className: string }) {
  return (
    <span className={`botanical-butterfly ${className}`}>
      <svg viewBox="0 0 80 64" fill="none" aria-hidden="true" focusable="false">
        <g className="butterfly-wing butterfly-wing-left">
          <path d="M40 33C26 1 3 2 7 23C8 34 20 37 29 37C7 36 16 61 29 52C36 48 38 40 40 33Z" fill="currentColor" fillOpacity=".35" stroke="currentColor" />
          <path d="M12 16L37 33L24 47M20 13L37 33" stroke="currentColor" strokeWidth=".7" />
        </g>
        <g className="butterfly-wing butterfly-wing-right">
          <path d="M40 33C54 1 77 2 73 23C72 34 60 37 51 37C73 36 64 61 51 52C44 48 42 40 40 33Z" fill="currentColor" fillOpacity=".35" stroke="currentColor" />
          <path d="M68 16L43 33L56 47M60 13L43 33" stroke="currentColor" strokeWidth=".7" />
        </g>
        <path d="M40 24V46M40 26L35 18M40 26L45 18" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    </span>
  );
}

export default function BotanicalDetails({ petals = false }: { petals?: boolean }) {
  return (
    <div className="botanical-details" aria-hidden="true">
      <Rose className="garden-rose garden-rose-left" />
      <Rose className="garden-rose garden-rose-right" />
      <Butterfly className="butterfly-one" />
      <Butterfly className="butterfly-two" />
      {petals && <div className="petal-shower">{[0, 1, 2, 3].map((petal) => <span className={`rose-petal rose-petal-${petal}`} key={petal} />)}</div>}
    </div>
  );
}
