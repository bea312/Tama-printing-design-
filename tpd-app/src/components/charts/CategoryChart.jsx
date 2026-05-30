import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4', '#ec4899', '#f97316'];

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const p = payload[0];
  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border-color)',
      borderRadius: 'var(--radius-md)',
      padding: '8px 12px',
      fontSize: '0.82rem',
    }}>
      <p style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{p.name}</p>
      <p style={{ color: 'var(--text-secondary)' }}>{p.value} items · {p.payload.pct}%</p>
    </div>
  );
};

export default function CategoryChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie data={data} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="value" paddingAngle={3} stroke="none">
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend
          formatter={(value) => <span style={{ color: 'var(--text-secondary)', fontSize: '0.78rem' }}>{value}</span>}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
