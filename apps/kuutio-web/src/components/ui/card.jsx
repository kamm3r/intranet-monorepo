import * as React from "react";
import { cn } from "../../lib/utils";

const Card = React.forwardRef(({ className, ...props }, ref) => <div data-slot="card" ref={ref} className={cn("flex flex-col gap-5 rounded-xl border bg-card py-5 text-card-foreground shadow-sm", className)} {...props} />);
Card.displayName = "Card";
const CardHeader = React.forwardRef(({ className, ...props }, ref) => <div data-slot="card-header" ref={ref} className={cn("flex flex-col gap-1.5 px-5", className)} {...props} />);
CardHeader.displayName = "CardHeader";
const CardTitle = React.forwardRef(({ className, ...props }, ref) => <div data-slot="card-title" ref={ref} className={cn("font-semibold leading-none", className)} {...props} />);
CardTitle.displayName = "CardTitle";
const CardDescription = React.forwardRef(({ className, ...props }, ref) => <div data-slot="card-description" ref={ref} className={cn("text-sm text-muted-foreground", className)} {...props} />);
CardDescription.displayName = "CardDescription";
const CardContent = React.forwardRef(({ className, ...props }, ref) => <div data-slot="card-content" ref={ref} className={cn("px-5", className)} {...props} />);
CardContent.displayName = "CardContent";
const CardFooter = React.forwardRef(({ className, ...props }, ref) => <div data-slot="card-footer" ref={ref} className={cn("flex items-center px-5", className)} {...props} />);
CardFooter.displayName = "CardFooter";
export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter };
