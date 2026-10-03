import * as React from 'react';
import * as RadioGroupPrimitive from '@radix-ui/react-radio-group';
import { Circle } from 'lucide-react';
import { cn } from '../../lib/utils';

const RadioGroup = React.forwardRef(({ className, ...props }, ref) => <RadioGroupPrimitive.Root ref={ref} data-slot="radio-group" className={cn('grid gap-3', className)} {...props} />);
RadioGroup.displayName = 'RadioGroup';

const RadioGroupItem = React.forwardRef(({ className, ...props }, ref) => (
  <RadioGroupPrimitive.Item ref={ref} data-slot="radio-group-item" className={cn('size-4 shrink-0 rounded-full border border-input bg-background shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/30 data-[state=checked]:border-primary disabled:cursor-not-allowed disabled:opacity-50', className)} {...props}>
    <RadioGroupPrimitive.Indicator data-slot="radio-group-indicator" className="flex items-center justify-center"><Circle className="size-2 fill-primary text-primary" /></RadioGroupPrimitive.Indicator>
  </RadioGroupPrimitive.Item>
));
RadioGroupItem.displayName = 'RadioGroupItem';

export { RadioGroup, RadioGroupItem };
