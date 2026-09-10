import * as React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";
import { cn } from "@/lib/utils";

const Slider = React.forwardRef<
  React.ComponentRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>
>(({ className, ...props }, ref) => (
  <SliderPrimitive.Root
    ref={ref}
    className={cn(
      "relative flex h-11 w-full touch-none select-none items-center",
      className,
    )}
    {...props}
  >
    <SliderPrimitive.Track className="relative h-1 w-full grow overflow-hidden rounded-full bg-surface-2 shadow-[0_0_0_1px_rgba(243,242,238,0.08)]">
      <SliderPrimitive.Range className="absolute h-full bg-fg" />
    </SliderPrimitive.Track>
    <SliderPrimitive.Thumb className="block size-4 rounded-full bg-fg shadow-[0_0_0_1px_rgba(243,242,238,0.18),0_1px_2px_rgba(0,0,0,0.4)] outline-none transition-[box-shadow,transform] duration-150 ease-out hover:scale-105 focus-visible:ring-2 focus-visible:ring-ring/70" />
  </SliderPrimitive.Root>
));
Slider.displayName = SliderPrimitive.Root.displayName;

export { Slider };
