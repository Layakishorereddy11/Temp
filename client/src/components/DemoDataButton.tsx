import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { demoDataService } from '@/lib/demoDataService';
import { auth } from '@/lib/firebase';

interface DemoDataButtonProps {
  onSuccess?: () => void;
  className?: string;
}

export default function DemoDataButton({ onSuccess, className = '' }: DemoDataButtonProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const populateDemoData = async () => {
    const userId = auth.currentUser?.uid;
    if (!userId) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to populate demo data",
        variant: "destructive",
      });
      return;
    }
    
    setLoading(true);
    
    try {
      const success = await demoDataService.populateAllDemoData(userId);
      
      if (success) {
        toast({
          title: "Demo Data Generated",
          description: "Your account has been populated with sample data for demonstration",
        });
        
        if (onSuccess) {
          onSuccess();
        }
      } else {
        toast({
          title: "Error",
          description: "Failed to generate demo data",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error populating demo data:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      className={`${className}`}
      onClick={populateDemoData}
      disabled={loading}
    >
      {loading ? (
        <>
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Generating...
        </>
      ) : (
        <>
          <Download className="h-4 w-4 mr-2" />
          Generate Demo Data
        </>
      )}
    </Button>
  );
}