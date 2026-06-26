import { render, screen } from '@testing-library/react'
import { FormActions } from '@/components/ui/FormActions'
import { describe, it, expect, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'

const renderWithRouter = (ui: React.ReactElement) => {
  return render(<MemoryRouter>{ui}</MemoryRouter>)
}

describe('FormActions', () => {
  it('renders submit and cancel buttons', () => {
    renderWithRouter(<FormActions />)
    expect(screen.getByRole('button', { name: 'Guardar' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeInTheDocument()
  })

  it('shows loading state on submit button', () => {
    renderWithRouter(<FormActions loading />)
    expect(screen.getByRole('button', { name: 'Guardando...' })).toBeDisabled()
  })

  it('uses custom submit label', () => {
    renderWithRouter(<FormActions submitLabel="Crear Presupuesto" />)
    expect(screen.getByRole('button', { name: 'Crear Presupuesto' })).toBeInTheDocument()
  })

  it('uses custom cancel label', () => {
    renderWithRouter(<FormActions cancelLabel="Volver" />)
    expect(screen.getByRole('button', { name: 'Volver' })).toBeInTheDocument()
  })

  it('calls onCancel when cancel button is clicked', () => {
    const handleCancel = vi.fn()
    renderWithRouter(<FormActions onCancel={handleCancel} />)
    screen.getByRole('button', { name: 'Cancelar' }).click()
    expect(handleCancel).toHaveBeenCalledTimes(1)
  })
})
