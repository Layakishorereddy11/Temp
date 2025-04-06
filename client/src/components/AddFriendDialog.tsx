import { useState } from 'react';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { addFriend } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import useWebSocket from '@/hooks/useWebSocket';

interface AddFriendDialogProps {
  userId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onFriendAdded: () => void;
}

export default function AddFriendDialog({ 
  userId, 
  open, 
  onOpenChange,
  onFriendAdded
}: AddFriendDialogProps) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { socket, connected } = useWebSocket();

  const handleAddFriend = async () => {
    if (!userId || !email) return;

    setLoading(true);
    try {
      const newFriend = await addFriend(userId, email);
      
      // Send WebSocket notification about the new friend
      if (connected && socket) {
        socket.send(JSON.stringify({
          type: 'friend_added',
          data: {
            userId,
            friendId: newFriend.id,
            friendName: newFriend.displayName
          }
        }));
      }
      
      toast({
        title: "Friend request sent",
        description: "They'll be added to your friends list once they accept.",
      });
      setEmail('');
      onFriendAdded();
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Error adding friend",
        description: (error as Error).message || "Failed to add friend",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Friend</DialogTitle>
          <DialogDescription>
            Enter your friend's email address to add them to your network.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="email" className="text-right">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="friend@example.com"
              className="col-span-3"
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button 
            type="submit" 
            onClick={handleAddFriend}
            disabled={loading || !email}
          >
            {loading ? "Adding..." : "Add Friend"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}