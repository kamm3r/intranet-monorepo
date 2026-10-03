import * as React from "react";
import { ChevronDownIcon } from "lucide-react";
import { cn } from "../../lib/utils";
const NativeSelect = React.forwardRef(({ className, children, ...props }, ref) => <div data-slot="native-select-wrapper" className="relative w-full"><select ref={ref} data-slot="native-select" className={cn("h-10 w-full appearance-none rounded-md border border-input bg-background px-3 pr-9 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/20 disabled:cursor-not-allowed disabled:opacity-50", className)} {...props}>{children}</select><ChevronDownIcon aria-hidden="true" className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /></div>);
NativeSelect.displayName = "NativeSelect";
export { NativeSelect };
