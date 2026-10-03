import * as React from "react";
import { cn } from "../../lib/utils";
function Alert({ className, variant = "default", ...props }) { return <div data-slot="alert" role="alert" className={cn("rounded-lg border px-4 py-3 text-sm",variant === "destructive" ? "border-destructive/35 bg-destructive/5 text-destructive" : "border-border bg-card text-foreground",className)} {...props} />; }
function AlertTitle({ className, ...props }) { return <div data-slot="alert-title" className={cn("font-semibold",className)} {...props} />; }
function AlertDescription({ className, ...props }) { return <div data-slot="alert-description" className={cn("text-sm",className)} {...props} />; }
export { Alert, AlertTitle, AlertDescription };
