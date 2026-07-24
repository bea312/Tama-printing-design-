import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Modal from './Modal';

describe('Modal', () => {
  it('renders title and children when isOpen is true', () => {
    render(
      <Modal isOpen={true} onClose={vi.fn()} title="Product Details">
        <p>Modal content here</p>
      </Modal>
    );
    expect(screen.getByText('Product Details')).toBeInTheDocument();
    expect(screen.getByText('Modal content here')).toBeInTheDocument();
  });

  it('does NOT render anything when isOpen is false', () => {
    render(
      <Modal isOpen={false} onClose={vi.fn()} title="Hidden Modal">
        <p>Should not appear</p>
      </Modal>
    );
    expect(screen.queryByText('Hidden Modal')).not.toBeInTheDocument();
    expect(screen.queryByText('Should not appear')).not.toBeInTheDocument();
  });

  it('calls onClose when the X button is clicked', async () => {
    const onClose = vi.fn();
    render(
      <Modal isOpen={true} onClose={onClose} title="Closeable">
        <p>Content</p>
      </Modal>
    );
    // The X button is the only button in the modal header
    const closeBtn = screen.getAllByRole('button').find((btn) =>
      btn.className.includes('modal-close') || btn.querySelector('svg')
    );
    await userEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('calls onClose when clicking the overlay backdrop', async () => {
    const onClose = vi.fn();
    render(
      <Modal isOpen={true} onClose={onClose} title="Backdrop Close">
        <p>Content</p>
      </Modal>
    );
    // The overlay is the element with className "modal-overlay"
    const overlay = document.querySelector('.modal-overlay');
    await userEvent.click(overlay);
    expect(onClose).toHaveBeenCalled();
  });

  it('accepts a custom maxWidth', () => {
    render(
      <Modal isOpen={true} onClose={vi.fn()} title="Wide Modal" maxWidth="800px">
        <span>wide</span>
      </Modal>
    );
    const box = document.querySelector('.modal-box');
    expect(box.style.maxWidth).toBe('800px');
  });
});
