'use client'
import { useState, useEffect } from 'react'
import { useAtom } from 'jotai'
import { providerAtom } from '@/lib/atom'
import LoadingPage from '@/app/components/Loading'
import { LeadStatus } from '@/lib/types/master'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/app/components/ui/card'
import { format } from 'date-fns'
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts'
import { PublicSchemaTables } from '@/lib/types/supabase'
import { createClient } from '@/lib/utils/supabase/client'

// Helper function to get status name
const getStatusName = (status: number) => {
  switch (status) {
    case LeadStatus.SEARCHED:
      return 'Searched'
    case LeadStatus.INVITED_FAILED:
      return 'Invite Failed'
    case LeadStatus.IN_QUEUE:
      return 'In Queue'
    case LeadStatus.ALREADY_INVITED:
      return 'Already Invited'
    case LeadStatus.INVITED:
      return 'Invited'
    case LeadStatus.ACCEPTED:
      return 'Accepted'
    case LeadStatus.FOLLOW_UP_SENT_FAILED:
      return 'Follow-up Failed'
    case LeadStatus.FOLLOW_UP_SENT_IN_QUEUE:
      return 'Follow-up In Queue'
    case LeadStatus.FOLLOW_UP_SENT:
      return 'Follow-up Sent'
    case LeadStatus.REPLIED:
      return 'Replied'
    default:
      return `Status ${status}`
  }
}

// Helper function to get status color
const getStatusColor = (status: number) => {
  switch (status) {
    case LeadStatus.SEARCHED:
      return '#8884d8'
    case LeadStatus.INVITED_FAILED:
      return '#ff8042'
    case LeadStatus.IN_QUEUE:
      return '#82ca9d'
    case LeadStatus.ALREADY_INVITED:
      return '#ffc658'
    case LeadStatus.INVITED:
      return '#0088fe'
    case LeadStatus.ACCEPTED:
      return '#00C49F'
    case LeadStatus.FOLLOW_UP_SENT_FAILED:
      return '#ff0000'
    case LeadStatus.FOLLOW_UP_SENT_IN_QUEUE:
      return '#ffbb28'
    case LeadStatus.FOLLOW_UP_SENT:
      return '#8884d8'
    case LeadStatus.REPLIED:
      return '#0077b5'
    default:
      return '#999999'
  }
}

type StatusCount = {
  status: number
  statusName: string
  count: number
  color: string
}

type DailyStatusCount = {
  date: string
  [key: string]: string | number
}

type WeeklyInsight = {
  week: string
  follower_count: number
  connections_count: number
}

type DailyInsight = {
  date: string
  follower_count: number
  connections_count: number
}

