"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { MapPin, Clock, ThumbsUp, MessageCircle, Send, Share2, Flag, CheckCircle2 } from "lucide-react"
import { Separator } from "@/components/ui/separator"

interface Problem {
  id: string
  user: { name: string; avatar: string }
  category: string
  title: string
  description: string
  images: string[]
  location: string
  coordinates: { lat: number; lng: number }
  status: string
  timestamp: string
  upvotes: number
  comments: Array<{
    id: number
    user: { name: string; avatar: string }
    text: string
    timestamp: string
  }>
  statusHistory: Array<{
    status: string
    timestamp: string
    description: string
  }>
}

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

export function ProblemDetails({ problem }: { problem: Problem }) {
  const [isUpvoted, setIsUpvoted] = useState(false)
  const [upvoteCount, setUpvoteCount] = useState(problem.upvotes)
  const [newComment, setNewComment] = useState("")
  const [comments, setComments] = useState(problem.comments)

  const handleUpvote = () => {
    if (isUpvoted) {
      setUpvoteCount(upvoteCount - 1)
      setIsUpvoted(false)
    } else {
      setUpvoteCount(upvoteCount + 1)
      setIsUpvoted(true)
    }
  }

  const handleAddComment = () => {
    if (newComment.trim()) {
      const comment = {
        id: comments.length + 1,
        user: { name: "Current User", avatar: "/placeholder.svg" },
        text: newComment,
        timestamp: "Just now",
      }
      setComments([...comments, comment])
      setNewComment("")
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Main Problem Card */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="w-12 h-12">
                <AvatarImage src={problem.user.avatar || "/placeholder.svg"} alt={problem.user.name} />
                <AvatarFallback>
                  {problem.user.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{problem.user.name}</span>
                  <span className="text-2xl">{getCategoryIcon(problem.category)}</span>
                  <Badge variant="outline">{problem.category}</Badge>
                </div>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  {problem.timestamp}
                </div>
              </div>
            </div>
            <Badge className={getStatusColor(problem.status)}>{problem.status.replace("-", " ")}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Title and Description */}
          <div className="space-y-3">
            <h1 className="text-2xl font-semibold text-balance">{problem.title}</h1>
            <p className="text-muted-foreground leading-relaxed text-pretty">{problem.description}</p>
          </div>

          {/* Images */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {problem.images.map((image, index) => (
              <div key={index} className="rounded-lg overflow-hidden">
                <img
                  src={image || "/placeholder.svg"}
                  alt={`Problem image ${index + 1}`}
                  className="w-full h-64 object-cover"
                />
              </div>
            ))}
          </div>

          {/* Location */}
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="w-5 h-5" />
            <span>{problem.location}</span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-border">
            <div className="flex items-center gap-4">
              <Button variant={isUpvoted ? "default" : "ghost"} size="sm" onClick={handleUpvote} className="gap-2">
                <ThumbsUp className="w-4 h-4" />
                {upvoteCount}
              </Button>
              <Button variant="ghost" size="sm" className="gap-2">
                <MessageCircle className="w-4 h-4" />
                {comments.length}
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm">
                <Share2 className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <Flag className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Status Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5" />
            Status Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {problem.statusHistory.map((status, index) => (
              <div key={index} className="flex items-start gap-3">
                <div className="w-2 h-2 bg-primary rounded-full mt-2" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium capitalize">{status.status.replace("-", " ")}</span>
                    <span className="text-sm text-muted-foreground">{status.timestamp}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{status.description}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Comments Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5" />
            Comments ({comments.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Add Comment */}
          <div className="space-y-3">
            <Textarea
              placeholder="Add your comment or support for this issue..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              rows={3}
            />
            <Button onClick={handleAddComment} disabled={!newComment.trim()} className="gap-2">
              <Send className="w-4 h-4" />
              Post Comment
            </Button>
          </div>

          <Separator />

          {/* Comments List */}
          <div className="space-y-4">
            {comments.map((comment) => (
              <div key={comment.id} className="flex items-start gap-3">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={comment.user.avatar || "/placeholder.svg"} alt={comment.user.name} />
                  <AvatarFallback>
                    {comment.user.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{comment.user.name}</span>
                    <span className="text-xs text-muted-foreground">{comment.timestamp}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{comment.text}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
