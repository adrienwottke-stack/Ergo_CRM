// Mini-Wochenverlauf: ein Farbton (Magnitude), aktuelle Woche im Akzent.

export default function SparkBars({
  values,
  className,
}: {
  values: number[];
  className?: string;
}) {
  const max = Math.max(1, ...values);
  const barWidth = 8;
  const gap = 4;
  const width = values.length * (barWidth + gap) - gap;
  const height = 36;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={className}
      aria-hidden
      preserveAspectRatio="xMinYMax meet"
    >
      {values.map((value, index) => {
        const barHeight =
          value === 0 ? 2.5 : Math.max(4, (value / max) * height);
        return (
          <rect
            key={index}
            x={index * (barWidth + gap)}
            y={height - barHeight}
            width={barWidth}
            height={barHeight}
            rx={2}
            className={
              index === values.length - 1 ? "fill-navy-600" : "fill-navy-200"
            }
          />
        );
      })}
    </svg>
  );
}
