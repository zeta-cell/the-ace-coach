import PortalLayout from "@/components/portal/PortalLayout";
import MyCoachCard from "@/components/portal/MyCoachCard";
import UpcomingBookings from "@/components/portal/UpcomingBookings";

const MyCoach = () => (
  <PortalLayout>
    <div className="p-4 md:p-6 max-w-3xl mx-auto">
      <h1 className="font-display text-2xl tracking-wider text-foreground mb-1">BOOK A SESSION</h1>
      <p className="font-body text-xs text-muted-foreground uppercase tracking-wider mb-6">
        Your coaches and upcoming sessions
      </p>
      <MyCoachCard />
      <UpcomingBookings />
    </div>
  </PortalLayout>
);

export default MyCoach;
