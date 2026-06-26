import { render, screen } from '@testing-library/react'
import { ErrorBlock } from '@/components/ui/ErrorBlock'
import { describe, it, expect, vi } from 'vitest'

describe('ErrorBlock', () => {
  it('renders error message', () => {
    render(<ErrorBlock message="Error de conexión" />)
    expect(screen.getByText('Error de conexión')).toBeInTheDocument()
  })

  it('renders retry button when onRetry is provided', () => {
    const handleRetry = vi.fn()
    render(<ErrorBlock message="Error" onRetry={handleRetry} />)
    expect(screen.getByRole('button', { name: 'Reintentar' })).toBeInTheDocument()
  })

  it('calls onRetry when retry button is clicked', () => {
    const handleRetry = vi.fn()
    render(<ErrorBlock message="Error" onRetry={handleRetry} />)
    screen.getByRole('button', { name: 'Reintentar' }).click()
    expect(handleRetry).toHaveBeenCalledTimes(1)
  })

  it('uses custom retry label', () => {
    const handleRetry = vi.fn()
    render(<ErrorBlock message="Error" onRetry={handleRetry} retryLabel="Intentar de nuevo" />)
    expect(screen.getByRole('button', { name: 'Intentar de nuevo' })).toBeInTheDocument()
  })

  it('does not render retry button when onRetry is not provided', () => {
    render(<ErrorBlock message="Error" />)
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })
})
