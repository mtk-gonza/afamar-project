import { render, screen } from '@testing-library/react'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { describe, it, expect } from 'vitest'

describe('StatusBadge', () => {
  it('renders badge with status text', () => {
    render(<StatusBadge status="APPROVED" />)
    expect(screen.getByText('Aprobado')).toBeInTheDocument()
  })

  it('uses custom label when provided', () => {
    render(<StatusBadge status="CUSTOM" labels={{ CUSTOM: 'Mi estado' }} />)
    expect(screen.getByText('Mi estado')).toBeInTheDocument()
  })

  it('falls back to status key when no translation', () => {
    render(<StatusBadge status="UNKNOWN_STATUS" />)
    expect(screen.getByText('UNKNOWN_STATUS')).toBeInTheDocument()
  })
})