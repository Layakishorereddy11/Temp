import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { demoDataService } from "@/lib/demoDataService";
import { Loader2 } from "lucide-react";
import { auth } from "@/lib/firebase";

interface DemoDataButtonProps {
  onSuccess?: () => void;
  className?: string;
}

export default function DemoDataButton({ onSuccess, className = '' }: DemoDataButtonProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const populateAllDemoData = async () => {
    if (!auth.currentUser) {
      toast({
        title: "Not logged in",
        description: "You must be logged in to populate demo data",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // First generate applications data
      const userId = auth.currentUser.uid;
      await demoDataService.generateDemoData(userId);
      
      // Then generate friends with their own data
      await demoDataService.generateDemoFriends(userId);
      
      toast({
        title: "Success",
        description: "Demo data populated successfully",
        variant: "default"
      });
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("Error populating demo data:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to populate demo data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button 
      variant="outline" 
      size="sm" 
      onClick={populateAllDemoData} 
      disabled={loading}
      className={className}
    >
      {loading ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          Generating...
        </>
      ) : (
        "Generate Demo Data"
      )}
    </Button>
  );
}