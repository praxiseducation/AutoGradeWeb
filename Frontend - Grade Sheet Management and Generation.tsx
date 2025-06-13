// src/app/(dashboard)/gradesheets/generate/page.tsx
"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useQuery, useMutation } from "@tanstack/react-query"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { FileText, Plus, X, Settings, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/components/ui/use-toast"
import { api } from "@/lib/api"

const generateSchema = z.object({
  assignmentName: z.string().min(1, "Assignment name is required"),
  periodIds: z.array(z.string()).min(1, "Select at least one period"),
  gradingScale: z.array(z.string()).min(1, "Add at least one grade option"),
  includeStatusOptions: z.boolean(),
})

type GenerateFormData = z.infer<typeof generateSchema>

const DEFAULT_SCALES = {
  "standard": ["10", "8.5", "7.5", "6.5", "5"],
  "letter": ["A", "B", "C", "D", "F"],
  "numeric": ["4", "3", "2", "1", "0"],
  "mastery": ["E", "M", "A", "B"],
}

export default function GenerateGradeSheetsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const preselectedPeriod = searchParams.get("period")
  
  const [customGrade, setCustomGrade] = useState("")
  const [selectedScale, setSelectedScale] = useState("standard")

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<GenerateFormData>({
    resolver: zodResolver(generateSchema),
    defaultValues: {
      assignmentName: "",
      periodIds: preselectedPeriod ? [preselectedPeriod] : [],
      gradingScale: DEFAULT_SCALES["standard"],
      includeStatusOptions: true,
    },
  })

  const { data: periods, isLoading: periodsLoading } = useQuery({
    queryKey: ["periods"],
    queryFn: async () => {
      const response = await api.get("/periods")
      return response.data
    },
  })

  const generateMutation = useMutation({
    mutationFn: async (data: GenerateFormData) => {
      const response = await api.post("/gradesheets/generate", data)
      return response.data
    },
    onSuccess: (data) => {
      toast({
        title: "Grade sheets generated!",
        description: `Generated ${data.gradeSheets.length} grade sheet(s)`,
      })
      
      // Redirect to download page
      router.push(`/gradesheets?download=${data.gradeSheets.map((gs: any) => gs.id).join(",")}`)
    },
    onError: (error: any) => {
      toast({
        title: "Generation failed",
        description: error.response?.data?.message || "Failed to generate grade sheets",
        variant: "destructive",
      })
    },
  })

  const gradingScale = watch("gradingScale") || []
  const selectedPeriods = watch("periodIds") || []

  const handleAddCustomGrade = () => {
    if (customGrade && gradingScale.length < 5) {
      setValue("gradingScale", [...gradingScale, customGrade])
      setCustomGrade("")
    }
  }

  const handleRemoveGrade = (grade: string) => {
    setValue("gradingScale", gradingScale.filter((g) => g !== grade))
  }

  const handleSelectScale = (scale: keyof typeof DEFAULT_SCALES) => {
    setSelectedScale(scale)
    setValue("gradingScale", DEFAULT_SCALES[scale])
  }

  const onSubmit = (data: GenerateFormData) => {
    generateMutation.mutate(data)
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Generate Grade Sheets</h1>
        <p className="text-muted-foreground mt-2">
          Create printable grade sheets for your assignments
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Assignment Details</CardTitle>
            <CardDescription>
              Enter the assignment name and select class periods
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="assignmentName">Assignment Name *</Label>
              <Input
                id="assignmentName"
                placeholder="e.g., Quiz 1, Homework 5, Final Exam"
                {...register("assignmentName")}
              />
              {errors.assignmentName && (
                <p className="text-sm text-red-600">{errors.assignmentName.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Select Class Periods *</Label>
              {periodsLoading ? (
                <Skeleton className="h-32" />
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {periods?.map((period: any) => (
                    <label
                      key={period.id}
                      className="flex items-center space-x-2 cursor-pointer"
                    >
                      <Checkbox
                        checked={selectedPeriods.includes(period.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setValue("periodIds", [...selectedPeriods, period.id])
                          } else {
                            setValue(
                              "periodIds",
                              selectedPeriods.filter((id) => id !== period.id)
                            )
                          }
                        }}
                      />
                      <span className="text-sm">
                        {period.name} ({period.studentCount} students)
                      </span>
                    </label>
                  ))}
                </div>
              )}
              {errors.periodIds && (
                <p className="text-sm text-red-600">{errors.periodIds.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Grading Scale</CardTitle>
            <CardDescription>
              Configure the grading options for this assignment
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Quick Select</Label>
              <div className="flex flex-wrap gap-2">
                {Object.entries(DEFAULT_SCALES).map(([key, scale]) => (
                  <Button
                    key={key}
                    type="button"
                    variant={selectedScale === key ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleSelectScale(key as keyof typeof DEFAULT_SCALES)}
                  >
                    {key.charAt(0).toUpperCase() + key.slice(1)} ({scale.join(", ")})
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Current Scale</Label>
              <div className="flex flex-wrap gap-2">
                {gradingScale.map((grade) => (
                  <Badge key={grade} variant="secondary" className="py-1 px-3">
                    {grade}
                    <button
                      type="button"
                      onClick={() => handleRemoveGrade(grade)}
                      className="ml-2 hover:text-red-600"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              {gradingScale.length === 0 && (
                <p className="text-sm text-red-600">Add at least one grade option</p>
              )}
            </div>

            {gradingScale.length < 5 && (
              <div className="flex gap-2">
                <Input
                  placeholder="Add custom grade"
                  value={customGrade}
                  onChange={(e) => setCustomGrade(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      handleAddCustomGrade()
                    }
                  }}
                  className="max-w-xs"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddCustomGrade}
                  disabled={!customGrade || gradingScale.length >= 5}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            )}

            <div className="space-y-2">
              <label className="flex items-center space-x-2">
                <Checkbox
                  checked={watch("includeStatusOptions")}
                  onCheckedChange={(checked) =>
                    setValue("includeStatusOptions", checked as boolean)
                  }
                />
                <span className="text-sm">
                  Include status options (Missing, Absent, Exempt)
                </span>
              </label>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={generateMutation.isPending}
          >
            {generateMutation.isPending ? (
              "Generating..."
            ) : (
              <>
                <FileText className="mr-2 h-4 w-4" />
                Generate Grade Sheets
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}

// src/app/(dashboard)/gradesheets/page.tsx
"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { useQuery, useMutation } from "@tanstack/react-query"
import {
  FileText,
  Download,
  Eye,
  MoreVertical,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/components/ui/use-toast"
import { api } from "@/lib/api"
import { format } from "date-fns"

interface GradeSheet {
  id: string
  assignmentName: string
  periodName: string
  status: string
  createdAt: string
  studentCount: number
}

export default function GradeSheetsPage() {
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const [search, setSearch] = useState("")
  const downloadIds = searchParams.get("download")?.split(",") || []

  const { data: gradeSheets, isLoading } = useQuery({
    queryKey: ["gradesheets", search],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (search) params.append("search", search)
      const response = await api.get(`/gradesheets?${params}`)
      return response.data
    },
  })

  const downloadMutation = useMutation({
    mutationFn: async (gradeSheetIds: string[]) => {
      const response = await api.post("/gradesheets/download-batch", {
        gradeSheetIds,
      }, {
        responseType: 'blob'
      })
      return response.data
    },
    onSuccess: (data, gradeSheetIds) => {
      // Create download link
      const url = window.URL.createObjectURL(new Blob([data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `gradesheets-${Date.now()}.pdf`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      
      toast({
        title: "Download started",
        description: `Downloading ${gradeSheetIds.length} grade sheet(s)`,
      })
    },
    onError: () => {
      toast({
        title: "Download failed",
        variant: "destructive",
      })
    },
  })

  useEffect(() => {
    if (downloadIds.length > 0) {
      downloadMutation.mutate(downloadIds)
    }
  }, [downloadIds])

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      generated: { label: "Generated", variant: "secondary" as const },
      printed: { label: "Printed", variant: "default" as const },
      scanned: { label: "Scanned", variant: "outline" as const },
      processing: { label: "Processing", variant: "secondary" as const },
      completed: { label: "Completed", variant: "success" as const },
      error: { label: "Error", variant: "destructive" as const },
    }

    const config = statusConfig[status as keyof typeof statusConfig] || {
      label: status,
      variant: "secondary" as const,
    }

    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Grade Sheets</h1>
          <p className="text-muted-foreground mt-2">
            Manage and download your generated grade sheets
          </p>
        </div>
        <Button asChild>
          <a href="/gradesheets/generate">
            <FileText className="mr-2 h-4 w-4" />
            Generate New
          </a>
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <Input
          placeholder="Search by assignment or period..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Assignment</TableHead>
              <TableHead>Period</TableHead>
              <TableHead>Students</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              [...Array(5)].map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={6}>
                    <Skeleton className="h-8" />
                  </TableCell>
                </TableRow>
              ))
            ) : gradeSheets?.length > 0 ? (
              gradeSheets.map((gradeSheet: GradeSheet) => (
                <TableRow key={gradeSheet.id}>
                  <TableCell className="font-medium">
                    {gradeSheet.assignmentName}
                  </TableCell>
                  <TableCell>{gradeSheet.periodName}</TableCell>
                  <TableCell>{gradeSheet.studentCount}</TableCell>
                  <TableCell>{getStatusBadge(gradeSheet.status)}</TableCell>
                  <TableCell>
                    {format(new Date(gradeSheet.createdAt), "MMM d, yyyy")}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <a
                            href={`/api/gradesheets/${gradeSheet.id}/download`}
                            download
                          >
                            <Download className="mr-2 h-4 w-4" />
                            Download PDF
                          </a>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <a href={`/gradesheets/${gradeSheet.id}`}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </a>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  No grade sheets found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}
