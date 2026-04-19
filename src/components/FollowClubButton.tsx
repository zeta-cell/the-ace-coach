import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Heart, HeartOff } from "lucide-react";
import { toast } from "sonner";

interface FollowClubButtonProps {
  clubId: string;
  className?: string;
}

const FollowClubButton = ({ clubId, className = "" }: FollowClubButtonProps) => {
  const { user } = useAuth();
  const [following, setFollowing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    check();
  }, [user, clubId]);

  const check = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("club_followers")
      .select("id")
      .eq("user_id", user.id)
      .eq("club_id", clubId)
      .maybeSingle();
    setFollowing(!!data);
    setLoading(false);
  };

  const toggle = async () => {
    if (!user) {
      toast.error("Sign in to follow clubs");
      return;
    }
    if (following) {
      await supabase.from("club_followers").delete().eq("user_id", user.id).eq("club_id", clubId);
      setFollowing(false);
      toast.success("Unfollowed club");
    } else {
      const { error } = await supabase.from("club_followers").insert({ user_id: user.id, club_id: clubId });
      if (error) {
        toast.error("Could not follow club");
        return;
      }
      setFollowing(true);
      toast.success("Following club — you'll get event updates");
    }
  };

  if (loading) return null;

  return (
    <button
      onClick={toggle}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-display tracking-wider transition-colors ${
        following
          ? "bg-primary/15 text-primary hover:bg-primary/25"
          : "bg-secondary text-muted-foreground hover:bg-secondary/80 hover:text-foreground"
      } ${className}`}
    >
      {following ? <Heart size={12} fill="currentColor" /> : <Heart size={12} />}
      {following ? "FOLLOWING" : "FOLLOW CLUB"}
    </button>
  );
};

export default FollowClubButton;
