import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { PageHeader } from '@/components/ui/PageHeader'
import { describe, it, expect } from 'vitest'

const renderWithRouter = (ui: React.ReactElement) => {
  return render(<BrowserRouter>{ui}</BrowserRouter>)
}

describe('PageHeader', () => {
  it('renders title', () => {
    renderWithRouter(<PageHeader title="Presupuestos" />)
    expect(screen.getByText('Presupuestos')).toBeInTheDocument()
  })

  it('renders add button when addLink is provided', () => {
    renderWithRouter(<PageHeader title="Clientes" addLink="/clients/new" addLabel="+ Nuevo Cliente" />)
    expect(screen.getByText('+ Nuevo Cliente')).toBeInTheDocument()
    expect(screen.getByRole('link')).toHaveAttribute('href', '/clients/new')
  })

  it('renders default add button label when addLink is provided without addLabel', () => {
    renderWithRouter(<PageHeader title="Materiales" addLink="/materials/new" />)
    expect(screen.getByText('+ Nuevo')).toBeInTheDocument()
  })

  it('renders children', () => {
    renderWithRouter(
      <PageHeader title="Dashboard">
        <button>Acción extra</button>
      </PageHeader>
    )
    expect(screen.getByText('Acción extra')).toBeInTheDocument()
  })

  it('does not render add button when addLink is not provided', () => {
    renderWithRouter(<PageHeader title="Dashboard" />)
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
  })
})
