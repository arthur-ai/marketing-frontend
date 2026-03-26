import React from 'react'
import { render, screen } from '@testing-library/react'

const mockPush = jest.fn()

jest.mock('next/navigation', () => ({
  usePathname: jest.fn(),
  useRouter: jest.fn(() => ({ push: mockPush })),
}))

jest.mock('@/hooks/useApi', () => ({
  usePendingApprovals: jest.fn(),
}))

jest.mock('@/components/auth/UserProfile', () => ({
  UserProfile: () => <div data-testid="user-profile" />,
}))

import { usePathname } from 'next/navigation'
import { usePendingApprovals } from '@/hooks/useApi'
import { DashboardAppBar } from '@/components/layout/DashboardAppBar'

const mockUsePathname = usePathname as jest.MockedFunction<typeof usePathname>
const mockUsePendingApprovals = usePendingApprovals as jest.MockedFunction<typeof usePendingApprovals>

const NAV_LABELS = ['Jobs', 'Content', 'Pipeline', 'Approvals', 'Brand Kit', 'Settings']

describe('DashboardAppBar', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUsePathname.mockReturnValue('/')
    mockUsePendingApprovals.mockReturnValue({ data: { data: { pending: 0 } } } as any)
  })

  it('renders all 6 nav items', () => {
    render(<DashboardAppBar />)
    NAV_LABELS.forEach((label) => {
      expect(screen.getAllByText(label).length).toBeGreaterThanOrEqual(1)
    })
  })

  it('marks Jobs as active (aria-current=page) when on root path', () => {
    render(<DashboardAppBar />)
    const jobsButtons = screen.getAllByRole('button', { name: 'Jobs' })
    const activeBtn = jobsButtons.find((el) => el.getAttribute('aria-current') === 'page')
    expect(activeBtn).toBeTruthy()
  })

  it('does not show pending badge when pendingCount is 0', () => {
    render(<DashboardAppBar />)
    expect(screen.queryByText(/^\d+$/)).toBeNull()
  })

  it('shows pending count badge on Approvals when pendingCount > 0', () => {
    mockUsePathname.mockReturnValue('/approvals')
    mockUsePendingApprovals.mockReturnValue({ data: { data: { pending: 3 } } } as any)
    render(<DashboardAppBar />)
    const badges = screen.getAllByText('3')
    expect(badges.length).toBeGreaterThanOrEqual(1)
  })
})
