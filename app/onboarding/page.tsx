"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ChevronRight, Users, Camera, Bell } from "lucide-react"

const onboardingSteps = [
  {
    icon: Users,
    title: "Welcome to Civic Reporter",
    description: "Join thousands of citizens working together to improve their communities by reporting local issues.",
    image: "/community-illustration.jpg",
  },
  {
    icon: Camera,
    title: "Report Problems Easily",
    description: "Simply take a photo of any civic issue in your area and report it with just a few taps.",
    image: "/report-illustration.jpg",
  },
  {
    icon: Bell,
    title: "Track Progress",
    description: "Get real-time updates when government authorities acknowledge and resolve your reported issues.",
    image: "/tracking-illustration.jpg",
  },
]

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(0)

  const handleNext = () => {
    if (currentStep < onboardingSteps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      // Navigate to auth page
      window.location.href = "/auth"
    }
  }

  const handleSkip = () => {
    window.location.href = "/auth"
  }

  const step = onboardingSteps[currentStep]
  const Icon = step.icon

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Skip Button */}
      <div className="flex justify-end p-4">
        <Button variant="ghost" onClick={handleSkip}>
          Skip
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center space-y-8">
          {/* Illustration */}
          <div className="w-64 h-64 mx-auto bg-muted rounded-2xl flex items-center justify-center">
            <Icon className="w-24 h-24 text-primary" />
          </div>

          {/* Text Content */}
          <div className="space-y-4">
            <h1 className="text-2xl font-semibold text-foreground text-balance">{step.title}</h1>
            <p className="text-muted-foreground text-pretty leading-relaxed">{step.description}</p>
          </div>

          {/* Progress Indicators */}
          <div className="flex justify-center gap-2">
            {onboardingSteps.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentStep ? "bg-primary" : "bg-muted"
                }`}
              />
            ))}
          </div>

          {/* Action Button */}
          <Button onClick={handleNext} className="w-full" size="lg">
            {currentStep === onboardingSteps.length - 1 ? "Get Started" : "Next"}
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  )
}
