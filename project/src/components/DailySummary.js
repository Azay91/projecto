import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { BarChart2, DollarSign, ShoppingBag, RefreshCw, CalendarDays } from 'lucide-react';
import { supabase } from '../utils/supabaseClient';
import { formatCurrency, getTodayDate, getStartOfDay, getEndOfDay } from '../utils/helpers';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const DailySummary = React.memo(() => {
  const [summary, setSummary] = useState({
    totalSales: 0,
    totalItemsSold: 0,
    topProducts: [],
    salesByHour: Array(24).fill(0),
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDate, setSelectedDate] = useState(getTodayDate());

  const fetchDailySummary = useCallback(async () => {
    setLoading(true);
    setError(null);

    const startOfDay = getStartOfDay(selectedDate);
    const endOfDay = getEndOfDay(selectedDate);

    try {
      // Fetch sales for the day
      const { data: salesData, error: salesError } = await supabase
        .from('sales')
        .select('id, total_amount, created_at')
        .gte('created_at', startOfDay)
        .lte('created_at', endOfDay);

      if (salesError) throw salesError;

      let totalSales = 0;
      const salesIds = salesData.map(s => {
        totalSales += s.total_amount;
        return s.id;
      });

      // Initialize sales by hour array
      const salesByHour = Array(24).fill(0);
      salesData.forEach(sale => {
        const hour = new Date(sale.created_at).getHours();
        salesByHour[hour] += sale.total_amount;
      });

      // Fetch sale items for the day
      const { data: saleItemsData, error: saleItemsError } = await supabase
        .from('sale_items')
        .select('product_name, quantity')
        .in('sale_id', salesIds);

      if (saleItemsError) throw saleItemsError;

      let totalItemsSold = 0;
      const productSales = {};
      saleItemsData.forEach(item => {
        totalItemsSold += item.quantity;
        productSales[item.product_name] = (productSales[item.product_name] || 0) + item.quantity;
      });

      const topProducts = Object.entries(productSales)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([name, quantity]) => ({ name, quantity }));

      setSummary({
        totalSales,
        totalItemsSold,
        topProducts,
        salesByHour,
      });

    } catch (err) {
      console.error('Error fetching daily summary:', err);
      setError('Error al cargar el resumen diario: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    fetchDailySummary();
  }, [fetchDailySummary]);

  const chartData = {
    labels: Array.from({ length: 24 }, (_, i) => `${i}:00`),
    datasets: [
      {
        label: 'Ventas por Hora',
        data: summary.salesByHour,
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Distribución de Ventas por Hora',
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Hora del Día',
        },
      },
      y: {
        title: {
          display: true,
          text: 'Monto de Ventas',
        },
        beginAtZero: true,
      },
    },
  };

  if (loading) {
    return (
      <motion.div
        className="bg-white rounded-xl shadow-lg p-6 h-full flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <motion.div
          className="w-16 h-16 border-4 border-blue-400 border-t-transparent rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
        <p className="ml-4 text-gray-600">Cargando resumen diario...</p>
      </motion.div>
    );
  }

  if (error) {
    return (
      <motion.div
        className="bg-white rounded-xl shadow-lg p-6 h-full flex items-center justify-center text-red-500"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <p>{error}</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="bg-white rounded-xl shadow-lg p-6 h-full flex flex-col"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
    >
      <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
        <BarChart2 size={28} className="text-green-400" />
        Resumen Diario
      </h2>

      <div className="mb-6 flex items-center gap-4">
        <div className="flex items-center bg-gray-100 rounded-xl p-3 shadow-inner">
          <CalendarDays className="text-gray-500 mr-3" size={24} />
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="bg-transparent outline-none text-gray-800 text-lg"
          />
        </div>
        <motion.button
          onClick={fetchDailySummary}
          className="bg-blue-400 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-500 transition-colors"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <RefreshCw size={18} />
          Actualizar
        </motion.button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <motion.div
          className="bg-blue-400 text-white p-6 rounded-xl shadow-md flex items-center justify-between"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <div>
            <p className="text-lg font-medium">Ventas Totales</p>
            <span className="text-4xl font-bold">{formatCurrency(summary.totalSales)}</span>
          </div>
          <DollarSign size={48} />
        </motion.div>

        <motion.div
          className="bg-purple-400 text-white p-6 rounded-xl shadow-md flex items-center justify-between"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div>
            <p className="text-lg font-medium">Items Vendidos</p>
            <span className="text-4xl font-bold">{summary.totalItemsSold}</span>
          </div>
          <ShoppingBag size={48} />
        </motion.div>

        <motion.div
          className="bg-green-400 text-white p-6 rounded-xl shadow-md flex items-center justify-between"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <div>
            <p className="text-lg font-medium">Día Seleccionado</p>
            <span className="text-3xl font-bold">{selectedDate}</span>
          </div>
          <CalendarDays size={48} />
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          className="bg-gray-100 p-6 rounded-xl shadow-md border border-gray-200"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h3 className="text-xl font-bold text-gray-800 mb-4">Productos Más Vendidos</h3>
          {summary.topProducts.length > 0 ? (
            <ul className="space-y-2">
              {summary.topProducts.map((product, index) => (
                <li key={index} className="flex justify-between items-center text-gray-700">
                  <span>{product.name}</span>
                  <span className="font-semibold">{product.quantity} unidades</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500">No hay productos vendidos hoy.</p>
          )}
        </motion.div>

        <motion.div
          className="bg-gray-100 p-6 rounded-xl shadow-md border border-gray-200"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
        >
          <h3 className="text-xl font-bold text-gray-800 mb-4">Gráfico de Ventas por Hora</h3>
          <Bar data={chartData} options={chartOptions} />
        </motion.div>
      </div>
    </motion.div>
  );
});

export default DailySummary;