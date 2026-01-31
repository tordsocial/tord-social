import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full bg-background text-foreground">
      <div className="mx-auto flex min-h-screen w-full max-w-3xl items-center justify-center px-4">
        <Card className="w-full overflow-hidden border-white/10 bg-card/60 backdrop-blur">
          <CardContent className="p-7">
            <div className="flex items-start gap-4">
              <div className="mt-1 flex h-12 w-12 items-center justify-center rounded-2xl bg-[hsl(var(--primary)/0.14)] ring-1 ring-[hsl(var(--primary)/0.25)]">
                <AlertCircle className="h-6 w-6 text-foreground" />
              </div>
              <div className="min-w-0">
                <h1 className="text-2xl font-semibold tracking-tight" style={{ fontFamily: "var(--font-display)" }} data-testid="text-404-title">
                  Page not found
                </h1>
                <p className="mt-2 text-sm text-muted-foreground" data-testid="text-404-subtitle">
                  That route doesn’t exist in this prototype yet.
                </p>

                <div className="mt-5 flex flex-wrap items-center gap-3">
                  <a
                    href="/"
                    className="inline-flex h-10 items-center justify-center rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                    data-testid="link-404-home"
                  >
                    Go back to feed
                  </a>
                  <span className="text-xs text-muted-foreground" data-testid="text-404-hint">
                    Tip: use the top nav to explore.
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
