"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { BarChart3, TrendingUp, Clock, CheckCircle2, AlertCircle, MapPin, Search } from "lucide-react"
import { Progress } from "@/components/ui/progress"

// Mock data for status tracking
const statusStats = {
  total: 156,
  pending: 45,
  acknowledged: 32,
  inProgress: 38,
  resolved: 41,
}

const recentUpdates = [
  {
    id: 1,
    title: "Large pothole on MG Road",
    category: "Road",
    status: "acknowledged",
    previousStatus: "pending",
    updatedBy: "Municipal Corporation",
    timestamp: "2 hours ago",
    location: "MG Road, Sector 14",
    user: { name: "Rajesh Kumar", avatar: "/indian-man.png" },
  },
  {
    id: 2,
    title: "Street light not working",
    category: "Electricity",
    status: "resolved",
    previousStatus: "in-progress",
    updatedBy: "Electricity Board",
    timestamp: "4 hours ago",
    location: "Gandhi Nagar, Lane 5",
    user: { name: "Amit Patel", avatar: "/indian-man-glasses.png" },
  },
  {
    id: 3,
    title: "Overflowing garbage bins",
    category: "Garbage",
    status: "in-progress",
    previousStatus: "acknowledged",
    updatedBy: "Sanitation Department",
    timestamp: "6 hours ago",
    location: "Park Street, Block A",
    user: { name: "Priya Sharma", avatar: "/serene-indian-woman.png" },
  },
]

const categoryStats = [
  { category: "Road", total: 45, resolved: 18, percentage: 40 },
  { category: "Garbage", total: 38, resolved: 15, percentage: 39 },
  { category: "Electricity", total: 32, resolved: 14, percentage: 44 },
  { category: "Water", total: 28, resolved: 12, percentage: 43 },
  { category: "Other", total: 13, resolved: 6, percentage: 46 },
]

const getStatusColor = (status: string) => {
  switch (status) {
    case "pending":
      return "bg-yellow-100 text-yellow-800 border-yellow-200"
    case "acknowledged":
      return "bg-blue-100 text-blue-800 border-blue-200"
    case "in-progress":
      return "bg-purple-100 text-purple-800 border-purple-200"
    case "resolved":
      return "bg-green-100 text-green-800 border-green-200"
    default:
      return "bg-gray-100 text-gray-800 border-gray-200"
  }
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case "pending":
      return <Clock className="w-4 h-4" />
    case "acknowledged":
      return <AlertCircle className="w-4 h-4" />
    case "in-progress":
      return <TrendingUp className="w-4 h-4" />
    case "resolved":
      return <CheckCircle2 className="w-4 h-4" />
    default:
      return <Clock className="w-4 h-4" />
  }
}

const getCategoryIcon = (category: string) => {
  switch (category) {
    case "Road":
      return "🛣️"
    case "Garbage":
      return "🗑️"
    case "Electricity":
      return "⚡"
    case "Water":
      return "💧"
    default:
      return "📋"
  }
}

export function StatusDashboard() {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [categoryFilter, setCategoryFilter] = useState("all")

  const resolutionRate = Math.round((statusStats.resolved / statusStats.total) * 100)

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-foreground">{statusStats.total}</div>
            <div className="text-sm text-muted-foreground">Total Reports</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">{statusStats.pending}</div>
            <div className="text-sm text-muted-foreground">Pending</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{statusStats.acknowledged}</div>
            <div className="text-sm text-muted-foreground">Acknowledged</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">{statusStats.inProgress}</div>
            <div className="text-sm text-muted-foreground">In Progress</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{statusStats.resolved}</div>
            <div className="text-sm text-muted-foreground">Resolved</div>
          </CardContent>
        </Card>
      </div>

      {/* Resolution Rate */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Overall Resolution Rate
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress</span>
              <span>{resolutionRate}%</span>
            </div>
            <Progress value={resolutionRate} className="h-2" />
            <p className="text-sm text-muted-foreground">
              {statusStats.resolved} out of {statusStats.total} issues have been resolved
            </p>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="updates" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="updates">Recent Updates</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>

        {/* Recent Updates Tab */}
        <TabsContent value="updates" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      placeholder="Search reports..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="acknowledged">Acknowledged</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue placeholder="Filter by category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="road">Road</SelectItem>
                    <SelectItem value="garbage">Garbage</SelectItem>
                    <SelectItem value="electricity">Electricity</SelectItem>
                    <SelectItem value="water">Water</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Updates List */}
          <div className="space-y-4">
            {recentUpdates.map((update) => (
              <Card key={update.id}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={update.user.avatar || "/placeholder.svg"} alt={update.user.name} />
                      <AvatarFallback>
                        {update.user.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-lg">{getCategoryIcon(update.category)}</span>
                            <Badge variant="outline" className="text-xs">
                              {update.category}
                            </Badge>
                          </div>
                          <h3 className="font-medium">{update.title}</h3>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <MapPin className="w-3 h-3" />
                            {update.location}
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge className={getStatusColor(update.status)}>
                            {getStatusIcon(update.status)}
                            <span className="ml-1">{update.status.replace("-", " ")}</span>
                          </Badge>
                          <p className="text-xs text-muted-foreground mt-1">{update.timestamp}</p>
                        </div>
                      </div>
                      <div className="bg-muted p-3 rounded-lg">
                        <p className="text-sm">
                          <span className="font-medium">Status updated by {update.updatedBy}</span>
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Changed from{" "}
                          <Badge variant="outline" className="text-xs">
                            {update.previousStatus.replace("-", " ")}
                          </Badge>{" "}
                          to <Badge className={getStatusColor(update.status)}>{update.status.replace("-", " ")}</Badge>
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Category Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {categoryStats.map((stat) => (
                  <div key={stat.category} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{getCategoryIcon(stat.category)}</span>
                        <span className="font-medium">{stat.category}</span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {stat.resolved}/{stat.total} ({stat.percentage}%)
                      </div>
                    </div>
                    <Progress value={stat.percentage} className="h-2" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Average Resolution Time</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-primary">5.2 days</div>
                <p className="text-sm text-muted-foreground">Across all categories</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Most Active Area</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold text-foreground">Sector 14</div>
                <p className="text-sm text-muted-foreground">23 reports this month</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Real-time Updates</p>
                  <p className="text-sm text-muted-foreground">Get notified immediately when status changes</p>
                </div>
                <Button variant="outline" size="sm">
                  Enabled
                </Button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Daily Summary</p>
                  <p className="text-sm text-muted-foreground">Receive daily summary of all status updates</p>
                </div>
                <Button variant="outline" size="sm">
                  Enabled
                </Button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Weekly Report</p>
                  <p className="text-sm text-muted-foreground">Get weekly analytics and trends</p>
                </div>
                <Button variant="outline" size="sm">
                  Disabled
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Notifications</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
                <div>
                  <p className="font-medium text-sm">Issue Resolved</p>
                  <p className="text-xs text-muted-foreground">
                    Your report "Street light not working" has been resolved
                  </p>
                  <p className="text-xs text-muted-foreground">2 hours ago</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                <TrendingUp className="w-5 h-5 text-purple-600 mt-0.5" />
                <div>
                  <p className="font-medium text-sm">Status Update</p>
                  <p className="text-xs text-muted-foreground">"Large pothole on MG Road" is now in progress</p>
                  <p className="text-xs text-muted-foreground">4 hours ago</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="font-medium text-sm">Report Acknowledged</p>
                  <p className="text-xs text-muted-foreground">
                    Municipal Corporation acknowledged your garbage report
                  </p>
                  <p className="text-xs text-muted-foreground">1 day ago</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
