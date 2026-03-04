export default function StatsCard({ icon, label, value, sub, variant }) {
  return (
    <div className={`stat-card${variant ? ' ' + variant : ''}`}>
      <div className="stat-card-content">
        <span className="stat-label">{label}</span>
        <span className="stat-value">{value}</span>
        {sub && <span className="stat-unit">{sub}</span>}
      </div>
      <span className="stat-icon">{icon}</span>
    </div>
  )
}
