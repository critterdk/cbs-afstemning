import NominationsSection from "@/components/NominationsSection";
import WidgetAutoHeight from "@/components/WidgetAutoHeight";

// Embeddable widget — stripped-down layout for iframe embedding in WordPress (Best One).
export default function VotingWidgetPage() {
  return (
    <div className="p-4 text-sm">
      <WidgetAutoHeight />
      <NominationsSection showTitle={false} />
    </div>
  );
}
