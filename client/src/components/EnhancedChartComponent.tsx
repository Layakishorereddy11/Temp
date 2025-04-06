import { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { ChartData } from '@/types';
import { Loader2, BarChart2, LineChart, Calendar, ChevronDown } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

// Import Chart.js lazily to avoid SSR issues
import { Chart, registerables } from 'chart.js';
import 'chart.js/auto';

// Register Chart.js components
Chart.register(...registerables);

interface EnhancedChartComponentProps {
  applicationData: ChartData | null;
  streakData: ChartData | null;
  title: string;
  loading?: boolean;
  onTimeRangeChange?: (days: number) => void;
}

export default function EnhancedChartComponent({
  applicationData,
  streakData,
  title,
  loading = false,
  onTimeRangeChange
}: EnhancedChartComponentProps) {
  const applicationChartRef = useRef<HTMLCanvasElement>(null);
  const streakChartRef = useRef<HTMLCanvasElement>(null);
  const [chartInstance, setChartInstance] = useState<Chart | null>(null);
  const [activeChart, setActiveChart] = useState<'applications' | 'streak'>('applications');
  const [timeRange, setTimeRange] = useState<number>(7); // Default to 7 days
  
  // Handle time range change
  const handleTimeRangeChange = (days: number) => {
    setTimeRange(days);
    if (onTimeRangeChange) {
      onTimeRangeChange(days);
    }
  };

  // Create and update chart when data or active chart changes
  useEffect(() => {
    // Clear previous chart
    if (chartInstance) {
      chartInstance.destroy();
    }
    
    const createChart = () => {
      const data = activeChart === 'applications' ? applicationData : streakData;
      const chartRef = activeChart === 'applications' ? applicationChartRef : streakChartRef;
      
      if (!chartRef.current || !data) return;
      
      const ctx = chartRef.current.getContext('2d');
      if (!ctx) return;
      
      const gradient = ctx.createLinearGradient(0, 0, 0, 400);
      gradient.addColorStop(0, 'rgba(99, 102, 241, 0.5)');
      gradient.addColorStop(1, 'rgba(99, 102, 241, 0.0)');
      
      // Create a modified copy of the datasets with improved styling
      const enhancedDatasets = data.datasets.map(dataset => {
        const base = { ...dataset };
        
        // Apply styling based on chart type
        if (activeChart === 'applications') {
          return {
            ...base,
            backgroundColor: gradient,
            borderColor: 'rgb(99, 102, 241)',
            borderWidth: base.borderWidth || 1,
            type: 'bar' as const,
          };
        } else {
          return {
            ...base,
            backgroundColor: 'rgba(99, 102, 241, 0.7)',
            borderColor: 'rgb(99, 102, 241)',
            borderWidth: base.borderWidth || 2,
            // For line charts - use a valid monotone option
            cubicInterpolationMode: 'monotone' as const, // Type assertion to "monotone" | "default"
            fill: true,
            type: 'line' as const,
          };
        }
      });
      
      const enhancedData = {
        labels: data.labels,
        datasets: enhancedDatasets
      };
      
      // Define chartType as a valid Chart.js type
      const chartType = activeChart === 'applications' ? 'bar' : 'line';
      
      const newChartInstance = new Chart(ctx, {
        // Cast to a known Chart.js type to satisfy TypeScript
        type: chartType as 'bar' | 'line',
        data: enhancedData,
        options: {
          responsive: true,
          maintainAspectRatio: false,
          animation: {
            duration: 1000,
            easing: 'easeOutQuart'
          },
          plugins: {
            legend: {
              display: false
            },
            tooltip: {
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              titleColor: '#1f2937',
              bodyColor: '#4b5563',
              borderColor: '#e5e7eb',
              borderWidth: 1,
              padding: 12,
              cornerRadius: 8,
              boxPadding: 6,
              displayColors: false,
              callbacks: {
                label: function(context) {
                  let label = `${context.dataset.label}: ${context.parsed.y}`;
                  return label;
                }
              }
            }
          },
          scales: {
            x: {
              grid: {
                display: false,
                // Remove drawBorder as it's not supported in this version
                // of Chart.js
              },
              border: {
                display: false
              },
              ticks: {
                color: '#9ca3af'
              }
            },
            y: {
              beginAtZero: true,
              grid: {
                color: 'rgba(243, 244, 246, 1)',
                // Remove drawBorder as it's not supported in this version
                // of Chart.js
              },
              border: {
                display: false
              },
              ticks: {
                color: '#9ca3af',
                precision: 0, // Only show integers
                stepSize: 1
              }
            }
          }
        }
      });
      
      setChartInstance(newChartInstance);
    };
    
    // Only create chart if data is available
    const data = activeChart === 'applications' ? applicationData : streakData;
    if (data && !loading) {
      createChart();
    }
    
    return () => {
      if (chartInstance) {
        chartInstance.destroy();
      }
    };
  }, [applicationData, streakData, activeChart, loading]);

  // Loading state with skeleton
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-1/3" />
          <Skeleton className="h-4 w-1/2" />
        </CardHeader>
        <CardContent>
          <div className="aspect-[3/2] flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Handle case where data is not available
  if (!applicationData && !streakData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>No data available</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="aspect-[3/2] bg-muted/20 flex flex-col items-center justify-center rounded-md">
            <BarChart2 className="h-10 w-10 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">Apply to some jobs to see your stats!</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <div>
          <CardTitle>{title}</CardTitle>
          <CardDescription>
            {activeChart === 'applications' 
              ? "Number of job applications per day" 
              : "Your application streak progression"}
          </CardDescription>
        </div>
        <div className="flex space-x-2">
          <Tabs 
            value={activeChart} 
            onValueChange={(value) => setActiveChart(value as 'applications' | 'streak')}
            className="mr-2"
          >
            <TabsList className="grid grid-cols-2 h-8 w-[180px]">
              <TabsTrigger value="applications" className="text-xs">
                <BarChart2 className="h-3.5 w-3.5 mr-1" />
                Applications
              </TabsTrigger>
              <TabsTrigger value="streak" className="text-xs">
                <Calendar className="h-3.5 w-3.5 mr-1" />
                Streak
              </TabsTrigger>
            </TabsList>
          </Tabs>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 text-xs">
                {timeRange} days <ChevronDown className="ml-1 h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleTimeRangeChange(7)}>
                7 days
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleTimeRangeChange(14)}>
                14 days
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleTimeRangeChange(30)}>
                30 days
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] relative">
          <canvas
            ref={applicationChartRef}
            style={{ display: activeChart === 'applications' ? 'block' : 'none' }}
          />
          <canvas
            ref={streakChartRef}
            style={{ display: activeChart === 'streak' ? 'block' : 'none' }}
          />
        </div>
      </CardContent>
    </Card>
  );
}