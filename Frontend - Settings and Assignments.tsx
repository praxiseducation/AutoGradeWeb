// src/app/(dashboard)/settings/page.tsx
"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useMutation, useQuery } from "@tanstack/react-query"
import {
  User,
  School,
  Bell,
  Shield,
  CreditCard,
  HelpCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/components/ui/use-toast"
import { api } from "@/lib/api"

const profileSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  school: z.string().optional(),
})

const passwordSchema = z.object({
  currentPassword: z.string().min(6),
  newPassword: z.string().min(6),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

type ProfileFormData = z.infer<typeof profileSchema>
type PasswordFormData = z.infer<typeof passwordSchema>

export default function SettingsPage() {
  const { data: session, update } = useSession()
  const { toast } = useToast()
  const [notifications, setNotifications] = useState({
    emailReports: true,
    processingComplete: true,
    weeklyDigest: false,
  })

  const { data: userSettings } = useQuery({
    queryKey: ["user-settings"],
    queryFn: async () => {
      const response = await api.get("/users/settings")
      return response.data
    },
  })

  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    formState: { errors: profileErrors },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: session?.user?.name || "",
      email: session?.user?.email || "",
      school: userSettings?.school || "",
    },
  })

  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    formState: { errors: passwordErrors },
    reset: resetPassword,
  } = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
  })

  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileFormData) => {
      const response = await api.put("/users/profile", data)
      return response.data
    },
    onSuccess: (data) => {
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully",
      })
      update({ name: data.name })
    },
    onError: () => {
      toast({
        title: "Update failed",
        variant: "destructive",
      })
    },
  })

  const updatePasswordMutation = useMutation({
    mutationFn: async (data: PasswordFormData) => {
      const response = await api.post("/users/change-password", {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      })
      return response.data
    },
    onSuccess: () => {
      toast({
        title: "Password updated",
        description: "Your password has been changed successfully",
      })
      resetPassword()
    },
    onError: () => {
      toast({
        title: "Password update failed",
        description: "Please check your current password",
        variant: "destructive",
      })
    },
  })

  const updateNotificationsMutation = useMutation({
    mutationFn: async (settings: typeof notifications) => {
      const response = await api.put("/users/notifications", settings)
      return response.data
    },
    onSuccess: () => {
      toast({
        title: "Notification preferences updated",
      })
    },
  })

  const handleNotificationChange = (key: keyof typeof notifications) => {
    const newSettings = { ...notifications, [key]: !notifications[key] }
    setNotifications(newSettings)
    updateNotificationsMutation.mutate(newSettings)
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-2">
          Manage your account settings and preferences
        </p>
      </div>

      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:grid-cols-none">
          <TabsTrigger value="profile" className="gap-2">
            <User className="h-4 w-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2">
            <Shield className="h-4 w-4" />
            Security
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="billing" className="gap-2">
            <CreditCard className="h-4 w-4" />
            Billing
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>
                Update your account information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleProfileSubmit((data) => updateProfileMutation.mutate(data))} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      {...registerProfile("name")}
                    />
                    {profileErrors.name && (
                      <p className="text-sm text-red-600">{profileErrors.name.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      {...registerProfile("email")}
                      disabled
                    />
                    {profileErrors.email && (
                      <p className="text-sm text-red-600">{profileErrors.email.message}</p>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="school">School</Label>
                  <Input
                    id="school"
                    placeholder="Enter your school name"
                    {...registerProfile("school")}
                  />
                </div>
                <Button type="submit" disabled={updateProfileMutation.isPending}>
                  {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
              <CardDescription>
                Update your password to keep your account secure
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordSubmit((data) => updatePasswordMutation.mutate(data))} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    {...registerPassword("currentPassword")}
                  />
                  {passwordErrors.currentPassword && (
                    <p className="text-sm text-red-600">{passwordErrors.currentPassword.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    {...registerPassword("newPassword")}
                  />
                  {passwordErrors.newPassword && (
                    <p className="text-sm text-red-600">{passwordErrors.newPassword.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    {...registerPassword("confirmPassword")}
                  />
                  {passwordErrors.confirmPassword && (
                    <p className="text-sm text-red-600">{passwordErrors.confirmPassword.message}</p>
                  )}
                </div>
                <Button type="submit" disabled={updatePasswordMutation.isPending}>
                  {updatePasswordMutation.isPending ? "Updating..." : "Update Password"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Email Notifications</CardTitle>
              <CardDescription>
                Choose what notifications you want to receive
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Grade Reports</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive email when grade reports are ready
                  </p>
                </div>
                <Switch
                  checked={notifications.emailReports}
                  onCheckedChange={() => handleNotificationChange("emailReports")}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Processing Complete</Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified when grade sheet processing is done
                  </p>
                </div>
                <Switch
                  checked={notifications.processingComplete}
                  onCheckedChange={() => handleNotificationChange("processingComplete")}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Weekly Digest</Label>
                  <p className="text-sm text-muted-foreground">
                    Weekly summary of your grading activity
                  </p>
                </div>
                <Switch
                  checked={notifications.weeklyDigest}
                  onCheckedChange={() => handleNotificationChange("weeklyDigest")}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="billing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Subscription</CardTitle>
              <CardDescription>
                Manage your subscription and billing
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Free Plan</p>
                    <p className="text-sm text-muted-foreground">
                      Process up to 100 grade sheets per month
                    </p>
                  </div>
                  <Button variant="outline">Upgrade</Button>
                </div>
                <Separator />
                <div className="space-y-2">
                  <p className="text-sm font-medium">Usage This Month</p>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>Grade Sheets Processed</span>
                      <span>42 / 100</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full"
                        style={{ width: "42%" }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

// src/app/(dashboard)/assignments/page.tsx
"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Plus, Search, Calendar, Users, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import Link from "next/link"
import { api } from "@/lib/api"
import { format } from "date-fns"

interface Assignment {
  id: string
  name: string
  createdAt: string
  periods: { id: string; name: string }[]
  gradingScale: string[]
  gradeSheetCount: number
  processedCount: number
}

export default function AssignmentsPage() {
  const [search, setSearch] = useState("")

  const { data: assignments, isLoading } = useQuery({
    queryKey: ["assignments", search],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (search) params.append("search", search)
      const response = await api.get(`/assignments?${params}`)
      return response.data
    },
  })

  const filteredAssignments = assignments?.filter((assignment: Assignment) =>
    assignment.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Assignments</h1>
          <p className="text-muted-foreground mt-2">
            View all your assignments and their grading progress
          </p>
        </div>
        <Button asChild>
          <Link href="/gradesheets/generate">
            <Plus className="mr-2 h-4 w-4" />
            New Assignment
          </Link>
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search assignments..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      ) : filteredAssignments?.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredAssignments.map((assignment: Assignment) => (
            <Card key={assignment.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg">{assignment.name}</CardTitle>
                  <Badge variant={assignment.processedCount === assignment.gradeSheetCount ? "success" : "secondary"}>
                    {assignment.processedCount}/{assignment.gradeSheetCount} Processed
                  </Badge>
                </div>
                <CardDescription>
                  Created {format(new Date(assignment.createdAt), "MMM d, yyyy")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>{assignment.periods.length} period(s)</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <FileText className="h-4 w-4" />
                    <span>Scale: {assignment.gradingScale.join(", ")}</span>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button variant="outline" size="sm" asChild className="flex-1">
                      <Link href={`/gradesheets?assignment=${assignment.id}`}>
                        View Sheets
                      </Link>
                    </Button>
                    <Button variant="outline" size="sm" asChild className="flex-1">
                      <Link href={`/export?assignment=${assignment.id}`}>
                        Export
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center">
              No assignments found. Create your first assignment to get started.
            </p>
            <Button asChild className="mt-4">
              <Link href="/gradesheets/generate">Create Assignment</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
