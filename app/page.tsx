import { Header } from "@/components/header"
import { ProblemFeed } from "@/components/problem-feed"
import { ReportButton } from "@/components/report-button"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-6 pb-24">
        <ProblemFeed />
      </main>
      <ReportButton />
    </div>
  )
}
