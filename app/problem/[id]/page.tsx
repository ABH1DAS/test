import { ProblemDetails } from "@/components/problem-details"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

// Mock data - in a real app, this would come from a database
const mockProblem = {
  id: "1",
  user: { name: "Rajesh Kumar", avatar: "/indian-man.png" },
  category: "Road",
  title: "Large pothole on MG Road",
  description:
    "Deep pothole causing traffic issues and vehicle damage near City Mall. This has been an ongoing issue for the past two weeks and is getting worse with each passing day. Multiple vehicles have been damaged, and it's becoming a safety hazard for commuters.",
  images: ["/pothole-on-road.jpg", "/pothole-damage.jpg"],
  location: "MG Road, Sector 14",
  coordinates: { lat: 28.4595, lng: 77.0266 },
  status: "pending",
  timestamp: "2 hours ago",
  upvotes: 12,
  comments: [
    {
      id: 1,
      user: { name: "Priya Sharma", avatar: "/serene-indian-woman.png" },
      text: "I've also faced this issue. My car's tire got damaged yesterday.",
      timestamp: "1 hour ago",
    },
    {
      id: 2,
      user: { name: "Amit Patel", avatar: "/indian-man-glasses.png" },
      text: "This needs immediate attention. It's causing traffic jams during peak hours.",
      timestamp: "45 minutes ago",
    },
  ],
  statusHistory: [
    { status: "reported", timestamp: "2 hours ago", description: "Problem reported by citizen" },
    { status: "acknowledged", timestamp: "1 hour ago", description: "Acknowledged by Municipal Corporation" },
  ],
}

export default function ProblemDetailsPage({ params }: { params: { id: string } }) {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            <Link href="/">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="font-semibold text-lg text-foreground">Problem Details</h1>
              <p className="text-xs text-muted-foreground">Report #{params.id}</p>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 py-6">
        <ProblemDetails problem={mockProblem} />
      </main>
    </div>
  )
}
