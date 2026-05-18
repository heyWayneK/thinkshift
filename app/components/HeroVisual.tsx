const BARS = [38, 52, 47, 63, 71, 66, 84, 92, 100];

export default function HeroVisual() {
  return (
    <div className="card animate-float relative w-full overflow-hidden p-5 sm:p-6">
      {/* window chrome */}
      <div className="mb-5 flex items-center gap-2">
        <span className="h-3 w-3 rounded-full bg-white/15" />
        <span className="h-3 w-3 rounded-full bg-white/15" />
        <span className="h-3 w-3 rounded-full bg-white/15" />
        <span className="ml-3 font-mono text-[11px] text-muted">
          thinkshift / growth-engine
        </span>
        <span className="ml-auto flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent/10 px-2.5 py-1 text-[11px] font-medium text-accent">
          <span className="animate-dot h-1.5 w-1.5 rounded-full bg-accent" />
          live
        </span>
      </div>

      <div className="grid gap-4 sm:grid-cols-5">
        {/* Architecture map */}
        <div className="card sm:col-span-2 p-4">
          <p className="mb-3 font-mono text-[10px] uppercase tracking-widest text-muted">
            Platform architecture
          </p>
          <svg viewBox="0 0 200 150" className="w-full" aria-hidden>
            <defs>
              <linearGradient id="edge" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#34d399" />
                <stop offset="100%" stopColor="#22d3ee" />
              </linearGradient>
            </defs>
            {[
              "M100 28 L40 70",
              "M100 28 L160 70",
              "M40 70 L100 120",
              "M160 70 L100 120",
              "M40 70 L160 70",
            ].map((d, i) => (
              <path
                key={d}
                d={d}
                stroke="url(#edge)"
                strokeWidth="1.5"
                fill="none"
                className="animate-line"
                style={{ animationDelay: `${i * 0.15}s`, opacity: 0.6 }}
              />
            ))}
            {[
              [100, 28, "App"],
              [40, 70, "API"],
              [160, 70, "DB"],
              [100, 120, "Edge"],
            ].map(([x, y, label], i) => (
              <g key={label as string}>
                <circle
                  cx={x as number}
                  cy={y as number}
                  r="13"
                  fill="#0d0f12"
                  stroke="url(#edge)"
                  strokeWidth="1.5"
                />
                <circle
                  cx={x as number}
                  cy={y as number}
                  r="3"
                  fill="#34d399"
                  className="animate-dot"
                  style={{ animationDelay: `${i * 0.3}s` }}
                />
                <text
                  x={x as number}
                  y={(y as number) + 26}
                  textAnchor="middle"
                  className="fill-muted font-mono"
                  fontSize="9"
                >
                  {label}
                </text>
              </g>
            ))}
          </svg>
        </div>

        {/* Revenue dashboard */}
        <div className="card sm:col-span-3 p-4">
          <div className="mb-3 flex items-end justify-between">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-widest text-muted">
                Monthly revenue
              </p>
              <p className="mt-1 text-2xl font-semibold tracking-tight">
                $1.24M
              </p>
            </div>
            <span className="rounded-md bg-accent/10 px-2 py-1 text-xs font-medium text-accent">
              ▲ 218% QoQ
            </span>
          </div>
          <div className="flex h-28 items-end gap-2">
            {BARS.map((h, i) => (
              <div
                key={i}
                className="animate-bar flex-1 rounded-t bg-gradient-to-t from-accent/40 to-accent-2"
                style={{ height: `${h}%`, animationDelay: `${0.3 + i * 0.08}s` }}
              />
            ))}
          </div>
          <div className="mt-4 grid grid-cols-3 gap-3 border-t border-white/5 pt-3">
            {[
              ["Traffic", "412K"],
              ["Conv. rate", "4.8%"],
              ["CAC payback", "1.9mo"],
            ].map(([k, v]) => (
              <div key={k}>
                <p className="text-[10px] uppercase tracking-wider text-muted">
                  {k}
                </p>
                <p className="mt-0.5 text-sm font-semibold">{v}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
