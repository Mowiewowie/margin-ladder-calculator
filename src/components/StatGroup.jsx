/**
 * A titled group of related Stats. Used to organize the summary into logical
 * sections instead of one flat wall of boxes.
 */
export default function StatGroup({ title, children }) {
  return (
    <div className="stat-group">
      <h3 className="stat-group__title">{title}</h3>
      <div className="stats-grid">{children}</div>
    </div>
  )
}
