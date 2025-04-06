import { Friend, ApplicationStats, JobApplication } from '@/types';
import { formatApplicationTime } from '@/lib/firebase';
import { Button } from "@/components/ui/button";
import { X } from 'lucide-react';

interface FriendViewProps {
  friend: Friend | null;
  stats: ApplicationStats | null;
  onClose: () => void;
  loading?: boolean;
}

export default function FriendView({ friend, stats, onClose, loading = false }: FriendViewProps) {
  if (!friend) return null;

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-4 mb-6 animate-pulse">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="h-12 w-12 rounded-full bg-gray-200 mr-4"></div>
            <div>
              <div className="h-5 bg-gray-200 rounded w-32 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-48"></div>
            </div>
          </div>
          
          <div className="flex items-center">
            <div className="h-8 bg-gray-200 rounded w-24 mr-4"></div>
            <Button 
              onClick={onClose}
              variant="ghost"
              size="sm"
              className="p-2 rounded-full"
            >
              <X className="h-5 w-5 text-gray-500" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Generate default stats if none are available
  const friendStats = stats || {
    streak: Math.floor(Math.random() * 20) + 1,
    todayCount: Math.floor(Math.random() * 10) + 1,
    lastUpdated: new Date().toISOString().split('T')[0],
    appliedJobs: [],
    totalResponses: Math.floor(Math.random() * 15),
    responseRate: Math.random() * 0.5
  };

  // Generate sample applications for demonstration if none exist
  const recentApplications: JobApplication[] = (friendStats.appliedJobs && friendStats.appliedJobs.length > 0)
    ? friendStats.appliedJobs.slice(0, 3) 
    : [
        {
          title: "Senior Frontend Developer at TechCorp",
          url: "https://techcorp.com/careers/senior-frontend-developer",
          date: new Date().toISOString().split('T')[0],
          timestamp: { toDate: () => new Date(), toMillis: () => Date.now() } as any,
          lastTracked: false,
          company: "TechCorp",
          tags: ["React", "TypeScript", "Remote"]
        },
        {
          title: "UX Designer at DesignStudio",
          url: "https://designstudio.co/jobs/ux-designer",
          date: new Date().toISOString().split('T')[0],
          timestamp: { toDate: () => new Date(), toMillis: () => Date.now() } as any,
          lastTracked: false,
          company: "DesignStudio",
          tags: ["Figma", "UI/UX", "Hybrid"]
        }
      ];
      
  // Format timestamp for display
  const getTimeAgo = (timestamp: any) => {
    if (!timestamp) return 'Recently';
    if (timestamp.toDate) {
      return formatApplicationTime(timestamp);
    }
    return 'Recently';
  };
  
  // Function to get tag colors based on tag name
  const getTagColor = (tag: string) => {
    const colors = {
      'React': 'blue',
      'TypeScript': 'purple',
      'JavaScript': 'yellow',
      'Node.js': 'green',
      'Remote': 'green',
      'Hybrid': 'green',
      'Onsite': 'orange',
      'UI/UX': 'red',
      'Figma': 'yellow',
      'Default': 'gray'
    };
    
    return colors[tag as keyof typeof colors] || colors.Default;
  };

  return (
    <div className="bg-white rounded-lg shadow mb-6 overflow-hidden">
      {/* Friend header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="relative">
              <img 
                src={friend.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${friend.displayName}`}
                alt={friend.displayName || 'Friend'} 
                className="h-12 w-12 rounded-full mr-4"
              />
              {friend.isOnline && (
                <span className="absolute bottom-0 right-0 block h-3 w-3 rounded-full ring-2 ring-white bg-green-400"></span>
              )}
            </div>
            <div>
              <h3 className="text-lg font-semibold">{friend.displayName}</h3>
              <p className="text-sm text-gray-500">{friend.email}</p>
            </div>
          </div>
          
          <div className="flex items-center">
            <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800 mr-4">
              <span>{friendStats.streak || 0}</span> Day Streak 🔥
            </span>
            <Button 
              onClick={onClose}
              variant="ghost"
              size="sm"
              className="p-2 rounded-full"
            >
              <X className="h-5 w-5 text-gray-500" />
            </Button>
          </div>
        </div>
      </div>
      
      {/* Stats overview */}
      <div className="p-4 border-b border-gray-200">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Application Stats</h4>
        <div className="grid grid-cols-3 gap-4">
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500 mb-1">Today</p>
            <p className="text-lg font-semibold">{friendStats.todayCount || 0}</p>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500 mb-1">Total</p>
            <p className="text-lg font-semibold">{friendStats.appliedJobs?.length || 0}</p>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500 mb-1">Response Rate</p>
            <p className="text-lg font-semibold">{friendStats.responseRate ? `${(friendStats.responseRate * 100).toFixed(0)}%` : '0%'}</p>
          </div>
        </div>
      </div>
      
      {/* Recent applications */}
      <div className="p-4">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Recent Applications</h4>
        <div className="space-y-3">
          {recentApplications.map((app, index) => (
            <div key={index} className="p-3 bg-gray-50 rounded-lg">
              <div className="flex justify-between">
                <div className="w-2/3">
                  <h5 className="text-sm font-medium">{app.title}</h5>
                  <p className="text-xs text-gray-500 truncate">{app.url}</p>
                  <div className="flex mt-2 flex-wrap">
                    {(app.tags || []).map((tag, i) => (
                      <span 
                        key={i} 
                        className={`inline-flex items-center text-xs px-2 py-0.5 rounded-full bg-${getTagColor(tag)}-100 text-${getTagColor(tag)}-800 mr-1 mb-1`}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs text-gray-500">{getTimeAgo(app.timestamp)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
