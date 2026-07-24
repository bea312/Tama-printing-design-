import { ArrowUpDown } from 'lucide-react';

export default function SortTh({ k, label, sortKey, onSort }) {
  return (
    <th style={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => onSort(k)}>
      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        {label}
        <ArrowUpDown size={11} style={{ opacity: sortKey === k ? 1 : 0.3, color: sortKey === k ? 'var(--brand-blue-light)' : undefined }} />
      </span>
    </th>
  );
}
