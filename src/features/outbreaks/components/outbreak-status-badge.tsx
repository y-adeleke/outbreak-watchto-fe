import { Badge } from "@/components/ui/badge";

interface Props {
  isActive: boolean;
}

export function OutbreakStatusBadge({ isActive }: Props) {
  return (
    <Badge variant={isActive ? "default" : "secondary"} className="w-fit rounded-full px-3">
      {isActive ? "Active" : "Resolved"}
    </Badge>
  );
}
