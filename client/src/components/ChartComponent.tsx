import { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';
import { ChartData } from '@/types';

interface ChartComponentProps {
  data: ChartData | null;
  title: string;
  type?: 'line' | 'bar';
  height?: string;
}

export default function ChartComponent({ 
  data, 
  title, 
  type = 'bar', 
  height = '16rem' 
}: ChartComponentProps) {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);

  useEffect(() => {
    if (!chartRef.current || !data) return;

    // Destroy existing chart
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    // Create new chart
    const ctx = chartRef.current.getContext('2d');
    if (!ctx) return;

    chartInstance.current = new Chart(ctx, {
      type,
      data,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: {
              drawBorder: false
            }
          },
          x: {
            grid: {
              display: false
            }
          }
        }
      }
    });

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [data, type]);

  return (
    <div className="bg-white shadow rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">{title}</h3>
        <div className="flex items-center space-x-2">
          <button className="px-3 py-1 bg-primary-100 text-primary-700 text-sm font-medium rounded-md">
            7 Days
          </button>
          <button className="px-3 py-1 text-gray-600 text-sm font-medium rounded-md">
            30 Days
          </button>
          <button className="px-3 py-1 text-gray-600 text-sm font-medium rounded-md">
            All
          </button>
        </div>
      </div>
      <div style={{ height }}>
        {data ? (
          <canvas ref={chartRef}></canvas>
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-400">Loading chart data...</p>
          </div>
        )}
      </div>
    </div>
  );
}
