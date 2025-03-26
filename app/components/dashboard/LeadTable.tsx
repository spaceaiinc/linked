'use client'

import * as React from 'react'
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  SortingState,
  getSortedRowModel,
} from '@tanstack/react-table'
import { ArrowUpDown, Calendar } from 'lucide-react'
import { Button } from '@/app/components/ui/button'
import { Input } from '@/app/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/app/components/ui/table'
import { useDebounce } from '@/lib/hooks/useDebounce'
import { format } from 'date-fns'
import { Badge } from '../ui/badge'
import Papa from 'papaparse'
import { LeadStatus } from '@/lib/types/master'
import { LeadForDisplay } from '@/lib/csv'
import { useState } from 'react'
import { LeadDetailModal } from './LeadDialog'
import { LeadStatusBadge } from './LeadBatch'

interface LeadTableProps {
  leads: LeadForDisplay[]
}

export function LeadTable({ leads }: LeadTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [filterValue, setFilterValue] = React.useState('')
  const debouncedFilterValue = useDebounce(filterValue, 300)

  const columns: ColumnDef<LeadForDisplay>[] = React.useMemo(
    () => [
      {
        accessorKey: 'latest_status',
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              className="hover:bg-muted/50"
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === 'asc')
              }
            >
              Status
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          )
        },
        cell: ({ row }) => (
          <div className="flex items-center whitespace-nowrap">
            <LeadStatusBadge status={row.getValue('latest_status')} />
          </div>
        ),
      },
      {
        accessorKey: 'full_name',
        header: 'Full Name',
        cell: ({ row }) => (
          <div className="text-medium text-muted-foreground max-w-md truncate">
            {row.getValue('full_name') || '-'}
          </div>
        ),
      },
      {
        accessorKey: 'last_name',
        header: 'Last Name',
        cell: ({ row }) => (
          <div className="text-sm text-muted-foreground max-w-md truncate">
            {row.getValue('last_name') || '-'}
          </div>
        ),
      },
      {
        accessorKey: 'first_name',
        header: 'First Name',
        cell: ({ row }) => (
          <div className="text-sm text-muted-foreground max-w-md truncate">
            {row.getValue('first_name') || '-'}
          </div>
        ),
      },
      {
        accessorKey: 'headline',
        header: 'Headline          ',
        cell: ({ row }) => (
          <div className="text-sm text-muted-foreground max-w-md truncate">
            {row.getValue('headline') || '-'}
          </div>
        ),
      },
      {
        accessorKey: 'public_identifier',
        header: 'LinkedIn URL',
        cell: ({ row }) => (
          <>
            {row.getValue('public_identifier') ? (
              <div className="text-sm text-muted-foreground max-w-md truncate">
                <a
                  href={
                    'https://www.linkedin.com/in/' +
                    row.getValue('public_identifier')
                  }
                  target="_blank"
                  rel="noreferrer"
                  className="underline"
                >
                  {row.getValue('public_identifier') || '-'}
                </a>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground max-w-md truncate">
                -
              </div>
            )}
          </>
        ),
      },
      // {
      //   accessorKey: 'public_identifier',
      //   header: 'Facebook URL',
      //   cell: ({ row }) => (
      //     <>
      //       {row.getValue('public_identifier') ? (
      //         <div className="text-sm text-muted-foreground max-w-md truncate">
      //           <a
      //             href={'https://facebook.com/'}
      //             target="_blank"
      //             rel="noreferrer"
      //             className="underline"
      //           >
      //             {'-'}
      //           </a>
      //         </div>
      //       ) : (
      //         <div className="text-sm text-muted-foreground max-w-md truncate">
      //           -
      //         </div>
      //       )}
      //     </>
      //   ),
      // },
      // {
      //   accessorKey: 'public_identifier',
      //   header: 'X URL',
      //   cell: ({ row }) => (
      //     <>
      //       {row.getValue('public_identifier') ? (
      //         <div className="text-sm text-muted-foreground max-w-md truncate">
      //           <a
      //             href={'https://x.com/in/'}
      //             target="_blank"
      //             rel="noreferrer"
      //             className="underline"
      //           >
      //             {'-'}
      //           </a>
      //         </div>
      //       ) : (
      //         <div className="text-sm text-muted-foreground max-w-md truncate">
      //           -
      //         </div>
      //       )}
      //     </>
      //   ),
      // },
      {
        accessorKey: 'network_distance',
        header: 'Network Distance',
        cell: ({ row }) => (
          <>
            {row.getValue('network_distance') ? (
              <div className="flex items-center whitespace-nowrap">
                <Badge className="bg-primary text-white hover:bg-primary/80 text-xs">
                  {row.getValue('network_distance')}
                </Badge>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground max-w-md truncate">
                -
              </div>
            )}
          </>
        ),
      },
      {
        accessorKey: 'like_count',
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              className="hover:bg-muted/50"
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === 'asc')
              }
            >
              Like Count
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          )
        },
        cell: ({ row }) => (
          <div className="text-sm text-muted-foreground max-w-lg truncate">
            {row.getValue('like_count') || '0'}
          </div>
        ),
      },
      // {
      //   accessorKey: 'like_post_urls',
      //   header: 'Like Post URLs',
      //   cell: ({ row }) => {
      //     const urls: string = row.getValue('like_post_urls')
      //     const urlsArray = urls.split(',')
      //     return (
      //       <>
      //         {urls ? (
      //           <>
      //             <div className="text-sm text-muted-foreground max-w-md flex flex-wrap gap-2">
      //               {urlsArray.map((url, urlIndex) => (
      //                 <a
      //                   key={url + '-' + urlIndex}
      //                   href={url}
      //                   target="_blank"
      //                   rel="noreferrer"
      //                   className="underline"
      //                 >
      //                   投稿{urlIndex + 1},{' '}
      //                 </a>
      //               ))}
      //             </div>
      //           </>
      //         ) : (
      //           <div className="text-sm text-muted-foreground max-w-md truncate">
      //             -
      //           </div>
      //         )}
      //       </>
      //     )
      //   },
      // },

      {
        accessorKey: 'comment_count',
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              className="hover:bg-muted/50"
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === 'asc')
              }
            >
              Comment Count
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          )
        },
        cell: ({ row }) => (
          <div className="text-sm text-muted-foreground max-w-lg truncate">
            {row.getValue('comment_count') || '0'}
          </div>
        ),
      },

      // {
      //   accessorKey: 'empathy_count',
      //   header: 'Empathy Count',
      //   cell: ({ row }) => (
      //     <div className="text-sm text-muted-foreground max-w-lg truncate">
      //       {row.getValue('empathy_count') || '0'}
      //     </div>
      //   ),
      // },

      {
        accessorKey: 'connections_count',
        header: 'Connections',
        cell: ({ row }) => (
          <div className="text-sm text-muted-foreground max-w-md truncate">
            {row.getValue('connections_count') || '0'}
          </div>
        ),
      },
      {
        accessorKey: 'shared_connections_count',
        header: 'Shared Connections',
        cell: ({ row }) => (
          <div className="text-sm text-muted-foreground max-w-md truncate">
            {row.getValue('shared_connections_count') || '0'}
          </div>
        ),
      },
      {
        accessorKey: 'follower_count',
        header: 'Followers',
        cell: ({ row }) => (
          <div className="text-sm text-muted-foreground max-w-md truncate">
            {row.getValue('follower_count') || '0'}
          </div>
        ),
      },
      {
        accessorKey: 'location',
        header: 'Location',
        cell: ({ row }) => (
          <div className="text-sm text-muted-foreground max-w-md truncate">
            {row.getValue('location') || '-'}
          </div>
        ),
      },
      {
        accessorKey: 'emails',
        header: 'Email',
        cell: ({ row }) => (
          <div className="text-sm text-muted-foreground max-w-md truncate">
            {row.getValue('emails') || '-'}
          </div>
        ),
      },
      {
        accessorKey: 'phones',
        header: 'Phone',
        cell: ({ row }) => (
          <div className="text-sm text-muted-foreground max-w-md truncate">
            {row.getValue('phones') || '-'}
          </div>
        ),
      },
      // {
      //   accessorKey: 'websites',
      //   header: 'Websites',
      //   cell: ({ row }) => {
      //     const websites = row.getValue('websites')
      //     return (
      //                 <div className="text-sm text-muted-foreground max-w-md truncate">
      //         {websites && Array.isArray(websites) && websites.length > 0
      //           ? websites.join(', ')
      //           : '-'}
      //       </div>
      //     )
      //   },
      // },
      // {
      //   accessorKey: 'socials',
      //   header: 'Social Profiles',
      //   cell: ({ row }) => {
      //     const socials = row.getValue('socials')
      //     return (
      //                 <div className="text-sm text-muted-foreground max-w-md truncate">
      //         {socials && Array.isArray(socials) && socials.length > 0
      //           ? socials.join(', ')
      //           : '-'}
      //       </div>
      //     )
      //   },
      // },
      {
        accessorKey: 'summary',
        header: 'Summary',
        cell: ({ row }) => (
          <div className="text-sm text-muted-foreground max-w-lg truncate">
            {row.getValue('summary') || '-'}
          </div>
        ),
      },
      {
        accessorKey: 'lead_work_experiences',
        header: 'Work Experience',
        cell: ({ row }) => (
          <div className="text-sm text-muted-foreground max-w-lg truncate">
            {row.getValue('lead_work_experiences') || '-'}
          </div>
        ),
      },
      {
        accessorKey: 'lead_volunteering_experiences',
        header: 'Volunteering',
        cell: ({ row }) => (
          <div className="text-sm text-muted-foreground max-w-lg truncate">
            {row.getValue('lead_volunteering_experiences') || '-'}
          </div>
        ),
      },
      {
        accessorKey: 'lead_educations',
        header: 'Education',
        cell: ({ row }) => (
          <div className="text-sm text-muted-foreground max-w-lg truncate">
            {row.getValue('lead_educations') || '-'}
          </div>
        ),
      },
      {
        accessorKey: 'lead_skills',
        header: 'Skills',
        cell: ({ row }) => (
          <div className="text-sm text-muted-foreground max-w-lg truncate">
            {row.getValue('lead_skills') || '-'}
          </div>
        ),
      },
      {
        accessorKey: 'lead_languages',
        header: 'Languages',
        cell: ({ row }) => (
          <div className="text-sm text-muted-foreground max-w-lg truncate">
            {row.getValue('lead_languages') || '-'}
          </div>
        ),
      },
      {
        accessorKey: 'lead_certifications',
        header: 'Certifications',
        cell: ({ row }) => (
          <div className="text-sm text-muted-foreground max-w-lg truncate">
            {row.getValue('lead_certifications') || '-'}
          </div>
        ),
      },
      {
        accessorKey: 'lead_projects',
        header: 'Projects',
        cell: ({ row }) => (
          <div className="text-sm text-muted-foreground max-w-lg truncate">
            {row.getValue('lead_projects') || '-'}
          </div>
        ),
      },
      {
        accessorKey: 'invitation_sent_at',
        header: 'Invitation Sent',
        cell: ({ row }) => {
          const date = row.getValue('invitation_sent_at') as string
          return (
            <div className="text-sm text-muted-foreground max-w-md truncate">
              {date && date !== '-infinity'
                ? new Date(date).toLocaleDateString()
                : '-'}
            </div>
          )
        },
      },
      {
        accessorKey: 'invitation_replied_at',
        header: 'Invitation Replied',
        cell: ({ row }) => {
          const date = row.getValue('invitation_replied_at') as string
          return (
            <div className="text-sm text-muted-foreground max-w-md truncate">
              {date && date !== '-infinity'
                ? new Date(date).toLocaleDateString()
                : '-'}
            </div>
          )
        },
      },
      {
        accessorKey: 'first_message_sent_at',
        header: 'First Message Sent',
        cell: ({ row }) => {
          const date = row.getValue('first_message_sent_at') as string
          return (
            <div className="text-sm text-muted-foreground max-w-md truncate">
              {date && date !== '-infinity'
                ? new Date(date).toLocaleDateString()
                : '-'}
            </div>
          )
        },
      },
      {
        accessorKey: 'first_message_replied_at',
        header: 'First Message Replied',
        cell: ({ row }) => {
          const date = row.getValue('first_message_replied_at') as string
          return (
            <div className="text-sm text-muted-foreground max-w-md truncate">
              {date && date !== '-infinity'
                ? new Date(date).toLocaleDateString()
                : '-'}
            </div>
          )
        },
      },
      {
        accessorKey: 'is_influencer',
        header: 'Influencer',
        cell: ({ row }) => (
          <div className="text-sm">
            {row.getValue('is_influencer') ? 'True' : '-'}
          </div>
        ),
      },
      {
        accessorKey: 'is_creator',
        header: 'Creator',
        cell: ({ row }) => (
          <div className="text-sm">
            {row.getValue('is_creator') ? 'True' : '-'}
          </div>
        ),
      },
      {
        accessorKey: 'is_open_to_work',
        header: 'Open to Work',
        cell: ({ row }) => (
          <div className="text-sm">
            {row.getValue('is_open_to_work') ? 'True' : '-'}
          </div>
        ),
      },
      {
        accessorKey: 'is_hiring',
        header: 'Hiring',
        cell: ({ row }) => (
          <div className="text-sm">
            {row.getValue('is_hiring') ? 'True' : '-'}
          </div>
        ),
      },
      {
        accessorKey: 'private_identifier',
        header: 'Account ID',
        cell: ({ row }) => (
          <div className="text-sm text-muted-foreground max-w-md truncate">
            {row.getValue('private_identifier') || '-'}
          </div>
        ),
      },
      {
        accessorKey: 'created_at',
        header: 'Created At',
        cell: ({ row }) => (
          <div className="flex items-center">
            <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
            <span className="text-sm">
              {format(new Date(row.getValue('created_at')), 'yyyy/MM/dd')}
            </span>
          </div>
        ),
      },
      {
        accessorKey: 'updated_at',
        header: 'Updated At',
        cell: ({ row }) => (
          <div className="flex items-center">
            <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
            <span className="text-sm">
              {format(new Date(row.getValue('updated_at')), 'yyyy/MM/dd')}
            </span>
          </div>
        ),
      },
    ],
    []
  )

  const filteredLeads = React.useMemo(() => {
    return leads.filter(
      (gen) =>
        gen.public_identifier
          ?.toLowerCase()
          .includes(debouncedFilterValue.toLowerCase()) ||
        gen.full_name
          ?.toLowerCase()
          .includes(debouncedFilterValue.toLowerCase()) ||
        gen.first_name
          ?.toLowerCase()
          .includes(debouncedFilterValue.toLowerCase()) ||
        gen?.last_name
          ?.toLowerCase()
          .includes(debouncedFilterValue.toLowerCase()) ||
        gen?.headline
          ?.toLowerCase()
          .includes(debouncedFilterValue.toLowerCase()) ||
        gen?.summary?.toLowerCase().includes(debouncedFilterValue.toLowerCase())
    )
  }, [leads, debouncedFilterValue])

  const table = useReactTable({
    data: filteredLeads,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    state: {
      sorting,
    },
  })

  const { rows } = table.getRowModel()
  const [visibleRange, setVisibleRange] = React.useState({ start: 0, end: 20 })

  const observerRef = React.useRef<IntersectionObserver | null>(null)
  const lastRowRef = React.useRef<HTMLTableRowElement | null>(null)

  React.useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisibleRange((prev) => ({
            start: prev.start,
            end: Math.min(prev.end + 20, rows.length),
          }))
        }
      },
      { threshold: 0.1 }
    )

    return () => observerRef.current?.disconnect()
  }, [rows.length])

  React.useEffect(() => {
    if (lastRowRef.current && observerRef.current) {
      observerRef.current.observe(lastRowRef.current)
    }
    return () => {
      if (lastRowRef.current && observerRef.current) {
        observerRef.current.unobserve(lastRowRef.current)
      }
    }
  }, [visibleRange])

  React.useEffect(() => {
    setVisibleRange({ start: 0, end: 20 }) // Reset visible range when filter changes
  }, [debouncedFilterValue])

  const handleFilterChange = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setFilterValue(event.target.value)
    },
    []
  )

  const handleExport = React.useCallback(() => {
    // 現在の日時をファイル名用にフォーマット
    const date = new Date()
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    const outputFilePath = `linkedin_profile_${year}${month}${day}${hours}${minutes}.csv`

    // 除外したいカラムのリスト
    const excludeColumns = [
      'id',
      'company_id',
      'created_at',
      'updated_at',
      'deleted_at',
      'provider_id',
      'network_distance',
      'deleted_at',
      'lead_statuses',
      'lead_workflows',
      'lead_reactions',
      'keywords',
      'thread',
      'generated_invitation_message',
      'invitation_message',
      'invitation_sent_at',
      'invitation_replied_at',
      'first_message',
      'first_message_days',
      'generated_first_message',
      'first_message_sent_at',
      'first_message_read_at',
      'first_message_replied_at',
      'second_message',
      'second_message_days',
      'generated_second_message',
      'second_message_sent_at',
      'second_message_read_at',
      'second_message_replied_at',
      'third_message',
      'third_message_days',
      'generated_third_message',
      'third_message_sent_at',
      'third_message_read_at',
      'third_message_replied_at',
    ]

    // filteredLeadsから不要なカラムを除外
    const cleanedData = filteredLeads.map((lead) => {
      // Record<string, unknown>で任意のキーと値を持つオブジェクトを作成
      const cleanedLead: Record<string, unknown> = {}
      lead.public_profile_url = `https://www.linkedin.com/in/${lead.public_identifier}`

      // 型キャストをせずに動的にプロパティを設定
      Object.keys(lead).forEach((key) => {
        if (!excludeColumns.includes(key)) {
          // インデックスアクセスを使用して値をコピー
          cleanedLead[key] = lead[key as keyof typeof lead]
        }
      })

      return cleanedLead
    })

    // CSVに変換
    const csv = Papa.unparse(cleanedData, { newline: '\n' })

    // ダウンロード処理
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', outputFilePath)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    // クリーンアップ
    URL.revokeObjectURL(url)

    console.log(`CSV file has been saved to ${outputFilePath}`)
  }, [filteredLeads])

  const [selectedLead, setSelectedLead] = useState<LeadForDisplay | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  const openLeadDetails = (lead: LeadForDisplay) => {
    setSelectedLead(lead)
    setModalOpen(true)
  }

  return (
    <div className="space-y-4">
      <h2 className="text-3xl font-bold">リード</h2>
      <div className="flex items-center py-4 space-x-4">
        <Input
          placeholder="Search"
          value={filterValue}
          onChange={handleFilterChange}
          className="max-w-sm"
        />
        <Button
          // disabled={loading}
          onClick={() => handleExport()}
          className="bg-accent hover:bg-accent/80 text-white"
        >
          エクスポート
        </Button>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  // 長さに関係なく一行に 文字量に合わせて
                  <TableHead key={header.id} className="whitespace-nowrap">
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results found.
                </TableCell>
              </TableRow>
            ) : (
              rows
                .slice(visibleRange.start, visibleRange.end)
                .map((row, index) => (
                  <TableRow
                    key={row.id}
                    ref={
                      index === visibleRange.end - visibleRange.start - 1
                        ? lastRowRef
                        : null
                    }
                    onClick={() => openLeadDetails(row.original)}
                    data-state={row.getIsSelected() && 'selected'}
                    className="cursor-pointer hover:bg-muted/50"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
            )}
          </TableBody>
        </Table>
        <LeadDetailModal
          lead={selectedLead}
          open={modalOpen}
          onOpenChange={setModalOpen}
        />
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          Next
        </Button>
      </div>
    </div>
  )
}
