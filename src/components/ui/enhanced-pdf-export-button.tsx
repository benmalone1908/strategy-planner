// This component is not currently used in the strategy-planner app
// Stubbed out to prevent build errors
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

interface EnhancedPdfExportButtonProps {
  variant?: "default" | "outline" | "ghost" | "secondary";
  size?: "sm" | "default" | "lg";
}

const EnhancedPdfExportButton = ({
  variant = "outline",
  size = "sm"
}: EnhancedPdfExportButtonProps) => {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <Button 
      variant={variant} 
      size={size}
      onClick={() => setModalOpen(true)}
      className="flex items-center gap-2"
      disabled
    >
      <Download className="h-4 w-4" />
      Export PDF (Not Available)
    </Button>
  );
};

export default EnhancedPdfExportButton;