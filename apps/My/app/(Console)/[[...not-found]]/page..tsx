import Link from "next/link"
import { Button } from "@befroosh/ui"
import { Question } from "@phosphor-icons/react/dist/ssr";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[100dvh] px-4 text-center">
      <div className="space-y-6 max-w-md mx-auto">
        <div className="flex justify-center">
          <div className="rounded-full bg-muted p-6">
            <Question className="h-12 w-12 text-muted-foreground" />
          </div>
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">404 - Page Not Found</h1>
        <p className="text-muted-foreground text-lg">
          Sorry, we couldn't find the page you're looking for. The page might have been moved, deleted, or never
          existed.
        </p>
        <div className="flex justify-center">
          <Button asChild size="lg">
            <Link href="/">Return Home</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}



const notfound = {
  en: {
    title: "Page Not Found",
    description: "The page you are looking for does not exist.",
    redirect: "Redirect to main page",
  },
  fa: {
    title: "",
    description: "",
    redirect: " ",
  },
};
