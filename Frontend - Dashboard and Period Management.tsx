// src/app/(dashboard)/dashboard/page.tsx
"use client"

import { useQuery } from "@tanstack/react-query"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { 
  Users, 
  FileText, 
  Upload, 
  CheckCircle,
  Clock,
  AlertCircle,
  TrendingUp,
  Plus
} from "lucide-react"
import Link from "next/link"
import { api } from "@/lib/api"
import { PeriodCard } from "@/components/period-card"
import { RecentActivity } from "@/components/recent-activity"
import { StatsCard } from "@/components/stats-card"

export default function DashboardPage() {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const response = await api.get("/stats/dashboard")
      return response.data
    },
  })

  const { data: periods, isLoading: periodsLoading } = useQuery({
    queryKey: ["periods"],
    queryFn: async () => {
      const response = await api.get("/periods")
      return response.data
    },
  })

  const { data: recentActivity, isLoading: activityLoading } = useQuery({
    queryKey: ["recent-activity"],
    queryFn: async () => {
      const response = await api.get("/activity/recent")
      return response.data
    },
  })

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Welcome back! Here's an overview of your grading activity.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Students"
          value={stats?.totalStudents || 0}
          icon={Users}
          trend={stats?.studentsTrend}
          loading={statsLoading}
        />
        <StatsCard
          title="Active Assignments"
          value={stats?.activeAssignments || 0}
          icon={FileText}
          trend={stats?.assignmentsTrend}
          loading={statsLoading}
        />
        <StatsCard
          title="Processed Today"
          value={stats?.processedToday || 0}
          icon={CheckCircle}
          loading={statsLoading}
        />
        <StatsCard
          title="Average Processing Time"
          value={stats?.avgProcessingTime || "0s"}
          icon={Clock}
          loading={statsLoading}
        />
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <Button asChild className="h-24 flex-col gap-2">
            <Link href="/roster/upload">
              <Upload className="h-6 w-6" />
              <span>Upload Roster</span>
            </Link>
          </Button>
          <Button asChild variant="secondary" className="h-24 flex-col gap-2">
            <Link href="/gradesheets/generate">
              <FileText className="h-6 w-6" />
              <span>Generate Grade Sheets</span>
            </Link>
          </Button>
          <Button asChild variant="outline" className="h-24 flex-col gap-2">
            <Link href="/process">
              <TrendingUp className="h-6 w-6" />
              <span>Process Scans</span>
            </Link>
          </Button>
        </CardContent>
      </Card>

      {/* Periods Overview */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-semibold">Class Periods</h2>
          <Button asChild size="sm">
            <Link href="/periods/new">
              <Plus className="h-4 w-4 mr-2" />
              Add Period
            </Link>
          </Button>
        </div>
        
        {periodsLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        ) : periods?.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {periods.map((period: any) => (
              <PeriodCard key={period.id} period={period} />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-center">
                No class periods yet. Add your first period to get started.
              </p>
              <Button asChild className="mt-4">
                <Link href="/periods/new">Add First Period</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <RecentActivity activities={recentActivity} loading={activityLoading} />
        </CardContent>
      </Card>
    </div>
  )
}

// src/components/period-card.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Users, MoreVertical, FileText } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import Link from "next/link"
import { useRouter } from "next/navigation"

interface PeriodCardProps {
  period: {
    id: string
    name: string
    periodNumber: number
    studentCount: number
    lastActivity?: string
  }
}

export function PeriodCard({ period }: PeriodCardProps) {
  const router = useRouter()

  return (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer" 
         onClick={() => router.push(`/periods/${period.id}`)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-medium">
          {period.name}
        </CardTitle>
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="icon">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={(e) => {
              e.stopPropagation()
              router.push(`/periods/${period.id}/edit`)
            }}>
              Edit Period
            </DropdownMenuItem>
            <DropdownMenuItem onClick={(e) => {
              e.stopPropagation()
              router.push(`/periods/${period.id}/students`)
            }}>
              Manage Students
            </DropdownMenuItem>
            <DropdownMenuItem onClick={(e) => {
              e.stopPropagation()
              router.push(`/gradesheets/generate?period=${period.id}`)
            }}>
              Generate Grade Sheet
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>{period.studentCount} students</span>
          </div>
          {period.lastActivity && (
            <span className="text-xs text-muted-foreground">
              {period.lastActivity}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// src/components/stats-card.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface StatsCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  trend?: {
    value: number
    isPositive: boolean
  }
  loading?: boolean
}

export function StatsCard({ title, value, icon: Icon, trend, loading }: StatsCardProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-4" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-20" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {trend && (
          <p className={cn(
            "text-xs",
            trend.isPositive ? "text-green-600" : "text-red-600"
          )}>
            {trend.isPositive ? "+" : ""}{trend.value}% from last month
          </p>
        )}
      </CardContent>
    </Card>
  )
}

// src/components/recent-activity.tsx
import { Skeleton } from "@/components/ui/skeleton"
import { FileText, Upload, Download, Users } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

const iconMap = {
  upload: Upload,
  process: FileText,
  export: Download,
  roster: Users,
}

interface Activity {
  id: string
  type: keyof typeof iconMap
  description: string
  timestamp: string
  metadata?: any
}

interface RecentActivityProps {
  activities?: Activity[]
  loading?: boolean
}

export function RecentActivity({ activities, loading }: RecentActivityProps) {
  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center space-x-4">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/4" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (!activities || activities.length === 0) {
    return (
      <p className="text-center text-muted-foreground py-8">
        No recent activity
      </p>
    )
  }

  return (
    <div className="space-y-4">
      {activities.map((activity) => {
        const Icon = iconMap[activity.type]
        return (
          <div key={activity.id} className="flex items-center space-x-4">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Icon className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 space-y-1">
              <p className="text-sm font-medium">{activity.description}</p>
              <p className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
              </p>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// src/app/(dashboard)/periods/page.tsx
"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Plus, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import Link from "next/link"
import { api } from "@/lib/api"
import { PeriodCard } from "@/components/period-card"
import { Skeleton } from "@/components/ui/skeleton"

export default function PeriodsPage() {
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState("all")

  const { data: periods, isLoading } = useQuery({
    queryKey: ["periods", search, filter],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (search) params.append("search", search)
      if (filter !== "all") params.append("academicYear", filter)
      
      const response = await api.get(`/periods?${params}`)
      return response.data
    },
  })

  const { data: academicYears } = useQuery({
    queryKey: ["academic-years"],
    queryFn: async () => {
      const response = await api.get("/periods/academic-years")
      return response.data
    },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Class Periods</h1>
          <p className="text-muted-foreground mt-2">
            Manage your class periods and student rosters
          </p>
        </div>
        <Button asChild>
          <Link href="/periods/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Period
          </Link>
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search periods..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Academic Year" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Years</SelectItem>
            {academicYears?.map((year: string) => (
              <SelectItem key={year} value={year}>
                {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      ) : periods?.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {periods.map((period: any) => (
            <PeriodCard key={period.id} period={period} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No periods found</p>
        </div>
      )}
    </div>
  )
}
