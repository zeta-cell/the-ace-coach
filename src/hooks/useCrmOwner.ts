import { useAuth } from "@/contexts/AuthContext";
import { useClub } from "./useClub";

export type CrmOwnerType = "coach" | "club";

export const useCrmOwner = () => {
  const { user, role } = useAuth();
  const { activeClubId } = useClub();

  if (role === "club_manager" && activeClubId) {
    return { ownerId: activeClubId, ownerType: "club" as const, userId: user?.id };
  }
  return { ownerId: user?.id || null, ownerType: "coach" as const, userId: user?.id };
};
