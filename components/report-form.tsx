"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Camera, MapPin, Upload, X, CheckCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"

const problemCategories = [
  { value: "road", label: "Road Issues", icon: "🛣️", description: "Potholes, damaged roads, traffic signals" },
  { value: "garbage", label: "Garbage & Sanitation", icon: "🗑️", description: "Waste management, cleanliness" },
  {
    value: "electricity",
    label: "Electricity",
    icon: "⚡",
    description: "Power outages, street lights, electrical issues",
  },
  { value: "water", label: "Water Supply", icon: "💧", description: "Water shortage, leakage, quality issues" },
  { value: "housing", label: "Housing & Buildings", icon: "🏠", description: "Building violations, unsafe structures" },
  { value: "other", label: "Other", icon: "📋", description: "Any other civic issue" },
]

export function ReportForm() {
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    photos: [] as File[],
    category: "",
    title: "",
    description: "",
    location: "",
    coordinates: null as { lat: number; lng: number } | null,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    setFormData((prev) => ({
      ...prev,
      photos: [...prev.photos, ...files].slice(0, 3), // Max 3 photos
    }))
  }

  const removePhoto = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index),
    }))
  }

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData((prev) => ({
            ...prev,
            coordinates: {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            },
            location: `${position.coords.latitude.toFixed(6)}, ${position.coords.longitude.toFixed(6)}`,
          }))
        },
        (error) => {
          console.error("Error getting location:", error)
        },
      )
    }
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)

    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false)
      setIsSubmitted(true)
    }, 2000)
  }

  const canProceedToStep2 = formData.photos.length > 0
  const canProceedToStep3 = formData.category && formData.title.trim()
  const canSubmit = formData.description.trim() && formData.location.trim()

  if (isSubmitted) {
    return (
      <div className="max-w-md mx-auto text-center space-y-6">
        <div className="w-20 h-20 bg-secondary rounded-full flex items-center justify-center mx-auto">
          <CheckCircle className="w-10 h-10 text-secondary-foreground" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold text-foreground">Report Submitted!</h2>
          <p className="text-muted-foreground text-pretty">
            Your report has been successfully submitted to the relevant authorities. You'll receive updates on the
            progress.
          </p>
        </div>
        <div className="space-y-3">
          <Button onClick={() => (window.location.href = "/")} className="w-full">
            Back to Home
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setIsSubmitted(false)
              setStep(1)
              setFormData({
                photos: [],
                category: "",
                title: "",
                description: "",
                location: "",
                coordinates: null,
              })
            }}
            className="w-full"
          >
            Report Another Issue
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Progress Indicator */}
      <div className="flex items-center justify-between mb-8">
        {[1, 2, 3, 4].map((stepNumber) => (
          <div key={stepNumber} className="flex items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                stepNumber <= step ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              }`}
            >
              {stepNumber}
            </div>
            {stepNumber < 4 && <div className={`w-12 h-0.5 mx-2 ${stepNumber < step ? "bg-primary" : "bg-muted"}`} />}
          </div>
        ))}
      </div>

      {/* Step 1: Photo Upload */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="w-5 h-5" />
              Upload Photos/Videos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Take clear photos of the problem to help authorities understand the issue better.
            </p>

            {/* Photo Upload Area */}
            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
              <input
                type="file"
                accept="image/*,video/*"
                multiple
                onChange={handlePhotoUpload}
                className="hidden"
                id="photo-upload"
              />
              <label htmlFor="photo-upload" className="cursor-pointer">
                <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-sm font-medium">Click to upload photos/videos</p>
                <p className="text-xs text-muted-foreground mt-1">Maximum 3 files, up to 10MB each</p>
              </label>
            </div>

            {/* Uploaded Photos */}
            {formData.photos.length > 0 && (
              <div className="grid grid-cols-2 gap-4">
                {formData.photos.map((photo, index) => (
                  <div key={index} className="relative">
                    <img
                      src={URL.createObjectURL(photo) || "/placeholder.svg"}
                      alt={`Upload ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 w-6 h-6"
                      onClick={() => removePhoto(index)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <Button onClick={() => setStep(2)} className="w-full" disabled={!canProceedToStep2}>
              Next: Select Category
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Category Selection */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Select Problem Category</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {problemCategories.map((category) => (
                <div
                  key={category.value}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    formData.category === category.value
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                  onClick={() => setFormData((prev) => ({ ...prev, category: category.value }))}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{category.icon}</span>
                    <div>
                      <h3 className="font-medium">{category.label}</h3>
                      <p className="text-xs text-muted-foreground">{category.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Problem Title</Label>
              <Input
                id="title"
                placeholder="Brief title describing the problem"
                value={formData.title}
                onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
              />
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                Back
              </Button>
              <Button onClick={() => setStep(3)} className="flex-1" disabled={!canProceedToStep3}>
                Next: Add Details
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Description */}
      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>Describe the Problem</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="description">Detailed Description</Label>
              <Textarea
                id="description"
                placeholder="Provide more details about the problem, when you noticed it, how it affects the community..."
                rows={4}
                value={formData.description}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              />
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(2)} className="flex-1">
                Back
              </Button>
              <Button onClick={() => setStep(4)} className="flex-1" disabled={!formData.description.trim()}>
                Next: Location
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Location */}
      {step === 4 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Problem Location
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="location">Location Address</Label>
              <Input
                id="location"
                placeholder="Enter the exact location or address"
                value={formData.location}
                onChange={(e) => setFormData((prev) => ({ ...prev, location: e.target.value }))}
              />
            </div>

            <Button variant="outline" onClick={getCurrentLocation} className="w-full bg-transparent">
              <MapPin className="w-4 h-4 mr-2" />
              Use Current Location
            </Button>

            {formData.coordinates && (
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">
                  GPS Coordinates: {formData.coordinates.lat.toFixed(6)}, {formData.coordinates.lng.toFixed(6)}
                </p>
              </div>
            )}

            {/* Summary */}
            <div className="border-t pt-4">
              <h3 className="font-medium mb-3">Report Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{problemCategories.find((c) => c.value === formData.category)?.label}</Badge>
                </div>
                <p className="font-medium">{formData.title}</p>
                <p className="text-muted-foreground line-clamp-2">{formData.description}</p>
                <p className="text-muted-foreground">{formData.photos.length} photo(s) attached</p>
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(3)} className="flex-1">
                Back
              </Button>
              <Button onClick={handleSubmit} className="flex-1" disabled={!canSubmit || isSubmitting}>
                {isSubmitting ? "Submitting..." : "Submit Report"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
