import React, { useEffect, useRef } from 'react';
import { Chart, registerables } from 'chart.js';
import { motion } from 'framer-motion';

Chart.register(...registerables);

const SalesChart = React.memo(({ salesData, returnsData }) => {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  useEffect(() => {
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    const ctx = chartRef.current.getContext('2d');

    const labels = salesData.map(sale => new Date(sale.sale_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    const salesAmounts = salesData.map(sale => sale.total_amount);
    const returnsAmounts = returnsData.map(ret => ret.total_refund_amount);

    chartInstance.current = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Ventas',
            data: salesAmounts,
            backgroundColor: 'rgba(75, 192, 192, 0.6)',
            borderColor: 'rgba(75, 192, 192, 1)',
            borderWidth: 1,
            borderRadius: 5,
          },
          {
            label: 'Devoluciones',
            data: returnsAmounts,
            backgroundColor: 'rgba(255, 99, 132, 0.6)',
            borderColor: 'rgba(255, 99, 132, 1)',
            borderWidth: 1,
            borderRadius: 5,
          }
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            labels: {
              font: {
                size: 14,
                weight: 'bold',
              },
              color: '#333',
            },
          },
          title: {
            display: true,
            text: 'Ventas y Devoluciones por Hora',
            font: {
              size: 18,
              weight: 'bold',
            },
            color: '#333',
          },
        },
        scales: {
          x: {
            grid: {
              display: false,
            },
            ticks: {
              color: '#555',
            },
          },
          y: {
            beginAtZero: true,
            grid: {
              color: 'rgba(200, 200, 200, 0.2)',
            },
            ticks: {
              color: '#555',
              callback: function(value) {
                return `$${value}`;
              }
            },
          },
        },
      },
    });

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [salesData, returnsData]);

  return (
    <motion.div
      className="bg-white rounded-xl shadow-lg p-6 h-96"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.6 }}
    >
      <canvas ref={chartRef}></canvas>
    </motion.div>
  );
});

export default SalesChart;