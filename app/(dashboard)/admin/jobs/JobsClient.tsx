'use client'

/**
 * Admin Jobs Client Component
 * Display and manage background jobs
 */

import { useState, useTransition } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  getJobDetails,
  getJobLogsAction,
  retryJobAction,
  cancelJobAction,
} from '@/lib/admin/job-actions'
import type { BBJob, BBJobLog, BBJobType, BBJobStatus } from '@/lib/jobs/job-utils'
import {
  Loader2,
  RefreshCw,
  XCircle,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Play,
  Eye,
  Download,
  Activity,
} from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { useRouter } from 'next/navigation'

interface JobsClientProps {
  initialJobs: BBJob[]
  initialStatistics?: {
    jobsByType: Record<string, number>
    successRateByType: Record<string, number>
    averageDurationByType: Record<string, number>
    failedJobsCount: number
    pendingJobsCount: number
  }
  initialFilters: {
    jobType: string
    status: string
    page: number
  }
}

export default function JobsClient({
  initialJobs,
  initialStatistics,
  initialFilters,
}: JobsClientProps) {
  const router = useRouter()
  const [jobs, setJobs] = useState(initialJobs)
  const [selectedJob, setSelectedJob] = useState<BBJob | null>(null)
  const [jobLogs, setJobLogs] = useState<BBJobLog[]>([])
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false)
  const [logsDialogOpen, setLogsDialogOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [filters, setFilters] = useState(initialFilters)
  const [loadingLogs, setLoadingLogs] = useState(false)

  const formatDuration = (startedAt: string | null, completedAt: string | null) => {
    if (!startedAt || !completedAt) return '-'
    const duration =
      new Date(completedAt).getTime() - new Date(startedAt).getTime()
    const seconds = Math.floor(duration / 1000)
    if (seconds < 60) return `${seconds}s`
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}m ${remainingSeconds}s`
  }

  const getStatusBadge = (status: BBJobStatus) => {
    const variantMap: Record<BBJobStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      completed: 'default',
      processing: 'secondary',
      pending: 'outline',
      failed: 'destructive',
      cancelled: 'secondary',
    }
    const iconMap: Record<BBJobStatus, React.ReactNode> = {
      completed: <CheckCircle2 className="h-3 w-3" />,
      processing: <Loader2 className="h-3 w-3 animate-spin" />,
      pending: <Clock className="h-3 w-3" />,
      failed: <AlertTriangle className="h-3 w-3" />,
      cancelled: <XCircle className="h-3 w-3" />,
    }
    return (
      <Badge variant={variantMap[status]} className="capitalize flex items-center gap-1">
        {iconMap[status]}
        {status}
      </Badge>
    )
  }

  const handleViewDetails = async (job: BBJob) => {
    setSelectedJob(job)
    setDetailsDialogOpen(true)
  }

  const handleViewLogs = async (job: BBJob) => {
    setSelectedJob(job)
    setLogsDialogOpen(true)
    setLoadingLogs(true)

    try {
      const result = await getJobLogsAction(job.id, 1000)
      if (result.success && result.data) {
        setJobLogs(result.data)
      } else {
        toast.error(result.error || 'Failed to load logs')
      }
    } catch (error) {
      toast.error('Failed to load logs')
    } finally {
      setLoadingLogs(false)
    }
  }

  const handleRetry = async (job: BBJob) => {
    startTransition(async () => {
      const result = await retryJobAction(job.id)
      if (result.success) {
        toast.success('Job retry initiated')
        router.refresh()
      } else {
        toast.error(result.error || 'Failed to retry job')
      }
    })
  }

  const handleCancel = async (job: BBJob) => {
    startTransition(async () => {
      const result = await cancelJobAction(job.id)
      if (result.success) {
        toast.success('Job cancelled')
        router.refresh()
      } else {
        toast.error(result.error || 'Failed to cancel job')
      }
    })
  }

  const handleFilterChange = (key: 'jobType' | 'status', value: string) => {
    const newFilters = { ...filters, [key]: value, page: 1 }
    setFilters(newFilters)
    router.push(
      `/admin/jobs?jobType=${newFilters.jobType === 'all' ? '' : newFilters.jobType}&status=${newFilters.status === 'all' ? '' : newFilters.status}`
    )
  }

  const handleDownloadLogs = () => {
    if (!selectedJob || jobLogs.length === 0) return

    const csv = [
      ['Timestamp', 'Level', 'Message', 'Metadata'].join(','),
      ...jobLogs.map((log) =>
        [
          format(new Date(log.created_at), 'yyyy-MM-dd HH:mm:ss'),
          log.level,
          `"${log.message.replace(/"/g, '""')}"`,
          log.metadata ? `"${JSON.stringify(log.metadata).replace(/"/g, '""')}"` : '',
        ].join(',')
      ),
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `job-${selectedJob.id}-logs.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const getLogLevelBadge = (level: string) => {
    const variantMap: Record<string, 'default' | 'secondary' | 'destructive'> = {
      info: 'default',
      warning: 'secondary',
      error: 'destructive',
      debug: 'secondary',
    }
    return (
      <Badge variant={variantMap[level] || 'secondary'} className="capitalize text-xs">
        {level}
      </Badge>
    )
  }

  return (
    <div className="dashboard-page-content space-y-6">
      {/* Header */}
      <div className="dashboard-page-header flex items-center gap-2 border-b theme-border-color px-4 py-3 md:py-5 md:px-3 lg:px-6 lg:py-4">
        <Activity className="h-5 w-5" />
        <h1 className="theme-h4">Background Jobs</h1>
      </div>

      <div className="page-content p-4 md:p-5 lg:p-6 space-y-6">
        {/* Statistics Cards */}
        {initialStatistics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Failed Jobs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-destructive">
                  {initialStatistics.failedJobsCount}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Pending Jobs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{initialStatistics.pendingJobsCount}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Jobs (Last 7 Days)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {Object.values(initialStatistics.jobsByType).reduce((a, b) => a + b, 0)}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Avg Success Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {Object.keys(initialStatistics.successRateByType).length > 0
                    ? Math.round(
                        Object.values(initialStatistics.successRateByType).reduce(
                          (a, b) => a + b,
                          0
                        ) / Object.keys(initialStatistics.successRateByType).length
                      )
                    : 0}
                  %
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <div className="space-y-2">
                <Label htmlFor="job-type">Job Type</Label>
                <Select
                  value={filters.jobType}
                  onValueChange={(value) => handleFilterChange('jobType', value)}
                >
                  <SelectTrigger id="job-type" className="w-[200px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="renewal_weekly">Weekly Renewal</SelectItem>
                    <SelectItem value="renewal_monthly">Monthly Renewal</SelectItem>
                    <SelectItem value="payment_retry">Payment Retry</SelectItem>
                    <SelectItem value="credit_expiry">Credit Expiry</SelectItem>
                    <SelectItem value="trial_completion">Trial Completion</SelectItem>
                    <SelectItem value="order_generation">Order Generation</SelectItem>
                    <SelectItem value="pause_auto_cancel">Pause Auto-Cancel</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={filters.status}
                  onValueChange={(value) => handleFilterChange('status', value)}
                >
                  <SelectTrigger id="status" className="w-[200px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="processing">Processing</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button
                  variant="outline"
                  onClick={() => router.refresh()}
                  disabled={isPending}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${isPending ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Jobs Table */}
        <Card>
          <CardHeader>
            <CardTitle>Jobs</CardTitle>
            <CardDescription>Background job execution history</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Job Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Started</TableHead>
                    <TableHead>Completed</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {jobs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground">
                        No jobs found
                      </TableCell>
                    </TableRow>
                  ) : (
                    jobs.map((job) => (
                      <TableRow key={job.id}>
                        <TableCell className="font-medium">
                          {job.job_type.replace(/_/g, ' ')}
                        </TableCell>
                        <TableCell>{getStatusBadge(job.status)}</TableCell>
                        <TableCell>
                          {format(new Date(job.created_at), 'MMM d, yyyy HH:mm:ss')}
                        </TableCell>
                        <TableCell>
                          {job.started_at
                            ? format(new Date(job.started_at), 'MMM d, yyyy HH:mm:ss')
                            : '-'}
                        </TableCell>
                        <TableCell>
                          {job.completed_at
                            ? format(new Date(job.completed_at), 'MMM d, yyyy HH:mm:ss')
                            : '-'}
                        </TableCell>
                        <TableCell>
                          {formatDuration(job.started_at, job.completed_at)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewDetails(job)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewLogs(job)}
                            >
                              <Activity className="h-4 w-4" />
                            </Button>
                            {job.status === 'failed' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRetry(job)}
                                disabled={isPending}
                              >
                                <Play className="h-4 w-4" />
                              </Button>
                            )}
                            {(job.status === 'pending' || job.status === 'processing') && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleCancel(job)}
                                disabled={isPending}
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Job Details Dialog */}
        <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Job Details</DialogTitle>
              <DialogDescription>
                {selectedJob?.job_type.replace(/_/g, ' ')}
              </DialogDescription>
            </DialogHeader>
            {selectedJob && (
              <div className="space-y-4">
                <Tabs defaultValue="info">
                  <TabsList>
                    <TabsTrigger value="info">Information</TabsTrigger>
                    <TabsTrigger value="payload">Payload</TabsTrigger>
                    <TabsTrigger value="result">Result</TabsTrigger>
                  </TabsList>
                  <TabsContent value="info" className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Status</Label>
                        <div className="mt-1">{getStatusBadge(selectedJob.status)}</div>
                      </div>
                      <div>
                        <Label>Job Type</Label>
                        <div className="mt-1">{selectedJob.job_type.replace(/_/g, ' ')}</div>
                      </div>
                      <div>
                        <Label>Created</Label>
                        <div className="mt-1">
                          {format(new Date(selectedJob.created_at), 'MMM d, yyyy HH:mm:ss')}
                        </div>
                      </div>
                      {selectedJob.started_at && (
                        <div>
                          <Label>Started</Label>
                          <div className="mt-1">
                            {format(new Date(selectedJob.started_at), 'MMM d, yyyy HH:mm:ss')}
                          </div>
                        </div>
                      )}
                      {selectedJob.completed_at && (
                        <div>
                          <Label>Completed</Label>
                          <div className="mt-1">
                            {format(new Date(selectedJob.completed_at), 'MMM d, yyyy HH:mm:ss')}
                          </div>
                        </div>
                      )}
                      <div>
                        <Label>Duration</Label>
                        <div className="mt-1">
                          {formatDuration(selectedJob.started_at, selectedJob.completed_at)}
                        </div>
                      </div>
                      <div>
                        <Label>Retry Count</Label>
                        <div className="mt-1">
                          {selectedJob.retry_count} / {selectedJob.max_retries}
                        </div>
                      </div>
                    </div>
                    {selectedJob.error_message && (
                      <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>{selectedJob.error_message}</AlertDescription>
                      </Alert>
                    )}
                  </TabsContent>
                  <TabsContent value="payload">
                    <pre className="bg-muted p-4 rounded-md overflow-auto text-sm">
                      {JSON.stringify(selectedJob.payload, null, 2)}
                    </pre>
                  </TabsContent>
                  <TabsContent value="result">
                    <pre className="bg-muted p-4 rounded-md overflow-auto text-sm">
                      {JSON.stringify(selectedJob.result, null, 2)}
                    </pre>
                  </TabsContent>
                </Tabs>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setDetailsDialogOpen(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Job Logs Dialog */}
        <Dialog open={logsDialogOpen} onOpenChange={setLogsDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Job Logs</DialogTitle>
              <DialogDescription>
                {selectedJob?.job_type.replace(/_/g, ' ')} - {selectedJob?.id}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex justify-end">
                <Button variant="outline" size="sm" onClick={handleDownloadLogs}>
                  <Download className="h-4 w-4 mr-2" />
                  Download CSV
                </Button>
              </div>
              {loadingLogs ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : jobLogs.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">No logs found</div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Timestamp</TableHead>
                        <TableHead>Level</TableHead>
                        <TableHead>Message</TableHead>
                        <TableHead>Metadata</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {jobLogs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell className="text-sm">
                            {format(new Date(log.created_at), 'MMM d, yyyy HH:mm:ss')}
                          </TableCell>
                          <TableCell>{getLogLevelBadge(log.level)}</TableCell>
                          <TableCell className="max-w-md truncate">{log.message}</TableCell>
                          <TableCell>
                            {log.metadata ? (
                              <pre className="text-xs bg-muted p-2 rounded max-w-xs overflow-auto">
                                {JSON.stringify(log.metadata, null, 2)}
                              </pre>
                            ) : (
                              '-'
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setLogsDialogOpen(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

