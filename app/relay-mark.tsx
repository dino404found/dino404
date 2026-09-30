export default function RelayMark({ mode = "idle", className = "" }: {
  mode?: "idle" | "searching" | "complete";
  className?: string;
}) {
  return <span className={`relay-mark relay-${mode} ${className}`} aria-hidden="true">
    {[0, 1, 2, 3].map(i => <i key={i} />)}
  </span>;
}
