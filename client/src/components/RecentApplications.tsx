import { JobApplication } from '@/types';
import { formatApplicationTime } from '@/lib/firebase';

interface RecentApplicationsProps {
  applications: JobApplication[];
  loading?: boolean;
}

export default function RecentApplications({ applications, loading = false }: RecentApplicationsProps) {
  if (loading) {
    return (
      <div className="mt-6">
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Recent Applications
            </h3>
          </div>
          <div className="border-t border-gray-200 divide-y divide-gray-200 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="px-4 py-5 sm:p-6">
                <div className="flex justify-between items-start">
                  <div className="w-2/3">
                    <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2 mb-3"></div>
                    <div className="flex mt-2 space-x-2">
                      <div className="h-6 bg-gray-200 rounded w-16"></div>
                      <div className="h-6 bg-gray-200 rounded w-16"></div>
                    </div>
                  </div>
                  <div className="text-right w-1/4">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2 ml-auto"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // If no applications, use demo data
  const demoApplications: Partial<JobApplication>[] = [
    {
      title: "Frontend Developer at Acme Inc.",
      url: "https://acme.com/careers/frontend-developer",
      date: new Date().toISOString().split('T')[0],
      tags: ["React", "TypeScript", "Remote"]
    },
    {
      title: "Product Designer at Tech Solutions",
      url: "https://techsolutions.com/jobs/product-designer",
      date: new Date().toISOString().split('T')[0],
      tags: ["Figma", "UI/UX", "Hybrid"]
    },
    {
      title: "Full Stack Developer at InnovateTech",
      url: "https://innovatetech.io/careers/full-stack-developer",
      date: new Date().toISOString().split('T')[0],
      tags: ["Node.js", "React", "Remote"]
    }
  ];

  const displayApplications = applications.length > 0 ? applications : demoApplications as JobApplication[];

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
    <div className="mt-6">
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Recent Applications
          </h3>
          <div>
            <button className="px-3 py-1 bg-primary-100 text-primary-700 text-sm font-medium rounded-md">
              All
            </button>
            <button className="px-3 py-1 text-gray-600 text-sm font-medium rounded-md ml-2">
              Today
            </button>
          </div>
        </div>
        <div className="border-t border-gray-200 divide-y divide-gray-200 max-h-96 overflow-y-auto">
          {displayApplications.map((app, index) => (
            <div key={index} className="px-4 py-5 sm:p-6">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="text-base font-medium text-gray-900">{app.title}</h4>
                  <p className="text-sm text-gray-500 mt-1">{app.url}</p>
                  <div className="flex mt-2">
                    {(app.tags || ['Job Application']).map((tag, i) => (
                      <span 
                        key={i} 
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-${getTagColor(tag)}-100 text-${getTagColor(tag)}-800 mr-2`}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-sm text-gray-500">
                    {app.timestamp ? formatApplicationTime(app.timestamp) : 'Today'}
                  </span>
                  <div className="mt-2">
                    <button className="text-gray-400 hover:text-gray-500">
                      <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          {/* View All Link */}
          <div className="px-4 py-4 sm:px-6 bg-gray-50">
            <div className="text-sm">
              <a href="#" className="font-medium text-primary-600 hover:text-primary-500">
                View all applications <span aria-hidden="true">&rarr;</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
