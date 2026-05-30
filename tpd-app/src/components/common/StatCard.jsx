import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export default function StatCard({ label, value, icon: Icon, color = 'blue', change, changeSuffix = '' }) {
  const ChangeIcon = change > 0 ? TrendingUp : change < 0 ? TrendingDown : Minus;
  const changeClass = change > 0 ? 'up' : change < 0 ? 'down' : 'neutral';

  return (
    <div className={`stat-card ${color}`}>
      <div className={`stat-icon ${color}`}>
        <Icon size={22} />
      </div>
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
      {change !== undefined && (
        <div className={`stat-change ${changeClass}`}>
          <ChangeIcon size={12} />
          {Math.abs(change)}{changeSuffix} {change >= 0 ? 'this month' : 'this month'}
        </div>
      )}
    </div>
  );
}
