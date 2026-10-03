import React, { useState, useEffect } from 'react';
import * as Toast from '@radix-ui/react-toast';
import { TriangleAlert } from 'lucide-react';

const ToastAlert = () => {
  const [open, setOpen] = useState(false);
  const timerRef = React.useRef(0);

  useEffect(() => {
    setOpen(true);
    timerRef.current = setTimeout(() => {
      setOpen(false);
    }, 5000);

    return () => clearTimeout(timerRef.current);
  }, []);

  // const handleUndo = () => {
  //   setOpen(false);
  // };

  return (
    <Toast.Provider>
      <Toast.Root
        className="pointer-events-auto flex w-full items-center gap-[15px] rounded-md bg-white p-[15px] shadow-[rgba(0,0,0,0.35)_0px_10px_38px_-10px,rgba(0,0,0,0.2)_0px_10px_20px_-15px] data-[state=closed]:animate-[hide_100ms_ease-in] data-[state=open]:animate-[slideIn_150ms_cubic-bezier(0.16,1,0.3,1)] data-[swipe=cancel]:translate-x-0 data-[swipe=cancel]:transition-transform data-[swipe=cancel]:duration-200 data-[swipe=end]:animate-[swipeOut_100ms_ease-out] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)]"
        open={open}
        onOpenChange={setOpen}
      >
        <TriangleAlert className="h-8 w-8 shrink-0 text-[#ffc400]" />
        <div>
          <Toast.Title className="mb-[5px] text-[15px] font-medium text-[#333]">Virhe!</Toast.Title>
          <Toast.Description className="m-0 text-[13px] leading-[1.3] text-[#666]">
            Valitse nykyinen tai tuleva varauksen päivämäärä.
          </Toast.Description>
        </div>
      </Toast.Root>
      <Toast.Viewport className="fixed left-1/2 top-0 z-[2147483647] m-0 flex w-[390px] max-w-[100vw] -translate-x-1/2 list-none flex-col gap-2.5 p-[25px] outline-none" />
    </Toast.Provider>
  );
};
export default ToastAlert;
