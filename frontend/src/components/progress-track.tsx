import { clampPercent, formatPercent } from "@/lib/format";

interface ProgressTrackProps {
  progress: number;
  expected: number;
}

function ProgressTrack({ progress, expected }: ProgressTrackProps) {
  const actual = clampPercent(progress);
  const planned = clampPercent(expected);
  const gap = Math.max(0, planned - actual);

  return (
    <div className="flex flex-col gap-1.5">
      <div
        role="progressbar"
        aria-label="Progres proker"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(actual)}
        aria-valuetext={`${formatPercent(actual)}, seharusnya ${formatPercent(planned)}`}
        className="relative h-3"
      >
        <div className="absolute inset-0 overflow-hidden rounded-sm bg-surface-muted">
          <div
            className="absolute inset-y-0 left-0 bg-primary"
            style={{ width: `${actual}%` }}
          />
          {gap > 0 && (
            <div
              className="absolute inset-y-0 bg-hatch"
              style={{ left: `${actual}%`, width: `${gap}%` }}
            />
          )}
        </div>
        <div
          aria-hidden
          className="absolute -inset-y-1 w-0.5 -translate-x-1/2 rounded-sm bg-secondary"
          style={{ left: `${planned}%` }}
        />
      </div>
      <p className="text-sm tabular-nums text-fg-muted">
        Progres {formatPercent(actual)} · Seharusnya {formatPercent(planned)}
        {gap > 0 && ` · Selisih ${formatPercent(gap)} dari jadwal`}
      </p>
    </div>
  );
}

export { ProgressTrack };
