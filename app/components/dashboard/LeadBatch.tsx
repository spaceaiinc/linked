import { LeadStatus } from '@/lib/types/master'
import { Badge } from '../ui/badge'

interface LeadStatusBadgeProps {
  status: LeadStatus
}

export const LeadStatusBadge: React.FC<LeadStatusBadgeProps> = ({ status }) => {
  // Define colors based on status
  const getBadgeColor = (status: LeadStatus): string => {
    switch (status) {
      case LeadStatus.SEARCHED:
        return 'bg-gray-500 hover:bg-gray-600'
      case LeadStatus.INVITED_FAILED:
        return 'bg-red-500 hover:bg-red-600'
      case LeadStatus.IN_QUEUE:
        return 'bg-blue-500 hover:bg-blue-600'
      case LeadStatus.ALREADY_INVITED:
        return 'bg-yellow-500 hover:bg-yellow-600'
      case LeadStatus.INVITED:
        return 'bg-green-500 hover:bg-green-600'
      case LeadStatus.ACCEPTED:
        return 'bg-blue-300 hover:bg-blue-400'
      case LeadStatus.FOLLOW_UP_SENT_FAILED:
        return 'bg-orange-500 hover:bg-orange-600'
      case LeadStatus.FOLLOW_UP_SENT:
        return 'bg-indigo-500 hover:bg-indigo-600'
      case LeadStatus.REPLIED:
        return 'bg-purple-500 hover:bg-purple-600'
      default:
        return 'bg-gray-500 hover:bg-gray-600'
    }
  }

  return (
    <div className="flex items-center whitespace-nowrap">
      <Badge className={`${getBadgeColor(status)} text-white text-xs`}>
        {LeadStatus[status]}
      </Badge>
    </div>
  )
}
