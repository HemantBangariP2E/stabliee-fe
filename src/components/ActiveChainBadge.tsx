import { Badge } from "@/components/ui/badge";
import { useActiveChain } from "@/hooks/useActiveChain";

type Props = {
  className?: string;
};

/** Shows the currently active blockchain (selected on dashboard). */
export function ActiveChainBadge({ className }: Props) {
  const { activeChain } = useActiveChain();
  if (!activeChain) return null;

  return (
    <Badge variant="secondary" className={`rounded-full font-medium ${className ?? ""}`}>
      Active chain: {activeChain.blockchain} · {activeChain.network}
    </Badge>
  );
}
