import { AuthForm } from "@/components/auth-form"

export default function AuthPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary rounded-xl flex items-center justify-center mx-auto mb-4">
            <span className="text-primary-foreground font-bold text-2xl">CR</span>
          </div>
          <h1 className="text-2xl font-semibold text-foreground mb-2">Welcome to Civic Reporter</h1>
          <p className="text-muted-foreground text-pretty">
            Join thousands of citizens making their communities better
          </p>
        </div>
        <AuthForm />
      </div>
    </div>
  )
}
