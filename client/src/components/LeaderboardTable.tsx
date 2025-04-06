import { useState } from 'react';
import { LeaderboardEntry } from '@/types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowDown01, Flame } from 'lucide-react';

interface LeaderboardTableProps {
  entries: LeaderboardEntry[];
  loading?: boolean;
}

type SortMode = 'streak' | 'total';

export default function LeaderboardTable({ entries, loading = false }: LeaderboardTableProps) {
  const [sortMode, setSortMode] = useState<SortMode>('streak');
  
  if (loading) {
    return (
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium">Leaderboard</h3>
        </div>
        <div className="flex justify-center py-8">
          <svg className="animate-spin h-8 w-8 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      </div>
    );
  }

  const displayEntries = [...entries]
    // Sort based on the current sort mode
    .sort((a, b) => {
      if (sortMode === 'streak') {
        return b.streak - a.streak;
      } else {
        return b.totalApplications - a.totalApplications;
      }
    });

  const handleSortChange = (value: string) => {
    setSortMode(value as SortMode);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-2 items-center">
          <p className="text-sm text-muted-foreground">Sort by:</p>
          <Select value={sortMode} onValueChange={handleSortChange}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="streak">
                <div className="flex items-center">
                  <Flame className="mr-2 h-4 w-4 text-orange-500" />
                  Streak
                </div>
              </SelectItem>
              <SelectItem value="total">
                <div className="flex items-center">
                  <ArrowDown01 className="mr-2 h-4 w-4 text-blue-500" />
                  Total Applications
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="overflow-hidden rounded-md border">
        <table className="min-w-full divide-y">
          <thead className="bg-muted/50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Rank
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Name
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Streak
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Today
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Total
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {displayEntries.map((entry, index) => (
              <tr key={entry.id} className={entry.isCurrentUser ? 'bg-muted/20' : ''}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  {index + 1}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-8 w-8">
                      <img 
                        className="h-8 w-8 rounded-full" 
                        src={entry.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${entry.displayName}`} 
                        alt={entry.displayName || ''} 
                      />
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium">
                        {entry.isCurrentUser ? 'You' : entry.displayName}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${sortMode === 'streak' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400' : 'bg-muted text-muted-foreground'}`}>
                    {entry.streak} 🔥
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {entry.todayCount > 0 ? (
                    <span className="font-medium text-green-600 dark:text-green-400">{entry.todayCount}</span>
                  ) : (
                    <span className="text-muted-foreground">{entry.todayCount}</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <span className={sortMode === 'total' ? 'font-medium text-blue-600 dark:text-blue-400' : ''}>
                    {entry.totalApplications}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
