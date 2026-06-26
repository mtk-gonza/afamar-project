import { describe, it, expect } from 'vitest'
import { formatARS, formatUSD, formatDate } from '@/utils/formatCurrency'
import { calcM2 } from '@/utils/calcM2'
import { t } from '@/utils/translate'

describe('formatARS', () => {
  it('formats ARS correctly', () => {
    expect(formatARS(1234567.89)).toBe('$ 1234567.89')
  })

  it('handles zero', () => {
    expect(formatARS(0)).toBe('$ 0.00')
  })

  it('handles negative numbers', () => {
    expect(formatARS(-1000)).toBe('$ -1000.00')
  })
})

describe('formatUSD', () => {
  it('formats USD correctly', () => {
    expect(formatUSD(12345.67)).toBe('US$ 12345.67')
  })

  it('returns dash for zero or negative', () => {
    expect(formatUSD(0)).toBe('-')
    expect(formatUSD(-100)).toBe('-')
  })
})

describe('formatDate', () => {
  it('formats ISO date to DD/MM/YYYY', () => {
    expect(formatDate('2024-01-15')).toBe('15/01/2024')
  })

  it('returns empty string for invalid date', () => {
    expect(formatDate('')).toBe('')
  })
})

describe('calcM2', () => {
  it('calculates m2 from cm', () => {
    expect(calcM2(100, 200)).toBe(2)
  })

  it('calculates m2 from meters', () => {
    expect(calcM2(1, 2, 'm')).toBe(2)
  })

  it('returns 0 for zero dimensions', () => {
    expect(calcM2(0, 1000)).toBe(0)
  })
})

describe('translate t()', () => {
  it('translates known keys', () => {
    expect(t('PENDING')).toBe('Pendiente')
    expect(t('APPROVED')).toBe('Aprobado')
    expect(t('URGENT')).toBe('Urgente')
  })

  it('returns key for unknown values', () => {
    expect(t('UNKNOWN_KEY')).toBe('UNKNOWN_KEY')
  })
})