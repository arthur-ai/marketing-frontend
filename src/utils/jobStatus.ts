export type JobStatus = 'processing' | 'completed' | 'failed' | 'waiting_for_approval' | string

export function getChipStyle(status: JobStatus) {
  switch (status) {
    case 'processing':
      return { bgcolor: '#E8A23820', color: '#E8A238', label: 'Running' }
    case 'completed':
      return { bgcolor: '#4A7C6F20', color: '#4A7C6F', label: 'Complete' }
    case 'failed':
      return { bgcolor: '#C45C3B20', color: '#C45C3B', label: 'Failed' }
    case 'waiting_for_approval':
      return { bgcolor: '#E8A23820', color: '#E8A238', label: 'Needs Approval' }
    default:
      return { bgcolor: 'transparent', color: '#4A4540', label: status }
  }
}
