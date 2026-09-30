export default function WishCake({ progress }: { progress: number }) {
  return <div className={`wish-cake ${progress >= 100 ? "wish-complete" : ""}`}>
    <svg viewBox="0 0 320 270" role="img" aria-label={progress >= 100 ? "Birthday cake with all candles extinguished" : "Birthday cake with glowing candles"}>
      <ellipse cx="160" cy="247" rx="145" ry="17" fill="#d9dece" />
      <path d="M35 171Q160 150 285 171V228Q160 263 35 228Z" fill="#c48783" />
      <ellipse cx="160" cy="171" rx="125" ry="28" fill="#f7e8d5" />
      <path d="M35 171Q55 198 75 179Q92 218 112 183Q137 203 156 182Q178 220 199 183Q224 206 244 180Q267 199 285 171" fill="#f7e8d5" />
      <path d="M69 112Q160 95 251 112V164Q160 189 69 164Z" fill="#dab0a3" />
      <ellipse cx="160" cy="112" rx="91" ry="22" fill="#fff3df" />
      <path d="M69 112Q85 140 103 119Q122 155 141 124Q158 140 178 125Q202 150 218 119Q240 138 251 112" fill="#fff3df" />
      {[110, 160, 210].map((x, index) => <g key={x} className={`wish-candle ${progress >= (index + 1) * 100 / 3 ? "is-out" : ""}`}>
        <rect x={x - 5} y="65" width="10" height="49" rx="3" fill={index === 1 ? "#8a9f88" : "#b97378"} />
        <path d={`M${x - 4} 77l8 -5m-8 20l8 -5m-8 20l8 -5`} stroke="#fff3df" strokeWidth="3" />
        <path d={`M${x} 65v-7`} stroke="#64534c" strokeWidth="2" />
        <g className="wish-flame"><ellipse cx={x} cy="47" rx="15" ry="21" fill="#edc477" opacity=".18" /><path d={`M${x} 27C${x - 18} 47 ${x - 9} 59 ${x} 59C${x + 13} 59 ${x + 13} 43 ${x} 27`} fill="#dca957" /><ellipse cx={x} cy="51" rx="4" ry="7" fill="#fff4c8" /></g>
        <path className="wish-smoke" d={`M${x} 58q-10 -12 0 -23t0 -19`} fill="none" stroke="#9d9c91" strokeWidth="2" strokeLinecap="round" />
      </g>)}
      {[80, 120, 160, 200, 240].map(x => <path key={x} d={`M${x} 213c-10 -12 -18 2 0 12c18 -10 10 -24 0 -12`} fill="#fae9db" opacity=".8" />)}
    </svg>
    {progress >= 100 && <div className="wish-hearts" aria-hidden="true">{[0,1,2,3,4,5].map(index => <span key={index} style={{ left: `${12 + index * 15}%`, animationDelay: `${index * 140}ms` }}>♡</span>)}</div>}
  </div>;
}
