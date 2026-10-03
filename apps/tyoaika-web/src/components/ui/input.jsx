import * as React from "react";
import { cn } from "../../lib/utils";
const Input = React.forwardRef(({ className, type = "text", ...props }, ref) => <input ref={ref} type={type} data-slot="input" className={cn("h-10 w-full min-w-0 rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none transition-[border-color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/20 disabled:cursor-not-allowed disabled:opacity-50", className)} {...props} />);
Input.displayName = "Input";
export { Input };
