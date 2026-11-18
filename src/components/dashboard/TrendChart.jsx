const fmtDay = (key, opts = { day: "numeric", month: "short" }) =>
  new Date(`${key}T00:00:00Z`).toLocaleDateString(undefined, { ...opts, timeZone: "UTC" });

// Round the axis max up to a readable step so gridlines land on whole numbers.
const niceMax = (n) => {
  if (n <= 4) return 4;
  const step = 10 ** Math.floor(Math.log10(n));
  const nice = [1, 2, 2.5, 5, 10].map((m) => m * step).find((v) => v >= n);
  return Math.ceil(nice / 2) * 2;
};

// Single series: requests per day. One hue, thin rounded columns rising from one baseline on load.
export default function TrendChart({ data, height = 168 }) {
  const max = niceMax(Math.max(...data.map((d) => d.count), 0));
  const ticks = [max, max / 2, 0];
  const total = data.reduce((s, d) => s + d.count, 0);
  const peak = data.reduce((best, d) => (d.count > best.count ? d : best), data[0]);

  return (
    <figure>
      <div className="flex items-baseline justify-between gap-3">
        <figcaption className="font-semibold">Requests per day</figcaption>
        <p className="text-sm text-muted">
          <span className="font-semibold text-ink tabular-nums">{total}</span> in the last {data.length} days
          {peak.count > 1 && (
            <span className="hidden sm:inline">
              {" "}
              · busiest {fmtDay(peak.date)} ({peak.count})
            </span>
          )}
        </p>
      </div>

      <div className="mt-5 flex gap-2" aria-hidden="true">
        {/* Y axis labels */}
        <div className="relative w-6 shrink-0 text-right text-[0.6875rem] text-muted tabular-nums" style={{ height }}>
          {ticks.map((t) => (
            <span key={t} className="absolute right-0 -translate-y-1/2" style={{ top: `${(1 - t / max) * 100}%` }}>
              {t}
            </span>
          ))}
        </div>

        <div className="relative min-w-0 flex-1">
          {/* Gridlines: recessive */}
          {ticks.map((t) => (
            <span
              key={t}
              className={`absolute inset-x-0 h-px ${t === 0 ? "bg-line-strong" : "bg-line/70"}`}
              style={{ top: `${(1 - t / max) * 100}%` }}
            />
          ))}

          {total === 0 && (
            <p className="absolute inset-x-0 top-1/3 text-center text-sm text-muted">No requests in the last {data.length} days</p>
          )}

          <div className="relative flex items-end gap-[2px]" style={{ height }}>
            {data.map((d, i) => (
              <div key={d.date} className="flex h-full flex-1 flex-col items-center justify-end">
                {d.count ? (
                  <>
                    {/* Value sits above each column, so nothing depends on hover */}
                    <span
                      className="animate-fade mb-0.5 text-[0.6875rem] leading-none font-semibold text-ink-soft tabular-nums"
                      style={{ animationDelay: `${450 + i * 18}ms`, animationDuration: "0.4s" }}
                    >
                      {d.count}
                    </span>
                    <span
                      className="animate-grow-up w-full max-w-6 shrink-0 rounded-t-[4px] bg-chart"
                      style={{ height: `max(${(d.count / max) * 100}%, 3px)`, animationDelay: `${i * 18}ms` }}
                    />
                  </>
                ) : (
                  // Zero days keep a faint stub so the timeline reads as 30 days, not empty space
                  <span className="h-[3px] w-full max-w-6 rounded-full bg-line-strong/70" />
                )}
              </div>
            ))}
          </div>

          {/* Weekly date ticks, right-aligned to today */}
          <div className="relative mt-2 h-4 text-[0.6875rem] text-muted">
            {data.map((d, i) => {
              const fromEnd = data.length - 1 - i;
              if (fromEnd % 7 !== 0) return null;
              const left = ((i + 0.5) / data.length) * 100;
              return (
                <span
                  key={d.date}
                  className={`absolute -translate-x-1/2 whitespace-nowrap ${fromEnd > 14 ? "hidden sm:inline" : ""}`}
                  style={{ left: `${Math.min(Math.max(left, 4), 96)}%` }}
                >
                  {fromEnd === 0 ? "Today" : fmtDay(d.date)}
                </span>
              );
            })}
          </div>
        </div>
      </div>

      {/* Same data as a table for screen readers */}
      <table className="sr-only">
        <caption>Appointment requests per day, last {data.length} days</caption>
        <thead>
          <tr>
            <th>Date</th>
            <th>Requests</th>
          </tr>
        </thead>
        <tbody>
          {data.map((d) => (
            <tr key={d.date}>
              <td>{fmtDay(d.date, { day: "numeric", month: "long", year: "numeric" })}</td>
              <td>{d.count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
