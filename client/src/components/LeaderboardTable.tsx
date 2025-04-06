import { LeaderboardEntry } from '@/types';

interface LeaderboardTableProps {
  entries: LeaderboardEntry[];
  loading?: boolean;
}

export default function LeaderboardTable({ entries, loading = false }: LeaderboardTableProps) {
  if (loading) {
    return (
      <div className="bg-white shadow rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Leaderboard</h3>
        </div>
        <div className="flex justify-center py-8">
          <svg className="animate-spin h-8 w-8 text-primary-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      </div>
    );
  }

  // If no entries, use demo data
  const demoEntries: LeaderboardEntry[] = [
    {
      id: '1',
      displayName: 'Sarah Johnson',
      photoURL: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
      isCurrentUser: false,
      streak: 21,
      todayCount: 24,
      totalApplications: 432
    },
    {
      id: '2',
      displayName: 'You',
      photoURL: '',
      isCurrentUser: true,
      streak: 17,
      todayCount: 15,
      totalApplications: 342
    },
    {
      id: '3',
      displayName: 'Michael Chen',
      photoURL: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
      isCurrentUser: false,
      streak: 12,
      todayCount: 18,
      totalApplications: 298
    },
    {
      id: '4',
      displayName: 'Jessica Wilson',
      photoURL: 'https://images.unsplash.com/photo-1550525811-e5869dd03032?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
      isCurrentUser: false,
      streak: 8,
      todayCount: 12,
      totalApplications: 217
    },
    {
      id: '5',
      displayName: 'David Thompson',
      photoURL: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
      isCurrentUser: false,
      streak: 4,
      todayCount: 8,
      totalApplications: 165
    }
  ];

  const displayEntries = entries.length > 0 ? entries : demoEntries;

  return (
    <div className="bg-white shadow rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">Leaderboard</h3>
        <div className="flex items-center">
          <button className="text-sm text-primary-500 hover:text-primary-600">
            View All
          </button>
        </div>
      </div>
      <div className="overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Rank
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Streak
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Today
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {displayEntries.map((entry, index) => (
              <tr key={entry.id} className={entry.isCurrentUser ? 'bg-gray-50' : ''}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
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
                      <div className="text-sm font-medium text-gray-900">
                        {entry.isCurrentUser ? 'You' : entry.displayName}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                    {entry.streak} 🔥
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {entry.todayCount}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {entry.totalApplications}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
