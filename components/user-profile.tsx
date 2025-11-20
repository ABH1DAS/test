"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { User, MapPin, Clock, Bell, Globe, Shield, Camera, Edit3 } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import Link from "next/link"

// Mock user data
const mockUser = {
  name: "Rajesh Kumar",
  email: "rajesh.kumar@email.com",
  phone: "+91 9876543210",
  avatar: "/indian-man.png",
  location: "New Delhi, India",
  joinedDate: "January 2024",
  stats: {
    totalReports: 15,
    resolvedReports: 8,
    pendingReports: 5,
    inProgressReports: 2,
  },
  recentReports: [
    {
      id: 1,
      title: "Large pothole on MG Road",
      category: "Road",
      status: "pending",
      timestamp: "2 hours ago",
      image: "/pothole-on-road.jpg",
    },
    {
      id: 2,
      title: "Street light not working",
      category: "Electricity",
      status: "resolved",
      timestamp: "3 days ago",
      image: "/broken-street-light.png",
    },
    {
      id: 3,
      title: "Garbage collection missed",
      category: "Garbage",
      status: "in-progress",
      timestamp: "1 week ago",
      image: "/overflowing-garbage-bins.jpg",
    },
  ],
}

const getStatusColor = (status: string) => {
  switch (status) {
    case "pending":
      return "bg-yellow-100 text-yellow-800 border-yellow-200"
    case "in-progress":
      return "bg-blue-100 text-blue-800 border-blue-200"
    case "resolved":
      return "bg-green-100 text-green-800 border-green-200"
    default:
      return "bg-gray-100 text-gray-800 border-gray-200"
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

export function UserProfile() {
  const [isEditing, setIsEditing] = useState(false)
  const [userInfo, setUserInfo] = useState({
    name: mockUser.name,
    email: mockUser.email,
    phone: mockUser.phone,
    location: mockUser.location,
  })

  const handleSave = () => {
    setIsEditing(false)
    // In a real app, this would save to the backend
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Profile Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start gap-6">
            <div className="relative">
              <Avatar className="w-24 h-24">
                <AvatarImage src={mockUser.avatar || "/placeholder.svg"} alt={mockUser.name} />
                <AvatarFallback className="text-2xl">
                  {mockUser.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <Button size="icon" variant="outline" className="absolute -bottom-2 -right-2 w-8 h-8 bg-transparent">
                <Camera className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex-1 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-2xl font-semibold">{mockUser.name}</h1>
                  <div className="flex items-center gap-2 text-muted-foreground mt-1">
                    <MapPin className="w-4 h-4" />
                    <span>{mockUser.location}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">Member since {mockUser.joinedDate}</p>
                </div>
                <Button variant="outline" onClick={() => setIsEditing(!isEditing)} className="gap-2">
                  <Edit3 className="w-4 h-4" />
                  {isEditing ? "Cancel" : "Edit Profile"}
                </Button>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-muted rounded-lg">
                  <div className="text-2xl font-bold text-primary">{mockUser.stats.totalReports}</div>
                  <div className="text-xs text-muted-foreground">Total Reports</div>
                </div>
                <div className="text-center p-3 bg-muted rounded-lg">
                  <div className="text-2xl font-bold text-secondary">{mockUser.stats.resolvedReports}</div>
                  <div className="text-xs text-muted-foreground">Resolved</div>
                </div>
                <div className="text-center p-3 bg-muted rounded-lg">
                  <div className="text-2xl font-bold text-accent">{mockUser.stats.inProgressReports}</div>
                  <div className="text-xs text-muted-foreground">In Progress</div>
                </div>
                <div className="text-center p-3 bg-muted rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">{mockUser.stats.pendingReports}</div>
                  <div className="text-xs text-muted-foreground">Pending</div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="reports" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="reports">My Reports</TabsTrigger>
          <TabsTrigger value="profile">Profile Info</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* My Reports Tab */}
        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Reports</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {mockUser.recentReports.map((report) => (
                <div key={report.id} className="flex items-center gap-4 p-4 border rounded-lg">
                  <img
                    src={report.image || "/placeholder.svg"}
                    alt={report.title}
                    className="w-16 h-16 object-cover rounded-lg"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">{getCategoryIcon(report.category)}</span>
                      <Badge variant="outline" className="text-xs">
                        {report.category}
                      </Badge>
                      <Badge className={getStatusColor(report.status)}>{report.status.replace("-", " ")}</Badge>
                    </div>
                    <h3 className="font-medium">{report.title}</h3>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      {report.timestamp}
                    </div>
                  </div>
                  <Link href={`/problem/${report.id}`}>
                    <Button variant="outline" size="sm">
                      View
                    </Button>
                  </Link>
                </div>
              ))}
              <Button variant="outline" className="w-full bg-transparent">
                View All Reports
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Profile Info Tab */}
        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isEditing ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={userInfo.name}
                      onChange={(e) => setUserInfo({ ...userInfo, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={userInfo.email}
                      onChange={(e) => setUserInfo({ ...userInfo, email: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      value={userInfo.phone}
                      onChange={(e) => setUserInfo({ ...userInfo, phone: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      value={userInfo.location}
                      onChange={(e) => setUserInfo({ ...userInfo, location: e.target.value })}
                    />
                  </div>
                  <div className="flex gap-3">
                    <Button onClick={handleSave}>Save Changes</Button>
                    <Button variant="outline" onClick={() => setIsEditing(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <User className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{userInfo.name}</p>
                      <p className="text-sm text-muted-foreground">Full Name</p>
                    </div>
                  </div>
                  <Separator />
                  <div className="flex items-center gap-3">
                    <span className="w-5 h-5 text-muted-foreground">@</span>
                    <div>
                      <p className="font-medium">{userInfo.email}</p>
                      <p className="text-sm text-muted-foreground">Email Address</p>
                    </div>
                  </div>
                  <Separator />
                  <div className="flex items-center gap-3">
                    <span className="w-5 h-5 text-muted-foreground">📱</span>
                    <div>
                      <p className="font-medium">{userInfo.phone}</p>
                      <p className="text-sm text-muted-foreground">Phone Number</p>
                    </div>
                  </div>
                  <Separator />
                  <div className="flex items-center gap-3">
                    <MapPin className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{userInfo.location}</p>
                      <p className="text-sm text-muted-foreground">Location</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Notifications
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Status Updates</p>
                  <p className="text-sm text-muted-foreground">Get notified when your reports are updated</p>
                </div>
                <Button variant="outline" size="sm">
                  Enabled
                </Button>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Community Updates</p>
                  <p className="text-sm text-muted-foreground">Get notified about issues in your area</p>
                </div>
                <Button variant="outline" size="sm">
                  Enabled
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5" />
                Language & Region
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Language</Label>
                <Select defaultValue="english">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="english">English</SelectItem>
                    <SelectItem value="hindi">हिंदी (Hindi)</SelectItem>
                    <SelectItem value="bengali">বাংলা (Bengali)</SelectItem>
                    <SelectItem value="assamese">অসমীয়া (Assamese)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Privacy & Security
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button variant="outline" className="w-full justify-start bg-transparent">
                Change Password
              </Button>
              <Button variant="outline" className="w-full justify-start bg-transparent">
                Privacy Settings
              </Button>
              <Button variant="outline" className="w-full justify-start text-destructive bg-transparent">
                Delete Account
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