export function LeadReport({
  leadStatuses,
}: {
  leadStatuses: PublicSchemaTables['lead_statuses']['Row'][]
}) {
  const [provider] = useAtom(providerAtom)
  const [isLoading, setIsLoading] = useState(true)
  const [statusCounts, setStatusCounts] = useState<StatusCount[]>([])
  const [dailyStatusCounts, setDailyStatusCounts] = useState<
    DailyStatusCount[]
  >([])
  const [totalLeads, setTotalLeads] = useState(0)
  const [weeklyInsights, setWeeklyInsights] = useState<WeeklyInsight[]>([])
  const [dailyInsights, setDailyInsights] = useState<DailyInsight[]>([])
  const [isLoadingInsights, setIsLoadingInsights] = useState(true)

  useEffect(() => {
    const fetchLeadStatuses = async () => {
      if (!provider) return

      // Calculate date 3 months ago
      const threeMonthsAgo = new Date()
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)
      const threeMonthsAgoStr = threeMonthsAgo.toISOString()

      // Fetch lead statuses from the last 3 months
      leadStatuses = leadStatuses.filter((status) => {
        return new Date(status.created_at) >= new Date(threeMonthsAgoStr)
      })

      if (!leadStatuses || leadStatuses.length === 0) {
        setIsLoading(false)
        return
      }

      // Process data for status counts
      const counts: Record<number, number> = {}
      leadStatuses.forEach(
        (status: PublicSchemaTables['lead_statuses']['Row']) => {
          counts[status.status] = (counts[status.status] || 0) + 1
        }
      )

      const statusCountsArray: StatusCount[] = Object.entries(counts)
        .map(([status, count]) => {
          const statusNum = parseInt(status)
          return {
            status: statusNum,
            statusName: getStatusName(statusNum),
            count,
            color: getStatusColor(statusNum),
          }
        })
        .sort((a, b) => a.status - b.status)

      setStatusCounts(statusCountsArray)
      setTotalLeads(leadStatuses.length)
      // Process data for daily status counts
      const dailyCounts: Record<string, Record<number, number>> = {}

      leadStatuses.forEach((statusItem: any) => {
        // Handle case where status might be an array of objects
        const status =
          Array.isArray(statusItem) && statusItem.length > 0
            ? statusItem[0]
            : statusItem

        let formattedDate: string
        try {
          // Check if created_at is valid
          if (
            status &&
            status.created_at &&
            status.created_at !== '-infinity'
          ) {
            // Handle ISO 8601 format with timezone information
            // Use Date.parse to validate the date string first
            if (Date.parse(status.created_at)) {
              // Valid ISO 8601 string - create date object directly
              const dateObj = new Date(status.created_at)
              formattedDate = format(dateObj, 'yyyy-MM-dd')
            } else {
              // Fallback to current date if invalid
              formattedDate = format(new Date(), 'yyyy-MM-dd')
              console.warn('Invalid date format:', status.created_at)
            }
          } else {
            // Fallback to current date if created_at is missing
            formattedDate = format(new Date(), 'yyyy-MM-dd')
            console.warn('Missing created_at for status:', statusItem)
          }
        } catch (error) {
          // Fallback to current date if there's any error
          formattedDate = format(new Date(), 'yyyy-MM-dd')
          console.error('Error parsing date:', error, status.created_at)
        }

        if (!dailyCounts[formattedDate]) {
          dailyCounts[formattedDate] = {}
        }
        // Ensure we can safely access status
        if (status && typeof status.status !== 'undefined') {
          dailyCounts[formattedDate][status.status] =
            (dailyCounts[formattedDate][status.status] || 0) + 1
        } else {
          console.warn('Missing status property:', statusItem)
        }
      })

      // Convert to array format for chart
      const dailyCountsArray: DailyStatusCount[] = Object.entries(dailyCounts)
        .map(([date, statuses]) => {
          const entry: DailyStatusCount = { date }
          Object.entries(statuses).forEach(([status, count]) => {
            // Make sure status is a valid number before parsing
            const statusNum = Number(status)
            console.log('Status:', status, 'Count:', count)
            // Check if statusNum is a valid number
            if (!isNaN(statusNum)) {
              const statusName = getStatusName(statusNum)
              // Only add if statusName is a valid string
              if (
                statusName &&
                typeof statusName === 'string' &&
                statusName !== 'NaN'
              ) {
                entry[statusName] = count
              } else {
                console.warn(`Invalid status name for status: ${status}`)
                // Use a fallback name if needed
                entry[`Status ${status}`] = count
              }
            } else {
              console.warn(`Invalid status value: ${status}`)
              // Use a fallback for invalid status
              entry[`Unknown (${status})`] = count
            }
          })
          return entry
        })
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

      setDailyStatusCounts(dailyCountsArray)
      setIsLoading(false)
    }

    fetchLeadStatuses()
  }, [leadStatuses])

  const supabase = createClient()

  useEffect(() => {
    const fetchInsights = async () => {
      if (!provider) return

      setIsLoadingInsights(true)

      try {
        // Fetch provider_daily_insights data for the current provider
        const { data, error } = await supabase
          .from('provider_daily_insights')
          .select('*')
          .eq('provider_id', provider.id)
          .eq('deleted_at', '-infinity')
          // created_atが3ヶ月前より新しいデータを取得 utc
          .gt(
            'created_at',
            new Date(
              new Date().getTime() - 3 * 30 * 24 * 60 * 60 * 1000
            ).toISOString()
          )
          .order('created_at', { ascending: true })

        if (error) {
          console.error('Error fetching provider insights:', error)
          setIsLoadingInsights(false)
          return
        }

        if (!data || data.length === 0) {
          setIsLoadingInsights(false)
          return
        }

        // Process daily insights data
        const dailyInsightsArray: DailyInsight[] = data
          .map((insight: any) => ({
            date: new Date(insight.created_at).toISOString().split('T')[0],
            follower_count: insight.follower_count || 0,
            connections_count: insight.connections_count || 0,
          }))
          .sort(
            (a: DailyInsight, b: DailyInsight) =>
              new Date(a.date).getTime() - new Date(b.date).getTime()
          )

        // Get the last 30 days of data
        const last30DaysData = dailyInsightsArray.slice(-30)
        setDailyInsights(last30DaysData)

        // Group data by week
        const weeklyData: Record<
          string,
          {
            follower_count: number
            connections_count: number
            count: number
          }
        > = {}

        data.forEach(
          (insight: {
            created_at: string | number | Date
            follower_count: any
            connections_count: any
          }) => {
            // Parse the created_at date
            const date = new Date(insight.created_at)

            // Get the start of the week (Sunday)
            const startOfWeek = new Date(date)
            startOfWeek.setDate(date.getDate() - date.getDay())
            startOfWeek.setHours(0, 0, 0, 0)

            // Format as YYYY-MM-DD
            const weekKey = startOfWeek.toISOString().split('T')[0]

            if (!weeklyData[weekKey]) {
              weeklyData[weekKey] = {
                follower_count: 0,
                connections_count: 0,
                count: 0,
              }
            }

            // Sum up the values for the week
            weeklyData[weekKey].follower_count += insight.follower_count || 0
            weeklyData[weekKey].connections_count +=
              insight.connections_count || 0
            weeklyData[weekKey].count += 1
          }
        )

        // Calculate averages and convert to array format for chart
        const weeklyInsightsArray: WeeklyInsight[] = Object.entries(weeklyData)
          .map(([week, data]) => ({
            week,
            follower_count: Math.round(data.follower_count / data.count),
            connections_count: Math.round(data.connections_count / data.count),
          }))
          .sort(
            (a, b) => new Date(a.week).getTime() - new Date(b.week).getTime()
          )

        setWeeklyInsights(weeklyInsightsArray)
      } catch (error) {
        console.error('Error processing weekly insights:', error)
      } finally {
        setIsLoadingInsights(false)
      }
    }

    fetchInsights()
  }, [provider])

  // Show loading spinner while data is being fetched
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <LoadingPage />
        <p className="mt-4 text-gray-600">データを読み込み中...</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6">
      {/* <h1 className="text-2xl font-bold mb-6">
        Lead Status Report (Last 3 Months)
      </h1> */}

      {statusCounts.length === 0 ? (
        <div className="bg-blue-50 p-6 rounded-lg mb-8 text-center">
          <h2 className="text-xl font-semibold mb-2">
            表示する進捗がありません
          </h2>
          <p className="text-gray-600">
            <a href="/dashboard">新規ワークフローを作成する</a>
          </p>
        </div>
      ) : (
        <>
          {/* Status Count Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
            {statusCounts.map((status) => (
              <Card key={status.status} className="shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-2xl font-bold">
                    {status.count}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {status.statusName}
                  </p>
                  <div
                    className="w-full h-1 mt-2"
                    style={{ backgroundColor: status.color }}
                  />
                </CardContent>
              </Card>
            ))}
            <Card className="shadow-sm bg-blue-900 text-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-2xl font-bold">
                  {totalLeads}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">Total</p>
                {/* <div className="bg-white text-blue-900 text-xs font-bold px-2 py-1 rounded mt-2 inline-block">
                  100%
                </div> */}
                <div
                  className="w-full h-1 mt-2"
                  style={{ backgroundColor: 'white' }}
                />
              </CardContent>
            </Card>
          </div>

          {/* Flow Performance Progress Chart */}
          <Card className="shadow-sm mb-8">
            <CardHeader>
              <CardTitle>ワークフローレポート</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4 flex flex-wrap gap-2">
                {statusCounts.map((status) => (
                  <div
                    key={status.status}
                    className="flex items-center gap-1 px-2 py-1 rounded-full"
                    style={{ backgroundColor: `${status.color}20` }}
                  >
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: status.color }}
                    />
                    <span className="text-sm">{status.statusName}</span>
                  </div>
                ))}
              </div>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={dailyStatusCounts}
                    margin={{
                      top: 10,
                      right: 30,
                      left: 0,
                      bottom: 0,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    {statusCounts.map((status) => (
                      <Bar
                        key={status.status}
                        dataKey={status.statusName}
                        stackId="1"
                        fill={status.color}
                      />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Weekly Follower and Connection Count Chart */}
      {weeklyInsights.length > 0 && (
        <Card className="shadow-sm mb-8">
          <CardHeader>
            <CardTitle>週間フォロワー数・つながり数の推移</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4 flex flex-wrap gap-2">
              <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-blue-100">
                <div className="w-3 h-3 rounded-full bg-blue-500" />
                <span className="text-sm">フォロワー数</span>
              </div>
              <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-green-100">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="text-sm">つながり数</span>
              </div>
            </div>
            <div className="h-[400px]">
              {isLoadingInsights ? (
                <div className="flex flex-col items-center justify-center h-full">
                  <LoadingPage />
                  <p className="mt-4 text-gray-600">データを読み込み中...</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={weeklyInsights}
                    margin={{
                      top: 10,
                      right: 30,
                      left: 0,
                      bottom: 0,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="week" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar
                      dataKey="follower_count"
                      name="フォロワー数"
                      fill="#3b82f6"
                    />
                    <Bar
                      dataKey="connections_count"
                      name="つながり数"
                      fill="#22c55e"
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Daily Follower and Connection Count Chart */}
      {dailyInsights.length > 0 && (
        <Card className="shadow-sm mb-8">
          <CardHeader>
            <CardTitle>日間フォロワー数・つながり数の推移</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4 flex flex-wrap gap-2">
              <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-blue-100">
                <div className="w-3 h-3 rounded-full bg-blue-500" />
                <span className="text-sm">フォロワー数</span>
              </div>
              <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-green-100">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="text-sm">つながり数</span>
              </div>
            </div>
            <div className="h-[400px]">
              {isLoadingInsights ? (
                <div className="flex flex-col items-center justify-center h-full">
                  <LoadingPage />
                  <p className="mt-4 text-gray-600">データを読み込み中...</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={dailyInsights}
                    margin={{
                      top: 10,
                      right: 30,
                      left: 0,
                      bottom: 0,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar
                      dataKey="follower_count"
                      name="フォロワー数"
                      fill="#3b82f6"
                    />
                    <Bar
                      dataKey="connections_count"
                      name="つながり数"
                      fill="#22c55e"
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
