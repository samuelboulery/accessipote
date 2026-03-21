import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Toast from './Toast';
import type { ToastMessage } from '../types';

describe('Toast', () => {
  const mockDismiss = vi.fn();

  it('should render a container with role status and aria-live polite', () => {
    const toasts: Record<string, ToastMessage> = {};

    const { container } = render(
      <Toast toasts={toasts} onDismiss={mockDismiss} />
    );

    const statusElement = container.querySelector('[role="status"]');
    expect(statusElement).toBeInTheDocument();
    expect(statusElement).toHaveAttribute('aria-live', 'polite');
  });

  it('should display each toast message', () => {
    const toasts: Record<string, ToastMessage> = {
      'toast-1': { id: 'toast-1', message: 'Success message', type: 'success' },
      'toast-2': { id: 'toast-2', message: 'Error message', type: 'error' },
    };

    render(<Toast toasts={toasts} onDismiss={mockDismiss} />);

    expect(screen.getByText('Success message')).toBeInTheDocument();
    expect(screen.getByText('Error message')).toBeInTheDocument();
  });

  it('should apply correct background color for success type', () => {
    const toasts: Record<string, ToastMessage> = {
      'toast-1': { id: 'toast-1', message: 'Success', type: 'success' },
    };

    const { container } = render(
      <Toast toasts={toasts} onDismiss={mockDismiss} />
    );

    const toast = container.querySelector('[data-testid="toast-toast-1"]');
    expect(toast).toHaveClass('bg-green-100');
    expect(toast).toHaveClass('text-green-800');
    expect(toast).toHaveClass('border-green-300');
  });

  it('should apply correct background color for error type', () => {
    const toasts: Record<string, ToastMessage> = {
      'toast-1': { id: 'toast-1', message: 'Error', type: 'error' },
    };

    const { container } = render(
      <Toast toasts={toasts} onDismiss={mockDismiss} />
    );

    const toast = container.querySelector('[data-testid="toast-toast-1"]');
    expect(toast).toHaveClass('bg-red-100');
    expect(toast).toHaveClass('text-red-800');
    expect(toast).toHaveClass('border-red-300');
  });

  it('should apply correct background color for info type', () => {
    const toasts: Record<string, ToastMessage> = {
      'toast-1': { id: 'toast-1', message: 'Info', type: 'info' },
    };

    const { container } = render(
      <Toast toasts={toasts} onDismiss={mockDismiss} />
    );

    const toast = container.querySelector('[data-testid="toast-toast-1"]');
    expect(toast).toHaveClass('bg-blue-100');
    expect(toast).toHaveClass('text-blue-800');
    expect(toast).toHaveClass('border-blue-300');
  });

  it('should have a close button with aria-label', () => {
    const toasts: Record<string, ToastMessage> = {
      'toast-1': { id: 'toast-1', message: 'Message', type: 'info' },
    };

    render(<Toast toasts={toasts} onDismiss={mockDismiss} />);

    const closeButton = screen.getByRole('button', { name: /Fermer la notification/i });
    expect(closeButton).toBeInTheDocument();
  });

  it('should call onDismiss with the correct id when close button is clicked', async () => {
    const user = userEvent.setup();
    const toasts: Record<string, ToastMessage> = {
      'toast-1': { id: 'toast-1', message: 'Message', type: 'info' },
    };

    render(<Toast toasts={toasts} onDismiss={mockDismiss} />);

    const closeButton = screen.getByRole('button', { name: /Fermer la notification/i });
    await user.click(closeButton);

    expect(mockDismiss).toHaveBeenCalledWith('toast-1');
  });

  it('should render success icon for success type', () => {
    const toasts: Record<string, ToastMessage> = {
      'toast-1': { id: 'toast-1', message: 'Success', type: 'success' },
    };

    const { container } = render(
      <Toast toasts={toasts} onDismiss={mockDismiss} />
    );

    const icon = container.querySelector('svg');
    expect(icon).toBeInTheDocument();
  });

  it('should render error icon for error type', () => {
    const toasts: Record<string, ToastMessage> = {
      'toast-1': { id: 'toast-1', message: 'Error', type: 'error' },
    };

    const { container } = render(
      <Toast toasts={toasts} onDismiss={mockDismiss} />
    );

    const icon = container.querySelector('svg');
    expect(icon).toBeInTheDocument();
  });

  it('should render info icon for info type', () => {
    const toasts: Record<string, ToastMessage> = {
      'toast-1': { id: 'toast-1', message: 'Info', type: 'info' },
    };

    const { container } = render(
      <Toast toasts={toasts} onDismiss={mockDismiss} />
    );

    const icon = container.querySelector('svg');
    expect(icon).toBeInTheDocument();
  });

  it('should render empty when no toasts', () => {
    const { container } = render(
      <Toast toasts={{}} onDismiss={mockDismiss} />
    );

    const statusElement = container.querySelector('[role="status"]');
    expect(statusElement).toBeEmptyDOMElement();
  });

  it('should have motion-safe transition class for animation', () => {
    const toasts: Record<string, ToastMessage> = {
      'toast-1': { id: 'toast-1', message: 'Message', type: 'info' },
    };

    const { container } = render(
      <Toast toasts={toasts} onDismiss={mockDismiss} />
    );

    const toast = container.querySelector('[data-testid="toast-toast-1"]');
    expect(toast).toHaveClass('motion-safe:transition-all');
  });
});
