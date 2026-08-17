import { Button } from "@/components/ui/button";
import { Star, Loader2 } from "lucide-react";
import { useSetStationAsDefault } from "../hooks/useStationAsDefault";

interface SetDefaultStationButtonProps {
  stationId: string;
  isDefault: boolean;
}
export const SetDefaultStationButton = ({
  stationId,
  isDefault,
}: SetDefaultStationButtonProps) => {
  const { mutate: setDefault, isPending } = useSetStationAsDefault();

  if (isDefault) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-500 px-3 py-1 text-xs font-semibold text-white shadow-sm">
        <Star className="h-3.5 w-3.5 fill-white text-white" />
        Default
      </span>
    );
  }
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => setDefault(stationId)}
      disabled={isPending}
      className="h-8 rounded-full border-orange-300 bg-white px-3 text-xs font-semibold text-orange-600 transition-colors hover:bg-orange-500 hover:text-white hover:border-orange-500 disabled:opacity-50"
    >
      {isPending ? (
        <>
          <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
          Setting...
        </>
      ) : (
        "Set as default"
      )}
    </Button>
  );
};