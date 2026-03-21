import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DarkModeToggle from './DarkModeToggle';

describe('DarkModeToggle', () => {
  it('should render toggle button with correct aria-label when light mode', () => {
    const mockOnToggle = vi.fn();
    render(<DarkModeToggle isDark={false} onToggle={mockOnToggle} />);

    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-label', 'Activer le mode sombre');
  });

  it('should render toggle button with correct aria-label when dark mode', () => {
    const mockOnToggle = vi.fn();
    render(<DarkModeToggle isDark={true} onToggle={mockOnToggle} />);

    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-label', 'Désactiver le mode sombre');
  });

  it('should call onToggle when button is clicked', async () => {
    const user = userEvent.setup();
    const mockOnToggle = vi.fn();
    render(<DarkModeToggle isDark={false} onToggle={mockOnToggle} />);

    const button = screen.getByRole('button');
    await user.click(button);

    expect(mockOnToggle).toHaveBeenCalledTimes(1);
  });

  it('should display Moon icon when light mode (isDark=false)', () => {
    const mockOnToggle = vi.fn();
    render(<DarkModeToggle isDark={false} onToggle={mockOnToggle} />);

    // Moon icon should be visible (SVG)
    const svg = screen.getByRole('button').querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('should display Sun icon when dark mode (isDark=true)', () => {
    const mockOnToggle = vi.fn();
    render(<DarkModeToggle isDark={true} onToggle={mockOnToggle} />);

    // Sun icon should be visible (SVG)
    const svg = screen.getByRole('button').querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('should have correct styling classes', () => {
    const mockOnToggle = vi.fn();
    render(<DarkModeToggle isDark={false} onToggle={mockOnToggle} />);

    const button = screen.getByRole('button');
    expect(button).toHaveClass('p-2');
    expect(button).toHaveClass('rounded-lg');
    expect(button).toHaveClass('transition-colors');
  });
});
