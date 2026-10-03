import { LoaderCircle } from "lucide-react";

const Spinner = () => {
  return (
    <div role="status" className="flex items-center justify-center gap-2 px-5 py-12 text-sm text-muted-foreground">
      <LoaderCircle className="size-5 animate-spin text-primary" aria-hidden="true" />
      Ladataan työaikakirjauksia...
    </div>
  );
};
export default Spinner;
