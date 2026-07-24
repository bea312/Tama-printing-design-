import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Package } from 'lucide-react';
import StatCard from './StatCard';

describe('StatCard', () => {
  it('renders the label', () => {
    render(<StatCard label="Total Revenue" value="RWF 50,000" icon={Package} color="blue" />);
    expect(screen.getByText('Total Revenue')).toBeInTheDocument();
  });

  it('renders the value', () => {
    render(<StatCard label="Products" value="42" icon={Package} color="green" />);
    expect(screen.getByText('42')).toBeInTheDocument();
  });

  it('applies the correct color class to the card', () => {
    const { container } = render(
      <StatCard label="Sales" value="100" icon={Package} color="gold" />
    );
    expect(container.firstChild).toHaveClass('stat-card', 'gold');
  });

  it('renders a change indicator when change prop is provided', () => {
    render(
      <StatCard label="Profit" value="RWF 10,000" icon={Package} color="purple" change={15} changeSuffix="%" />
    );
    expect(screen.getByText(/15%/)).toBeInTheDocument();
  });

  it('does not render a change indicator when change is undefined', () => {
    const { container } = render(
      <StatCard label="Stock" value="200" icon={Package} color="cyan" />
    );
    // .stat-change div should not exist
    expect(container.querySelector('.stat-change')).not.toBeInTheDocument();
  });
});
