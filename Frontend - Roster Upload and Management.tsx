// src/app/(dashboard)/roster/upload/page.tsx
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Upload, FileText, AlertCircle, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
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
import { useToast } from "@/components/ui/use-toast"
import { api } from "@/lib/api"
import { useDropzone } from "react-dropzone"

const uploadSchema = z.object({
  periodNumber: z.string().min(1, "Please select a period"),
  academicYear: z.string().optional(),
})

type UploadFormData = z.infer<typeof uploadSchema>

export default function RosterUploadPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [file, setFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<UploadFormData>({
    resolver: zodResolver(uploadSchema),
  })

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
    },
    maxFiles: 1,
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        setFile(acceptedFiles[0])
      }
    }
  })

  const onSubmit = async (data: UploadFormData) => {
    if (!file) {
      toast({
        title: "No file selected",
        description: "Please select a roster file to upload",
        variant: "destructive",
      })
      return
    }

    setIsUploading(true)
    setUploadProgress(0)

    const formData = new FormData()
    formData.append('roster', file)
    formData.append('periodNumber', data.periodNumber)
    if (data.academicYear) {
      formData.append('academicYear', data.academicYear)
    }

    try {
      const response = await api.post('/rosters/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const progress = progressEvent.total
            ? Math.round((progressEvent.loaded * 100) / progressEvent.total)
            : 0
          setUploadProgress(progress)
        },
      })

      toast({
        title: "Roster uploaded successfully",
        description: `Added ${response.data.studentsAdded} students to Period ${data.periodNumber}`,
      })

      router.push(`/periods/${response.data.periodId}`)
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.response?.data?.message || "Failed to upload roster",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Upload Roster</h1>
        <p className="text-muted-foreground mt-2">
          Upload a CSV or Excel file with your student roster
        </p>
      </div>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Your file should have columns for Student ID, First Name, and Last Name.
          Email is optional. The first row should contain column headers.
        </AlertDescription>
      </Alert>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Period Information</CardTitle>
            <CardDescription>
              Select the class period for this roster
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="periodNumber">Period Number *</Label>
                <Select
                  value={watch('periodNumber')}
                  onValueChange={(value) => setValue('periodNumber', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select period" />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
                      <SelectItem key={num} value={num.toString()}>
                        Period {num}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.periodNumber && (
                  <p className="text-sm text-red-600">{errors.periodNumber.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="academicYear">Academic Year (Optional)</Label>
                <Input
                  id="academicYear"
                  placeholder="2024-2025"
                  {...register('academicYear')}
                />
                <p className="text-xs text-muted-foreground">
                  Format: YYYY-YYYY (e.g., 2024-2025)
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upload File</CardTitle>
            <CardDescription>
              Drag and drop your roster file or click to browse
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                isDragActive ? 'border-primary bg-primary/5' : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <input {...getInputProps()} />
              {file ? (
                <div className="space-y-2">
                  <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto" />
                  <p className="text-sm font-medium">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(file.size / 1024).toFixed(1)} KB
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      setFile(null)
                    }}
                  >
                    Remove
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Upload className="h-12 w-12 text-gray-400 mx-auto" />
                  <p className="text-sm text-gray-600">
                    {isDragActive
                      ? "Drop the file here"
                      : "Drag and drop your roster file here, or click to select"}
                  </p>
                  <p className="text-xs text-gray-500">
                    Supports CSV, XLS, and XLSX files up to 10MB
                  </p>
                </div>
              )}
            </div>

            {isUploading && (
              <div className="mt-4">
                <div className="flex items-center justify-between text-sm mb-1">
                  <span>Uploading...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}
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
          <div className="space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => window.open('/api/rosters/template', '_blank')}
            >
              <FileText className="mr-2 h-4 w-4" />
              Download Template
            </Button>
            <Button type="submit" disabled={isUploading || !file}>
              {isUploading ? "Uploading..." : "Upload Roster"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}

// src/app/(dashboard)/periods/[id]/students/page.tsx
"use client"

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  Plus,
  Search,
  MoreVertical,
  Upload,
  UserMinus,
  Edit,
  Trash2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
import { AddStudentDialog } from "@/components/add-student-dialog"
import { EditStudentDialog } from "@/components/edit-student-dialog"

interface Student {
  id: string
  studentId: string
  firstName: string
  lastName: string
  email?: string
  isActive: boolean
}

export default function PeriodStudentsPage() {
  const { id: periodId } = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState("")
  const [selectedStudents, setSelectedStudents] = useState<string[]>([])
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [editStudent, setEditStudent] = useState<Student | null>(null)

  const { data: period, isLoading: periodLoading } = useQuery({
    queryKey: ["period", periodId],
    queryFn: async () => {
      const response = await api.get(`/periods/${periodId}`)
      return response.data
    },
  })

  const { data: students, isLoading: studentsLoading } = useQuery({
    queryKey: ["period-students", periodId, search],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (search) params.append("search", search)
      const response = await api.get(`/rosters/period/${periodId}?${params}`)
      return response.data.students
    },
  })

  const removeStudentsMutation = useMutation({
    mutationFn: async (studentIds: string[]) => {
      return api.put(`/rosters/period/${periodId}`, {
        action: "remove",
        students: studentIds,
      })
    },
    onSuccess: () => {
      toast({
        title: "Students removed",
        description: `${selectedStudents.length} student(s) removed from the period`,
      })
      setSelectedStudents([])
      queryClient.invalidateQueries({ queryKey: ["period-students", periodId] })
    },
    onError: () => {
      toast({
        title: "Failed to remove students",
        variant: "destructive",
      })
    },
  })

  const handleSelectAll = () => {
    if (selectedStudents.length === students?.length) {
      setSelectedStudents([])
    } else {
      setSelectedStudents(students?.map((s: Student) => s.id) || [])
    }
  }

  const handleSelectStudent = (studentId: string) => {
    setSelectedStudents((prev) =>
      prev.includes(studentId)
        ? prev.filter((id) => id !== studentId)
        : [...prev, studentId]
    )
  }

  const filteredStudents = students?.filter((student: Student) => {
    const searchTerm = search.toLowerCase()
    return (
      student.firstName.toLowerCase().includes(searchTerm) ||
      student.lastName.toLowerCase().includes(searchTerm) ||
      student.studentId.toLowerCase().includes(searchTerm) ||
      student.email?.toLowerCase().includes(searchTerm)
    )
  })

  if (periodLoading) {
    return <Skeleton className="h-96" />
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {period?.name} - Students
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage students in this class period
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <a href={`/roster/upload?period=${periodId}`}>
              <Upload className="mr-2 h-4 w-4" />
              Upload Roster
            </a>
          </Button>
          <Button onClick={() => setAddDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Student
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search students..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        {selectedStudents.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {selectedStudents.length} selected
            </span>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => removeStudentsMutation.mutate(selectedStudents)}
            >
              <UserMinus className="mr-2 h-4 w-4" />
              Remove Selected
            </Button>
          </div>
        )}
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <input
                  type="checkbox"
                  checked={
                    students?.length > 0 &&
                    selectedStudents.length === students?.length
                  }
                  onChange={handleSelectAll}
                  className="rounded border-gray-300"
                />
              </TableHead>
              <TableHead>Student ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {studentsLoading ? (
              [...Array(5)].map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={6}>
                    <Skeleton className="h-8" />
                  </TableCell>
                </TableRow>
              ))
            ) : filteredStudents?.length > 0 ? (
              filteredStudents.map((student: Student) => (
                <TableRow key={student.id}>
                  <TableCell>
                    <input
                      type="checkbox"
                      checked={selectedStudents.includes(student.id)}
                      onChange={() => handleSelectStudent(student.id)}
                      className="rounded border-gray-300"
                    />
                  </TableCell>
                  <TableCell className="font-medium">{student.studentId}</TableCell>
                  <TableCell>
                    {student.firstName} {student.lastName}
                  </TableCell>
                  <TableCell>{student.email || "-"}</TableCell>
                  <TableCell>
                    <Badge variant={student.isActive ? "default" : "secondary"}>
                      {student.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setEditStudent(student)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => removeStudentsMutation.mutate([student.id])}
                          className="text-red-600"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Remove from Period
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  No students found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      <AddStudentDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        periodId={periodId as string}
      />

      {editStudent && (
        <EditStudentDialog
          open={!!editStudent}
          onOpenChange={(open) => !open && setEditStudent(null)}
          student={editStudent}
        />
      )}
    </div>
  )
}
