/** Decorative, compositor-animated signal field; separate from the game canvas. */
export default function SignalBackground() {
  return <div className="signal-background" aria-hidden="true">
    <div className="ambient-wash ambient-wash-lime" />
    <div className="ambient-wash ambient-wash-mint" />
    <div className="ambient-grid" />
    <div className="ambient-orbit ambient-orbit-east">
      <i className="orbit-frame" /><i className="orbit-frame orbit-frame-inner" />
      <i className="orbit-packet" /><i className="orbit-packet orbit-packet-second" />
      <span className="orbit-relay"><i /><i /><i /><i /></span>
    </div>
    <div className="ambient-orbit ambient-orbit-west">
      <i className="orbit-frame" /><i className="orbit-frame orbit-frame-inner" />
      <i className="orbit-packet" /><i className="orbit-packet orbit-packet-second" />
      <span className="orbit-relay"><i /><i /><i /><i /></span>
    </div>
    <div className="ambient-pixels">{Array.from({length: 8}, (_, i) => <i key={i} />)}</div>
    <div className="ambient-reading-light" />
  </div>;
}
