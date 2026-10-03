import * as React from 'react';
import * as Primitive from '@radix-ui/react-alert-dialog';
import { cn } from '../../lib/utils';

const AlertDialog = Primitive.Root;
const AlertDialogTrigger = Primitive.Trigger;
const AlertDialogAction = Primitive.Action;
const AlertDialogCancel = Primitive.Cancel;

const AlertDialogContent = React.forwardRef(({ className, children, ...props }, ref) => (
  <Primitive.Portal>
    <Primitive.Overlay className="fixed inset-0 z-50 bg-foreground/35" />
    <Primitive.Content
      ref={ref}
      className={cn('fixed left-1/2 top-1/2 z-50 w-[calc(100vw-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl border bg-card p-6 text-card-foreground shadow-xl outline-none', className)}
      {...props}
    >
      {children}
    </Primitive.Content>
  </Primitive.Portal>
));
AlertDialogContent.displayName = 'AlertDialogContent';

const AlertDialogHeader = ({ className, ...props }) => <div className={cn('space-y-2 text-left', className)} {...props} />;
const AlertDialogFooter = ({ className, ...props }) => <div className={cn('mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end', className)} {...props} />;
const AlertDialogTitle = React.forwardRef(({ className, ...props }, ref) => <Primitive.Title ref={ref} className={cn('font-display text-xl font-semibold tracking-tight', className)} {...props} />);
const AlertDialogDescription = React.forwardRef(({ className, ...props }, ref) => <Primitive.Description ref={ref} className={cn('text-sm leading-6 text-muted-foreground', className)} {...props} />);
AlertDialogTitle.displayName = 'AlertDialogTitle';
AlertDialogDescription.displayName = 'AlertDialogDescription';

export { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogFooter, AlertDialogTitle, AlertDialogDescription, AlertDialogAction, AlertDialogCancel };
