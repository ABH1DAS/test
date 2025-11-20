import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export function ReportButton() {
  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Link href="/report">
        <Button size="lg" className="rounded-full w-14 h-14 shadow-lg hover:shadow-xl transition-shadow">
          <Plus className="w-6 h-6" />
          <span className="sr-only">Report Problem</span>
        </Button>
      </Link>
    </div>
  )
}
