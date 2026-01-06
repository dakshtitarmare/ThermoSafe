import React, { useState, useEffect } from 'react';
import { Activity, Thermometer, Cloud, Droplets, TrendingUp, TrendingDown, Minus, AlertTriangle, CheckCircle, AlertCircle, Wifi, WifiOff } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

const ThermoSafeDashboard = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isConnected, setIsConnected] = useState(false);
  const [sensorData, setSensorData] = useState({
    internalTemp: 0,
    externalTemp: 28.4,
    humidity: 0,
    status: 'SAFE',
    internalTrend: 'steady',
    externalTrend: 'up',
    humidityTrend: 'steady'
  });

  const [aiPrediction, setAiPrediction] = useState({
    riskLevel: 'Low',
    timeToBreach: null,
    recommendation: 'Waiting for sensor data...'
  });

  const [chartData, setChartData] = useState([]);
  const [error, setError] = useState(null);

  // Firebase configuration
  const FIREBASE_URL = 'https://cmrhyd-default-rtdb.asia-southeast1.firebasedatabase.app/sensor.json';

  // Calculate status based on temperature
  const calculateStatus = (temp) => {
    if (temp >= 2 && temp <= 8) return 'SAFE';
    if ((temp > 8 && temp <= 10) || (temp >= 0 && temp < 2)) return 'WARNING';
    return 'CRITICAL';
  };

  // Calculate trend based on recent data
  const calculateTrend = (currentValue, previousValue) => {
    const diff = currentValue - previousValue;
    if (Math.abs(diff) < 0.5) return 'steady';
    return diff > 0 ? 'up' : 'down';
  };

  // Update AI prediction based on temperature
  const updateAIPrediction = (temp, trend) => {
    if (temp >= 2 && temp <= 8) {
      setAiPrediction({
        riskLevel: 'Low',
        timeToBreach: null,
        recommendation: 'No action required. Container temperature stable.'
      });
    } else if (temp > 8 && temp <= 10) {
      const minutesToBreach = Math.round((12 - temp) * 15);
      setAiPrediction({
        riskLevel: 'Medium',
        timeToBreach: `${minutesToBreach} min`,
        recommendation: 'Monitor closely. Consider cooling measures if trend continues.'
      });
    } else {
      setAiPrediction({
        riskLevel: 'High',
        timeToBreach: 'Now',
        recommendation: 'Immediate action required. Temperature outside safe range.'
      });
    }
  };

  // Fetch data from Firebase
  const fetchFirebaseData = async () => {
    try {
      const response = await fetch(FIREBASE_URL);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data && data.temperature !== undefined && data.humidity !== undefined) {
        const newTemp = parseFloat(data.temperature);
        const newHumidity = parseFloat(data.humidity);
        
        // Calculate trends
        const tempTrend = sensorData.internalTemp ? 
          calculateTrend(newTemp, sensorData.internalTemp) : 'steady';
        const humidityTrend = sensorData.humidity ? 
          calculateTrend(newHumidity, sensorData.humidity) : 'steady';
        
        // Calculate status
        const status = calculateStatus(newTemp);
        
        // Update sensor data
        setSensorData(prev => ({
          ...prev,
          internalTemp: newTemp,
          humidity: newHumidity,
          status: status,
          internalTrend: tempTrend,
          humidityTrend: humidityTrend
        }));
        
        // Update AI prediction
        updateAIPrediction(newTemp, tempTrend);
        
        // Update chart data
        const currentTimeStr = new Date().toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: false 
        });
        
        setChartData(prev => {
          const newData = [
            ...prev,
            {
              time: currentTimeStr,
              internal: newTemp,
              external: sensorData.externalTemp
            }
          ];
          // Keep only last 20 data points
          return newData.slice(-20);
        });
        
        setIsConnected(true);
        setError(null);
      } else {
        throw new Error('Invalid data format from Firebase');
      }
    } catch (err) {
      console.error('Error fetching Firebase data:', err);
      setError(err.message);
      setIsConnected(false);
    }
  };

  // Initial fetch and set up polling
  useEffect(() => {
    fetchFirebaseData(); // Fetch immediately on mount
    
    const interval = setInterval(() => {
      fetchFirebaseData();
    }, 3000); // Fetch every 3 seconds
    
    return () => clearInterval(interval);
  }, []);

  // Update current time
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'SAFE': return '#2ECC71';
      case 'WARNING': return '#F1C40F';
      case 'CRITICAL': return '#E74C3C';
      default: return '#2ECC71';
    }
  };

  const getStatusDescription = (status) => {
    switch (status) {
      case 'SAFE': return 'Container stable';
      case 'WARNING': return 'Rising trend detected';
      case 'CRITICAL': return 'Action needed';
      default: return 'Container stable';
    }
  };

  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'up': return <TrendingUp className="w-4 h-4 text-red-500" />;
      case 'down': return <TrendingDown className="w-4 h-4 text-blue-500" />;
      default: return <Minus className="w-4 h-4 text-gray-500" />;
    }
  };

  const getRiskColor = (risk) => {
    switch (risk) {
      case 'Low': return 'bg-green-100 text-green-800 border-green-300';
      case 'Medium': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'High': return 'bg-red-100 text-red-800 border-red-300';
      default: return 'bg-green-100 text-green-800 border-green-300';
    }
  };

  const getHumidityColor = (humidity) => {
    if (humidity >= 30 && humidity <= 60) return '#2ECC71';
    if (humidity > 60 && humidity <= 70) return '#F1C40F';
    return '#E74C3C';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 bg-white shadow-sm z-10 px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">ThermoSafe Logistics</h1>
            <p className="text-sm text-gray-600">Container ID: TS-2024-00142</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              {isConnected ? (
                <>
                  <Wifi className="w-5 h-5 text-green-600" />
                  <div 
                    className="w-3 h-3 rounded-full animate-pulse"
                    style={{ backgroundColor: getStatusColor(sensorData.status) }}
                  />
                  <span className="text-sm font-medium text-gray-700">Live</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-5 h-5 text-red-600" />
                  <span className="text-sm font-medium text-red-600">Disconnected</span>
                </>
              )}
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500">Last Update</p>
              <p className="text-sm font-medium text-gray-700">
                {currentTime.toLocaleTimeString()}
              </p>
            </div>
          </div>
        </div>
        {error && (
          <div className="max-w-7xl mx-auto mt-2 bg-red-50 border border-red-200 rounded px-4 py-2">
            <p className="text-sm text-red-600">⚠️ Connection Error: {error}</p>
          </div>
        )}
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Primary Status Panel */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-6 text-center">
          <div className="mb-4">
            <div className="text-6xl font-bold text-gray-900 mb-2">
              {sensorData.internalTemp.toFixed(1)}°C
            </div>
            <div className="text-sm text-gray-600 mb-4">Current Internal Temperature</div>
          </div>
          <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-lg font-semibold"
               style={{ 
                 backgroundColor: getStatusColor(sensorData.status) + '20',
                 color: getStatusColor(sensorData.status),
                 border: `2px solid ${getStatusColor(sensorData.status)}`
               }}>
            {sensorData.status === 'SAFE' && <CheckCircle className="w-6 h-6" />}
            {sensorData.status === 'WARNING' && <AlertTriangle className="w-6 h-6" />}
            {sensorData.status === 'CRITICAL' && <AlertCircle className="w-6 h-6" />}
            {sensorData.status}
          </div>
          <p className="mt-4 text-gray-600">{getStatusDescription(sensorData.status)}</p>
        </div>

        {/* Sensor Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {/* Internal Temperature Card */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Thermometer className="w-5 h-5 text-green-600" />
                <h3 className="text-sm font-semibold text-gray-700">Internal Temp</h3>
              </div>
              {getTrendIcon(sensorData.internalTrend)}
            </div>
            <div className="text-3xl font-bold text-gray-900">{sensorData.internalTemp.toFixed(1)}°C</div>
            <p className="text-xs text-gray-500 mt-1">Target: 2-8°C</p>
          </div>

          {/* External Temperature Card */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Cloud className="w-5 h-5 text-orange-600" />
                <h3 className="text-sm font-semibold text-gray-700">External Temp</h3>
              </div>
              {getTrendIcon(sensorData.externalTrend)}
            </div>
            <div className="text-3xl font-bold text-gray-900">{sensorData.externalTemp.toFixed(1)}°C</div>
            <p className="text-xs text-gray-500 mt-1">Ambient conditions</p>
          </div>

          {/* Humidity Card */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Droplets className="w-5 h-5 text-blue-600" />
                <h3 className="text-sm font-semibold text-gray-700">Humidity</h3>
              </div>
              {getTrendIcon(sensorData.humidityTrend)}
            </div>
            <div className="text-3xl font-bold text-gray-900">{sensorData.humidity}%</div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
              <div 
                className="h-2 rounded-full transition-all"
                style={{ 
                  width: `${Math.min(sensorData.humidity, 100)}%`,
                  backgroundColor: getHumidityColor(sensorData.humidity)
                }}
              />
            </div>
          </div>
        </div>

        {/* Temperature Stability Chart */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Temperature Stability</h2>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis domain={[0, 35]} label={{ value: '°C', angle: -90, position: 'insideLeft' }} />
                <Tooltip />
                <ReferenceLine y={2} stroke="#E74C3C" strokeDasharray="3 3" label="Min Safe" />
                <ReferenceLine y={8} stroke="#E74C3C" strokeDasharray="3 3" label="Max Safe" />
                <Line 
                  type="monotone" 
                  dataKey="internal" 
                  stroke="#2ECC71" 
                  strokeWidth={3}
                  name="Internal Temp"
                  dot={{ r: 3 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="external" 
                  stroke="#95A5A6" 
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  name="External Temp"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500">
              <p>Waiting for sensor data...</p>
            </div>
          )}
        </div>

        {/* AI Insights Panel */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg shadow-lg p-6 border-2 border-blue-200 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-6 h-6 text-indigo-600" />
            <h2 className="text-xl font-bold text-gray-900">AI Insights & Predictions</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-600 mb-2">Predicted Risk Level</p>
              <span className={`inline-block px-4 py-2 rounded-lg font-semibold border-2 ${getRiskColor(aiPrediction.riskLevel)}`}>
                {aiPrediction.riskLevel}
              </span>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-2">Time to Breach</p>
              <p className="text-2xl font-bold text-gray-900">
                {aiPrediction.timeToBreach || 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-2">Recommendation</p>
              <p className="text-sm font-medium text-gray-800">{aiPrediction.recommendation}</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="text-center text-sm text-gray-500 mt-8">
          <p>Data Source: ESP32 Sensors → Firebase Realtime Database → Real-time Updates</p>
          <p className="mt-1">Polling interval: 3 seconds</p>
        </footer>
      </main>
    </div>
  );
};

export default ThermoSafeDashboard;