import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Rocket } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface PublishButtonProps {
  projectId: string | null;
  onSave: () => Promise<void>;
}

const PublishButton = ({ projectId, onSave }: PublishButtonProps) => {
  const navigate = useNavigate();
  const [showDialog, setShowDialog] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  const handlePublish = async () => {
    setIsPublishing(true);
    try {
      // Save first
      await onSave();
      
      // Navigate to domains page
      if (projectId) {
        navigate(`/project/${projectId}/domains`);
      }
    } catch (error) {
      console.error('Error publishing:', error);
    } finally {
      setIsPublishing(false);
      setShowDialog(false);
    }
  };

  return (
    <>
      <Button 
        variant="default" 
        className="gap-2"
        onClick={() => setShowDialog(true)}
      >
        <Rocket className="w-4 h-4" />
        Publish
      </Button>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Publish Your Website</DialogTitle>
            <DialogDescription>
              Your website will be saved and you'll be able to configure a free subdomain 
              or connect a custom domain.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handlePublish} disabled={isPublishing}>
              {isPublishing ? "Publishing..." : "Continue"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PublishButton;
