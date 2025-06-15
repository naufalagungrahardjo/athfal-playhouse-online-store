
import { useWebsiteCopy } from "@/hooks/useWebsiteCopy";

export function useNavigationCopy() {
  const { copy } = useWebsiteCopy();
  return copy.navigation;
}
