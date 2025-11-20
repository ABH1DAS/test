import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MapPin, Clock, ThumbsUp, MessageCircle } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import Link from "next/link"

const mockProblems = [
  {
    id: 1,
    user: { name: "Rajesh Kumar", avatar: "/indian-man.png" },
    category: "Road",
    title: "Large pothole on MG Road",
    description: "Deep pothole causing traffic issues and vehicle damage near City Mall.",
    image: "/pothole-on-road.jpg",
    location: "MG Road, Sector 14",
    status: "pending",
    timestamp: "2 hours ago",
    upvotes: 12,
    comments: 3,
  },
  {
    id: 2,
    user: { name: "Priya Sharma", avatar: "/serene-indian-woman.png" },
    category: "Garbage",
    title: "Overflowing garbage bins",
    description: "Multiple garbage bins overflowing for past 3 days, creating unhygienic conditions.",
    image: "/overflowing-garbage-bins.jpg",
    location: "Park Street, Block A",
    status: "in-progress",
    timestamp: "5 hours ago",
    upvotes: 8,
    comments: 5,
  },
  {
    id: 3,
    user: { name: "Amit Patel", avatar: "/indian-man-glasses.png" },
    category: "Electricity",
    title: "Street light not working",
    description: "Street light has been non-functional for over a week, making the area unsafe at night.",
    image: "/broken-street-light.png",
    location: "Gandhi Nagar, Lane 5",
    status: "resolved",
    timestamp: "1 day ago",
    upvotes: 15,
    comments: 7,
  },
]

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
  const iconClass = "w-4 h-4"
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

export function ProblemFeed() {
  return (
    <div className="space-y-6">
      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        <Button variant="default" size="sm" className="whitespace-nowrap">
          Nearby
        </Button>
        <Button variant="outline" size="sm" className="whitespace-nowrap bg-transparent">
          Trending
        </Button>
        <Button variant="outline" size="sm" className="whitespace-nowrap bg-transparent">
          Resolved
        </Button>
        <Button variant="outline" size="sm" className="whitespace-nowrap bg-transparent">
          My Reports
        </Button>
      </div>

      {/* Problem Cards */}
      <div className="space-y-4">
        {mockProblems.map((problem) => (
          <Card key={problem.id} className="overflow-hidden hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              {/* User Info */}
              <div className="flex items-center gap-3 mb-3">
                <Avatar className="w-10 h-10">
                  <AvatarImage src={problem.user.avatar || "/placeholder.svg"} alt={problem.user.name} />
                  <AvatarFallback>
                    {problem.user.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{problem.user.name}</span>
                    <span className="text-lg">{getCategoryIcon(problem.category)}</span>
                    <Badge variant="outline" className="text-xs">
                      {problem.category}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    {problem.timestamp}
                  </div>
                </div>
                <Badge className={getStatusColor(problem.status)}>{problem.status.replace("-", " ")}</Badge>
              </div>

              {/* Problem Content */}
              <div className="space-y-3">
                <h3 className="font-semibold text-balance">{problem.title}</h3>
                <p className="text-sm text-muted-foreground text-pretty line-clamp-2">{problem.description}</p>

                {/* Problem Image */}
                <div className="rounded-lg overflow-hidden">
                  <img
                    src={problem.image || "/placeholder.svg"}
                    alt={problem.title}
                    className="w-full h-48 object-cover"
                  />
                </div>

                {/* Location */}
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <MapPin className="w-4 h-4" />
                  {problem.location}
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-2 border-t border-border">
                  <div className="flex items-center gap-4">
                    <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground hover:text-primary">
                      <ThumbsUp className="w-4 h-4" />
                      {problem.upvotes}
                    </Button>
                    <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground hover:text-primary">
                      <MessageCircle className="w-4 h-4" />
                      {problem.comments}
                    </Button>
                  </div>
                  <Link href={`/problem/${problem.id}`}>
                    <Button variant="outline" size="sm">
                      View Details
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
