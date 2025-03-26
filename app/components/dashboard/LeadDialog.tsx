import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '../ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { ExternalLink } from 'lucide-react'
import { format } from 'date-fns'
import { LeadStatusBadge } from './LeadBatch'
import { Badge } from '../ui/badge'
import { LeadForDisplay } from '@/lib/csv'
import { decodeJapaneseOnly } from '@/lib/utils/decode'

interface LeadDetailProps {
  lead: LeadForDisplay | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function LeadDetailModal({ lead, open, onOpenChange }: LeadDetailProps) {
  if (!lead) return null

  const formatDate = (dateString: string) => {
    if (!dateString || dateString === '-infinity') return '-'
    try {
      return format(new Date(dateString), 'yyyy/MM/dd')
    } catch (e) {
      return '-'
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            {lead.full_name || `${lead.first_name} ${lead.last_name}`}
          </DialogTitle>
          <DialogClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"></DialogClose>
        </DialogHeader>

        <div className="flex items-center gap-2 py-2 overflow-hidden">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-blue-600 flex-shrink-0"
          >
            <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
            <rect x="2" y="9" width="4" height="12"></rect>
            <circle cx="4" cy="4" r="2"></circle>
          </svg>
          <a
            href={
              lead.public_identifier
                ? `https://www.linkedin.com/in/${lead.public_identifier}`
                : `https://www.linkedin.com/in/${lead.private_identifier}`
            }
            target="_blank"
            rel="noreferrer"
            className="text-blue-600 hover:underline flex items-center min-w-0"
          >
            <span className="truncate">
              {`https://linkedin.com/in/${lead.public_identifier}`}
            </span>
            <ExternalLink className="ml-1 h-4 w-4 flex-shrink-0" />
          </a>
        </div>

        <Tabs defaultValue="information" className="mt-2">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="information">Information</TabsTrigger>
            <TabsTrigger value="ai-enrichment">✨ AI enrichment</TabsTrigger>
          </TabsList>

          <TabsContent value="information" className="space-y-4">
            {/* Status */}
            <div className="py-2 border-b">
              <div className="mb-2">
                <label className="block text-sm font-medium">Status</label>
                <div className="mt-2">
                  <LeadStatusBadge status={lead.latest_status} />
                </div>
              </div>
            </div>

            {/* Personal Information */}
            <div className="py-4 border-b">
              <h3 className="font-medium mb-4">Personal Information</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium">
                    First Name
                  </label>
                  <div className="mt-1 p-2 bg-gray-50 rounded-md break-words">
                    {lead.first_name || '-'}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium">Last Name</label>
                  <div className="mt-1 p-2 bg-gray-50 rounded-md break-words">
                    {lead.last_name || '-'}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium">Full Name</label>
                  <div className="mt-1 p-2 bg-gray-50 rounded-md break-words">
                    {lead.full_name || '-'}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium">Headline</label>
                  <div className="mt-1 p-2 bg-gray-50 rounded-md break-words">
                    {lead.headline || '-'}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium">Location</label>
                  <div className="mt-1 p-2 bg-gray-50 rounded-md break-words">
                    {lead.location || '-'}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium">Email</label>
                  <div className="mt-1 p-2 bg-gray-50 rounded-md break-words">
                    {lead.emails?.length ? lead.emails.join(', ') : '-'}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium">Phone</label>
                  <div className="mt-1 p-2 bg-gray-50 rounded-md break-words">
                    {lead.phones?.length ? lead.phones.join(', ') : '-'}
                  </div>
                </div>
              </div>
            </div>

            {/* Network Information */}
            <div className="py-4 border-b">
              <h3 className="font-medium mb-4">Network Information</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium">
                    Network Distance
                  </label>
                  <div className="mt-1">
                    {lead.network_distance ? (
                      <Badge className="bg-primary text-white">
                        {lead.network_distance}
                      </Badge>
                    ) : (
                      '-'
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium">
                    Connections
                  </label>
                  <div className="mt-1 p-2 bg-gray-50 rounded-md break-words">
                    {lead.connections_count || '0'}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium">
                    Shared Connections
                  </label>
                  <div className="mt-1 p-2 bg-gray-50 rounded-md break-words">
                    {lead.shared_connections_count || '0'}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium">Followers</label>
                  <div className="mt-1 p-2 bg-gray-50 rounded-md break-words">
                    {lead.follower_count || '0'}
                  </div>
                </div>
              </div>
            </div>

            {/* Post Engagement */}
            <div className="py-4 border-b">
              <h3 className="font-medium mb-4">Post Engagement</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium">
                    Like Count
                  </label>
                  <div className="mt-1 p-2 bg-gray-50 rounded-md break-words">
                    {lead.like_count || '0'}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium">
                    Like Post URLs
                  </label>
                  <div className="mt-1 p-2 bg-gray-50 rounded-md whitespace-pre-wrap break-words">
                    {lead.like_post_urls
                      ? renderUrlList(lead.like_post_urls.split('\n'))
                      : '-'}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium">
                    Comment Count
                  </label>
                  <div className="mt-1 p-2 bg-gray-50 rounded-md break-words">
                    {lead.comment_count || '0'}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium">
                    Comment Post URLs
                  </label>
                  <div className="mt-1 p-2 bg-gray-50 rounded-md overflow-hidden">
                    {lead.comment_post_urls
                      ? renderUrlList(lead.comment_post_urls.split('\n'))
                      : '-'}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium">
                    Empathy Count
                  </label>
                  <div className="mt-1 p-2 bg-gray-50 rounded-md break-words">
                    {lead.empathy_count || '0'}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium">
                    Empathy Post URLs
                  </label>
                  <div className="mt-1 p-2 bg-gray-50 rounded-md overflow-hidden">
                    {lead.empathy_post_urls
                      ? renderUrlList(lead.empathy_post_urls.split('\n'))
                      : '-'}
                  </div>
                </div>
              </div>
            </div>

            {/* Professional Information */}
            <div className="py-4 border-b">
              <h3 className="font-medium mb-4">Professional Information</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium">
                    Work Experience
                  </label>
                  <div className="mt-1 p-2 bg-gray-50 rounded-md whitespace-pre-wrap break-all overflow-hidden">
                    {lead.lead_work_experiences
                      ? typeof lead.lead_work_experiences === 'string'
                        ? lead.lead_work_experiences
                        : JSON.stringify(lead.lead_work_experiences, null, 2)
                      : '-'}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium">
                    Volunteering Experience
                  </label>
                  <div className="mt-1 p-2 bg-gray-50 rounded-md whitespace-pre-wrap break-all overflow-hidden">
                    {lead.lead_volunteering_experiences
                      ? typeof lead.lead_volunteering_experiences === 'string'
                        ? lead.lead_volunteering_experiences
                        : JSON.stringify(
                            lead.lead_volunteering_experiences,
                            null,
                            2
                          )
                      : '-'}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium">Education</label>
                  <div className="mt-1 p-2 bg-gray-50 rounded-md whitespace-pre-wrap break-all overflow-hidden">
                    {lead.lead_educations
                      ? typeof lead.lead_educations === 'string'
                        ? lead.lead_educations
                        : JSON.stringify(lead.lead_educations, null, 2)
                      : '-'}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium">Skills</label>
                  <div className="mt-1 p-2 bg-gray-50 rounded-md whitespace-pre-wrap break-words">
                    {lead.lead_skills
                      ? typeof lead.lead_skills === 'string'
                        ? lead.lead_skills
                        : JSON.stringify(lead.lead_skills, null, 2)
                      : '-'}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium">Languages</label>
                  <div className="mt-1 p-2 bg-gray-50 rounded-md whitespace-pre-wrap break-words">
                    {lead.lead_languages
                      ? typeof lead.lead_languages === 'string'
                        ? lead.lead_languages
                        : JSON.stringify(lead.lead_languages, null, 2)
                      : '-'}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium">
                    Certifications
                  </label>
                  <div className="mt-1 p-2 bg-gray-50 rounded-md whitespace-pre-wrap break-all overflow-hidden">
                    {lead.lead_certifications
                      ? typeof lead.lead_certifications === 'string'
                        ? lead.lead_certifications
                        : JSON.stringify(lead.lead_certifications, null, 2)
                      : '-'}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium">Projects</label>
                  <div className="mt-1 p-2 bg-gray-50 rounded-md whitespace-pre-wrap break-words">
                    {lead.lead_projects
                      ? typeof lead.lead_projects === 'string'
                        ? lead.lead_projects
                        : JSON.stringify(lead.lead_projects, null, 2)
                      : '-'}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium">Summary</label>
                  <div className="mt-1 p-2 bg-gray-50 rounded-md whitespace-pre-wrap break-all overflow-hidden">
                    {lead.summary || '-'}
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="ai-enrichment">
            <div className="py-4">
              <p className="text-sm text-gray-500">
                AI-enriched information will appear here.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}

const renderUrlList = (urls: string[]) => {
  if (!urls || !urls.length) return '-'

  return (
    <ul className="list-disc pl-5 overflow-hidden">
      {urls.map((url, index) => {
        if (!url.includes('linkedin.com')) return null
        // 10文字以上のURLは省略
        let displayText = url.replace('https://www.linkedin.com/posts', '')
        displayText.length > 20 ? displayText.slice(0, 20) + '...' : displayText
        displayText = decodeJapaneseOnly(displayText)
        return (
          <li key={index} className="mb-1 break-words">
            <a
              href={url}
              target="_blank"
              rel="noreferrer"
              className="text-blue-600 hover:underline inline-flex items-center break-all"
              title={url}
            >
              <span className="truncate max-w-xs">{displayText}</span>
              <ExternalLink className="ml-1 h-3 w-3 flex-shrink-0" />
            </a>
          </li>
        )
      })}
    </ul>
  )
}
