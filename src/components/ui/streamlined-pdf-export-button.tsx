// This component is not currently used in the strategy-planner app
// Stubbed out to prevent build errors
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

interface StreamlinedPdfExportButtonProps {
  showLiveOnly?: boolean;
  variant?: "default" | "outline" | "ghost" | "secondary";
  size?: "sm" | "default" | "lg";
}

const StreamlinedPdfExportButton = ({
  showLiveOnly = false,
  variant = "outline",
  size = "sm"
}: StreamlinedPdfExportButtonProps) => {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div>
      <Button 
        variant={variant} 
        size={size}
        onClick={() => setModalOpen(true)}
        className="flex items-center gap-2"
        disabled
      >
        <Download className="h-4 w-4" />
        Export PDF (Streamlined) (Not Available)
      </Button>
    </div>
  );
};

export default StreamlinedPdfExportButton;