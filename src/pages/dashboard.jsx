import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Activity, Thermometer, Cloud, Droplets, TrendingUp, 
  TrendingDown, Minus, AlertTriangle, CheckCircle, 
  AlertCircle, Wifi, WifiOff, Clock, Battery, 
  Shield, Target, Zap, RefreshCw, Bell, Mail, MessageSquare
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, ReferenceLine,
  Area, AreaChart
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { toast, Toaster } from 'react-hot-toast';

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
    humidityTrend: 'steady',
    batteryLevel: 87
  });

  const [aiPrediction, setAiPrediction] = useState({
    riskLevel: 'Low',
    timeToBreach: null,
    recommendation: 'Waiting for sensor data...',
    confidence: 92
  });

  const [chartData, setChartData] = useState([]);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('24h');
  const [alerts, setAlerts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const lastTemperatureRef = useRef(null);
  const lastTimestampRef = useRef(null); // Track last timestamp seen
  const alertCooldownRef = useRef({});
  const hasInitialDataRef = useRef(false);
  const BACKEND_URL = "https://c-mrbackend.vercel.app/";

  // Firebase configuration
const FIREBASE_URL = 'https://cmrhyd-default-rtdb.asia-southeast1.firebasedatabase.app';
const SENSOR_LOGS_PATH = '/sensor_logs.json';

  // Mock API functions
  const sendBackendAlert = async ({
    currentTemp,
    last30MinTemps,
    priority
  }) => {
    try {
      const res = await fetch(`${BACKEND_URL}/temperature-check`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userEmail: "user@gmail.com",
          userPhone: "+919999999999",
          currentTemp,
          last30MinTemps
        })
      });
  
      return await res.json();
    } catch (err) {
      console.error("Backend alert error:", err);
    }
  };
  const sendSMSAlert = async (message, priority = 'medium', temperature = null) => {
    console.log(`[SMS Alert - ${priority.toUpperCase()}] ${message}`);
    
    const smsData = {
      message: `🚨 ThermoSafe Alert: ${message}`,
      priority,
      temperature,
      time: new Date().toLocaleTimeString(),
      greeting: "Namaste! From ThermoSafe - Made in India 🇮🇳"
    };

    // In production: Uncomment this to use backend
    // return await sendAlert('sms', smsData);
    
    // For demo: Simulate backend call
    return new Promise(resolve => {
      setTimeout(() => {
        console.log(`SMS sent: ${message}`);
        resolve({ success: true, message: 'SMS sent via backend' });
      }, 500);
    });
  };

  // Send Email Alert
  const sendEmailAlert = async (subject, message, priority = 'medium', temperature = null, spoilageInfo = null) => {
    console.log(`[Email Alert - ${priority.toUpperCase()}] ${subject}: ${message}`);
    
    const emailData = {
      to: 'admin@thermosafe.com', // Replace with actual email
      subject: `ThermoSafe Alert: ${subject}`,
      message: `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #1e40af, #059669); color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
                .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
                .alert-box { background: ${priority === 'high' ? '#fee2e2' : priority === 'medium' ? '#fef3c7' : '#dbeafe'}; 
                           border-left: 4px solid ${priority === 'high' ? '#dc2626' : priority === 'medium' ? '#d97706' : '#3b82f6'};
                           padding: 15px; margin: 20px 0; border-radius: 5px; }
                .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 12px; }
                .temperature-display { font-size: 24px; font-weight: bold; color: ${priority === 'high' ? '#dc2626' : priority === 'medium' ? '#d97706' : '#059669'}; }
                .action-btn { display: inline-block; background: #3b82f6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-top: 10px; }
                .made-in-india { color: #ef4444; font-weight: bold; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🌡️ ThermoSafe Temperature Alert</h1>
                    <p>Real-time Monitoring System</p>
                </div>
                <div class="content">
                    <h2>Namaste! Dear User,</h2>
                    <p>We have detected a temperature anomaly in your monitored system.</p>
                    
                    <div class="alert-box">
                        <h3>${subject}</h3>
                        <p><strong>Current Temperature:</strong> <span class="temperature-display">${temperature?.toFixed(1) || 'N/A'}°C</span></p>
                        <p>${message}</p>
                        ${spoilageInfo ? `<p><strong>Spoilage Analysis:</strong> ${spoilageInfo}</p>` : ''}
                        <p><strong>Priority:</strong> ${priority.toUpperCase()}</p>
                        <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
                    </div>
                    
                    <h3>Recommended Action:</h3>
                    <ul>
                        ${priority === 'high' 
                          ? '<li>🚨 IMMEDIATELY check cooling system</li><li>📞 Contact emergency maintenance</li><li>🔧 Activate backup cooling</li>' 
                          : priority === 'medium' 
                          ? '<li>👀 Monitor temperature closely</li><li>⚡ Check cooling system operation</li><li>📊 Review historical data</li>'
                          : '<li>✅ System is stable</li><li>📈 Continue monitoring</li><li>🔔 Enable notifications</li>'}
                    </ul>
                    
                    <p>You can view real-time data on your <a href="${window.location.origin}" class="action-btn">ThermoSafe Dashboard</a></p>
                </div>
                <div class="footer">
                    <p>This is an automated alert from ThermoSafe Monitoring System</p>
                    <p class="made-in-india">Made with ❤️ in India 🇮🇳</p>
                    <p>ThermoSafe Pro - Ensuring your assets stay safe and cool</p>
                </div>
            </div>
        </body>
        </html>
      `,
      priority,
      temperature,
      spoilageInfo
    };

    // In production: Uncomment this to use backend
    // return await sendAlert('email', emailData);
    
    // For demo: Simulate backend call
    return new Promise(resolve => {
      setTimeout(() => {
        console.log(`Email sent: ${subject}`);
        resolve({ success: true, message: 'Email sent via backend' });
      }, 500);
    });
  };

  // Alert escalation system
  const escalateAlert = useCallback(async (temp, previousTemp, severity) => {
    const now = Date.now();
    const alertKey = `${severity}_${Math.floor(temp)}`;
    
    // Cooldown to prevent spam (5 minutes for same severity)
    if (alertCooldownRef.current[alertKey] && 
        now - alertCooldownRef.current[alertKey] < 300000) {
      return;
    }
    
    alertCooldownRef.current[alertKey] = now;
    
    const tempDiff = previousTemp ? Math.abs(temp - previousTemp) : 0;
    const timeStr = new Date().toLocaleTimeString();
    
    let alertMessage = '';
    let priority = 'medium';
    
    if (temp < 2 || temp > 8) {
      // Out of range alert
      alertMessage = `Temperature ${temp.toFixed(1)}°C is outside safe range (2-8°C)`;
      priority = temp < 1 || temp > 9 ? 'high' : 'medium';
      
      // Show toast immediately
      toast.error(`⚠️ CRITICAL: ${alertMessage}`, {
        duration: 8000,
        position: 'top-right',
        style: {
          background: '#1F2937',
          color: '#FCA5A5',
          border: '1px solid #DC2626',
        },
      });
      
      // Add to alerts history
      const newAlert = {
        id: Date.now(),
        type: 'critical',
        message: alertMessage,
        temperature: temp,
        time: timeStr,
        priority
      };
      setAlerts(prev => [newAlert, ...prev.slice(0, 9)]);
      
    } else if (tempDiff >= 3) {
      // Rapid temperature change alert
      const direction = temp > previousTemp ? 'risen' : 'dropped';
      alertMessage = `Temperature ${direction} rapidly by ${tempDiff.toFixed(1)}°C to ${temp.toFixed(1)}°C`;
      priority = tempDiff >= 5 ? 'high' : 'medium';
      
      // Show toast immediately
      toast.warning(`🚨 RAPID CHANGE: ${alertMessage}`, {
        duration: 6000,
        position: 'top-right',
        style: {
          background: '#1F2937',
          color: '#FCD34D',
          border: '1px solid #D97706',
        },
      });
      
      const newAlert = {
        id: Date.now(),
        type: 'warning',
        message: alertMessage,
        temperature: temp,
        previousTemperature: previousTemp,
        time: timeStr,
        priority
      };
      setAlerts(prev => [newAlert, ...prev.slice(0, 9)]);
    }
    
    // Send notifications based on priority
    if (priority === 'high') {
      // High priority: Send all notifications
      await Promise.all([
        sendSMSAlert(`URGENT: ${alertMessage}`, 'high'),
        sendEmailAlert(`URGENT: Temperature Alert - ThermoSafe`, alertMessage, 'high')
      ]);
      
      // Show notification sent toast
      toast.success('📞 High priority alerts sent via SMS & Email', {
        duration: 4000,
        position: 'bottom-right'
      });
      
    } else if (priority === 'medium' && (temp < 2 || temp > 8 || tempDiff >= 5)) {
      // Medium priority: Send email only for significant events
      await sendEmailAlert(`Alert: Temperature ${temp < 2 || temp > 8 ? 'Out of Range' : 'Rapid Change'}`, alertMessage, 'medium');
      
      toast.success('📧 Alert notification sent via Email', {
        duration: 3000,
        position: 'bottom-right'
      });
    }
  }, []);

  // Calculate status
  const calculateStatus = (temp) => {
    if (temp >= 2 && temp <= 8) return 'SAFE';
    if ((temp > 8 && temp <= 10) || (temp >= 0 && temp < 2)) return 'WARNING';
    return 'CRITICAL';
  };

  // Calculate trend
  const calculateTrend = (currentValue, previousValue) => {
    if (!previousValue) return 'steady';
    const diff = currentValue - previousValue;
    if (Math.abs(diff) < 0.3) return 'steady';
    return diff > 0 ? 'up' : 'down';
  };

  // Update AI prediction
  const updateAIPrediction = (temp, trend) => {
    if (temp >= 2 && temp <= 8) {
      setAiPrediction({
        riskLevel: 'Low',
        timeToBreach: null,
        recommendation: 'Container temperature stable. No action required.',
        confidence: 95
      });
    } else if (temp > 8 && temp <= 10) {
      const minutesToBreach = Math.round((12 - temp) * 12);
      setAiPrediction({
        riskLevel: 'Medium',
        timeToBreach: `${minutesToBreach} min`,
        recommendation: 'Monitor closely. Consider activating backup cooling.',
        confidence: 78
      });
    } else {
      setAiPrediction({
        riskLevel: 'High',
        timeToBreach: 'NOW',
        recommendation: 'CRITICAL: Activate emergency protocol immediately.',
        confidence: 90
      });
    }
  };

  // Process Firebase data and check for new timestamps
 // Process Firebase data and check for new timestamps
const processFirebaseData = useCallback((data) => {
  if (!data || typeof data !== 'object') {
    setIsLoading(false);
    return;
  }

  // Convert Firebase object to array and sort by timestamp
  const dataArray = Object.entries(data)
    .map(([key, entry]) => {
      // Convert Unix timestamp to Date object
      const timestamp = new Date(entry.timestamp * 1000); // Convert seconds to milliseconds
      return {
        id: key,
        timestamp: timestamp,
        temperature: parseFloat(entry.temperature) || 0,
        isNew: false,
        rawTimestamp: entry.timestamp // Keep original for comparison
      };
    })
    .sort((a, b) => a.rawTimestamp - b.rawTimestamp); // Sort by raw timestamp

  if (dataArray.length === 0) {
    setIsLoading(false);
    return;
  }

  // Get the latest timestamp
  const latestReading = dataArray[dataArray.length - 1];
  const latestTimestamp = latestReading.rawTimestamp;
  const newTemp = latestReading.temperature;
  const previousTemp = lastTemperatureRef.current;

  // Check if we have new data (compare timestamps)
  const hasNewData = !lastTimestampRef.current || latestTimestamp > lastTimestampRef.current;

  // Update timestamp reference
  lastTimestampRef.current = latestTimestamp;

  // Check for rapid temperature changes only if we have new data
  if (hasNewData && previousTemp !== null) {
    const tempDiff = Math.abs(newTemp - previousTemp);
    if (tempDiff >= 3) {
      escalateAlert(newTemp, previousTemp, tempDiff >= 5 ? 'high' : 'medium');
    }
  }

  // Update temperature reference
  lastTemperatureRef.current = newTemp;

  // Calculate trends and status
  const tempTrend = calculateTrend(newTemp, previousTemp);
  const status = calculateStatus(newTemp);

  // Update sensor data
  setSensorData(prev => ({
    ...prev,
    internalTemp: newTemp,
    status,
    internalTrend: tempTrend
  }));

  // Update AI prediction
  updateAIPrediction(newTemp, tempTrend);

  // Process chart data based on active tab
  const now = Date.now();
  let filteredData = [...dataArray];

  // Filter based on time range
  switch (activeTab) {
    case '1h':
      filteredData = dataArray.filter(d => now - d.timestamp.getTime() <= 3600000);
      break;
    case '6h':
      filteredData = dataArray.filter(d => now - d.timestamp.getTime() <= 21600000);
      break;
    case '24h':
      filteredData = dataArray.filter(d => now - d.timestamp.getTime() <= 86400000);
      break;
  }

  // Format data for chart
  const formattedData = filteredData.map((reading, index) => ({
    id: reading.id,
    time: reading.timestamp.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }),
    fullTime: reading.timestamp.toISOString(),
    timestamp: reading.timestamp.getTime(),
    internal: reading.temperature,
    external: 28.4 + (Math.random() - 0.5) * 2, // Simulated external temp
    isNew: hasNewData && index === filteredData.length - 1 // Mark latest as new only if it's new data
  }));

  setChartData(formattedData);
  setIsLoading(false);

  // If we have data, mark that we've loaded initial data
  if (!hasInitialDataRef.current && dataArray.length > 0) {
    hasInitialDataRef.current = true;
  }

  // Show toast for new data (only if it's actually new)
  if (hasNewData && hasInitialDataRef.current) {
    // Clear new flag after animation
    setTimeout(() => {
      setChartData(prev => prev.map(point => ({ ...point, isNew: false })));
    }, 2000);

    // Show success toast for new data
    toast.success(`📊 New reading: ${newTemp.toFixed(1)}°C at ${latestReading.timestamp.toLocaleTimeString()}`, {
      duration: 3000,
      position: 'bottom-left',
      icon: '🌡️'
    });
  }
}, [activeTab, escalateAlert]);
  // Fetch data from Firebase
  const fetchFirebaseData = async (manual = false) => {
    try {
      setIsLoading(true);
      
      // Use timestamp to prevent caching
      const timestamp = Date.now();
      const response = await fetch(`${FIREBASE_URL}${SENSOR_LOGS_PATH}?orderBy="$key"&limitToLast=100&t=${timestamp}`);
      
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const data = await response.json();
      
      if (data) {
        processFirebaseData(data);
        setIsConnected(true);
        setError(null);
      } else {
        throw new Error('No data found in Firebase');
      }
      
    } catch (err) {
      console.error('Fetch error:', err);
      setError(`Connection error: ${err.message}`);
      setIsConnected(false);
      
      if (hasInitialDataRef.current) {
        toast.error('⚠️ Failed to fetch sensor data', {
          duration: 4000,
          position: 'top-center'
        });
      }
      
      setIsLoading(false);
    }
  };

  // Initial fetch
// Initial fetch and setup polling
useEffect(() => {
  fetchFirebaseData();
  
  // Poll every 5 seconds for more real-time updates
  const interval = setInterval(() => {
    fetchFirebaseData();
  }, 5000); // Check every 5 seconds
  
  return () => clearInterval(interval);
}, []);
// Refetch data when tab changes
useEffect(() => {
  if (hasInitialDataRef.current) {
    fetchFirebaseData();
  }
}, [activeTab]);
  // Update time
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Custom dot component for chart
  const CustomDot = (props) => {
    const { cx, cy, payload } = props;
    
    if (!cx || !cy) return null;
    
    return (
      <motion.g
        initial={{ scale: 0, opacity: 0 }}
        animate={{ 
          scale: payload.isNew ? [0, 1.5, 1] : 1,
          opacity: 1 
        }}
        transition={{ duration: 0.5 }}
      >
        <circle
          cx={cx}
          cy={cy}
          r={payload.isNew ? 6 : 4}
          fill={payload.isNew ? "#FFFFFF" : "#3B82F6"}
          stroke={payload.isNew ? "#3B82F6" : "#FFFFFF"}
          strokeWidth={payload.isNew ? 3 : 2}
          className={payload.isNew ? "animate-pulse" : ""}
        />
        {payload.isNew && (
          <motion.circle
            cx={cx}
            cy={cy}
            r={8}
            fill="transparent"
            stroke="#FFFFFF"
            strokeWidth={1}
            initial={{ scale: 1, opacity: 0.7 }}
            animate={{ scale: 2, opacity: 0 }}
            transition={{ duration: 1, repeat: Infinity }}
          />
        )}
      </motion.g>
    );
  };

  // Time until next expected reading (informational only)
  const NextReadingIndicator = () => {
    if (chartData.length === 0) return null;
    
    const lastReadingTime = chartData[chartData.length - 1]?.timestamp;
    const timeSinceLastReading = Date.now() - lastReadingTime;
    const minutesSince = Math.floor(timeSinceLastReading / 60000);
    
    return (
      <div className="flex items-center gap-2">
        <Clock className="w-4 h-4 text-blue-400" />
        <span className="text-sm">
          Last: {minutesSince}m ago
        </span>
      </div>
    );
  };

  // Get last reading time
// Get last reading time
const getLastReadingTime = () => {
  if (chartData.length === 0) return '--:--';
  const lastReading = chartData[chartData.length - 1];
  return new Date(lastReading.timestamp).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
};

  // Get data range text
  const getDataRangeText = () => {
    if (chartData.length === 0) return 'No data';
    
    const first = chartData[0];
    const last = chartData[chartData.length - 1];
    
    const firstTime = new Date(first.timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
    
    const lastTime = new Date(last.timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
    
    return `${firstTime} - ${lastTime}`;
  };

  // Calculate time until next expected reading
  const getTimeUntilNextReading = () => {
    if (chartData.length === 0) return null;
    
    const lastReadingTime = chartData[chartData.length - 1]?.timestamp;
    const timeSinceLastReading = Date.now() - lastReadingTime;
    const minutesSince = Math.floor(timeSinceLastReading / 60000);
    const minutesUntilNext = 15 - (minutesSince % 15);
    
    return minutesUntilNext;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-gray-100">
      {/* Toast Container */}
      <Toaster
        toastOptions={{
          duration: 4000,
          style: {
            background: '#1F2937',
            color: '#F3F4F6',
            border: '1px solid #374151',
            borderRadius: '0.75rem',
            padding: '16px',
            maxWidth: '420px'
          },
        }}
        containerStyle={{
          top: 20,
          right: 20,
        }}
      />
      
      {/* Header */}
      <motion.header 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="sticky top-0 bg-gray-800/80 backdrop-blur-lg border-b border-gray-700/50 z-50 px-6 py-4"
      >
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-lg blur opacity-30"></div>
              <div className="relative bg-gray-800 rounded-lg px-4 py-2">
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
                  ThermoSafe Pro
                </h1>
                <p className="text-xs text-gray-400">Real-time Temperature Monitoring</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <NextReadingIndicator />
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => fetchFirebaseData(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-700/50 hover:bg-gray-700 rounded-lg transition-colors"
            >
              <RefreshCw className="w-4 h-4 text-blue-400" />
              <span className="text-sm">Refresh Now</span>
            </motion.button>
            
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                {isConnected ? (
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Wifi className="w-5 h-5 text-emerald-400" />
                  </motion.div>
                ) : (
                  <WifiOff className="w-5 h-5 text-rose-400" />
                )}
                <span className="text-sm">
                  {isConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </motion.header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Alerts History Panel */}
        {alerts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 bg-gradient-to-r from-rose-900/20 to-red-900/10 border border-rose-700/30 rounded-xl p-4 backdrop-blur-sm"
          >
            <div className="flex items-center gap-3 mb-3">
              <Bell className="w-5 h-5 text-rose-400" />
              <h3 className="font-semibold text-rose-300">Recent Alerts</h3>
              <span className="ml-auto text-sm text-rose-400">
                {alerts.filter(a => a.priority === 'high').length} High Priority
              </span>
            </div>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {alerts.slice(0, 3).map(alert => (
                <div key={alert.id} className="flex items-center gap-3 text-sm p-2 bg-rose-900/20 rounded">
                  <div className={`w-2 h-2 rounded-full ${alert.priority === 'high' ? 'bg-rose-500 animate-pulse' : 'bg-amber-500'}`} />
                  <span className="text-rose-200 flex-1">{alert.message}</span>
                  <span className="text-rose-400 text-xs">{alert.time}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Current Temperature Display */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <motion.div
            whileHover={{ y: -2 }}
            className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700/50 rounded-xl p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-200">Current Temperature</h3>
              <motion.div
                animate={{ 
                  scale: sensorData.status === 'CRITICAL' ? [1, 1.2, 1] : 1,
                  transition: sensorData.status === 'CRITICAL' ? { repeat: Infinity, duration: 1 } : {}
                }}
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  sensorData.status === 'SAFE' ? 'bg-emerald-500/20 text-emerald-400' :
                  sensorData.status === 'WARNING' ? 'bg-amber-500/20 text-amber-400' :
                  'bg-rose-500/20 text-rose-400'
                }`}
              >
                {sensorData.status}
              </motion.div>
            </div>
            <div className="text-5xl font-bold text-gray-100 mb-2">
              {sensorData.internalTemp.toFixed(1)}°C
            </div>
            <div className="text-sm text-gray-500">
              Last updated: {getLastReadingTime()}
              {getTimeUntilNextReading() && (
                <span className="ml-2 text-blue-400">
                  • Next in ~{getTimeUntilNextReading()}m
                </span>
              )}
            </div>
          </motion.div>

          <motion.div
            whileHover={{ y: -2 }}
            className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700/50 rounded-xl p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-200">Data Points</h3>
              <Activity className="w-5 h-5 text-blue-400" />
            </div>
            <div className="text-5xl font-bold text-gray-100 mb-2">
              {chartData.length}
            </div>
            <div className="text-sm text-gray-500">
              {getDataRangeText()}
            </div>
          </motion.div>

          <motion.div
            whileHover={{ y: -2 }}
            className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700/50 rounded-xl p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-200">Prediction</h3>
              <Zap className="w-5 h-5 text-amber-400" />
            </div>
            <div className="text-3xl font-bold text-gray-100 mb-2">
              {aiPrediction.riskLevel} Risk
            </div>
            <div className="text-sm text-gray-500">
              {aiPrediction.recommendation}
            </div>
          </motion.div>
        </div>

        {/* Main Chart Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-8"
        >
          <motion.div 
            className="rounded-2xl bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700/50 p-6 relative overflow-hidden"
          >
            {/* Chart Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-100">Temperature History</h2>
                <div className="flex items-center gap-3 mt-1">
                  <p className="text-gray-500">Real-time readings from Firebase</p>
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="w-2 h-2 rounded-full bg-emerald-500"
                  />
                  <span className="text-xs text-emerald-400">Live Updates</span>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="flex gap-2">
                  {['24h', '6h', '1h'].map((period) => (
                    <motion.button
                      key={period}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className={`px-3 py-1 rounded-lg text-sm ${activeTab === period ? 'bg-blue-500 text-white' : 'bg-gray-700/50 text-gray-400 hover:bg-gray-700'}`}
                      onClick={() => setActiveTab(period)}
                    >
                      {period}
                    </motion.button>
                  ))}
                </div>
                
                <div className="text-right">
                  <div className="text-xs text-gray-500">Last Reading</div>
                  <div className="text-sm font-medium text-gray-300">
                    {getLastReadingTime()}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Main Chart */}
            {isLoading && !hasInitialDataRef.current ? (
              <div className="h-96 flex flex-col items-center justify-center">
                <div className="relative mb-6">
                  <div className="w-24 h-24 border-4 border-gray-700 border-t-blue-500 rounded-full animate-spin"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Thermometer className="w-8 h-8 text-blue-400" />
                  </div>
                </div>
                <p className="text-gray-500">Loading temperature data...</p>
                <p className="text-sm text-gray-600 mt-2">Connecting to Firebase Realtime Database</p>
              </div>
            ) : chartData.length > 0 ? (
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <defs>
                      <linearGradient id="tempGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" strokeOpacity={0.5} />
                    <XAxis 
                      dataKey="time" 
                      stroke="#9CA3AF"
                      fontSize={11}
                      tick={{ fill: '#9CA3AF' }}
                      axisLine={{ stroke: '#4B5563' }}
                      tickLine={{ stroke: '#4B5563' }}
                    />
                    <YAxis 
                      stroke="#9CA3AF"
                      fontSize={11}
                      tick={{ fill: '#9CA3AF' }}
                      axisLine={{ stroke: '#4B5563' }}
                      tickLine={{ stroke: '#4B5563' }}
                      label={{ 
                        value: 'Temperature (°C)', 
                        angle: -90, 
                        position: 'insideLeft',
                        fill: '#9CA3AF',
                        fontSize: 12
                      }}
                      domain={['dataMin - 1', 'dataMax + 1']}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1F2937',
                        border: '1px solid #374151',
                        borderRadius: '8px',
                        color: '#F3F4F6',
                        fontSize: '12px'
                      }}
                      labelStyle={{ color: '#9CA3AF', fontWeight: 500 }}
                      formatter={(value) => [`${value}°C`, 'Temperature']}
                      labelFormatter={(label) => `Time: ${label}`}
                    />
                    
                    {/* Safe Range Reference Lines */}
                    <ReferenceLine y={2} stroke="#EF4444" strokeDasharray="3 3" strokeWidth={1.5}>
                      <label value="Min 2°C" position="insideBottomRight" fill="#EF4444" fontSize={10} />
                    </ReferenceLine>
                    <ReferenceLine y={8} stroke="#EF4444" strokeDasharray="3 3" strokeWidth={1.5}>
                      <label value="Max 8°C" position="insideTopRight" fill="#EF4444" fontSize={10} />
                    </ReferenceLine>
                    
                    {/* Safe Range Area */}
                    <Area
                      type="monotone"
                      dataKey={() => 8}
                      stroke="transparent"
                      fill="#10B981"
                      fillOpacity={0.1}
                      strokeWidth={0}
                    />
                    <Area
                      type="monotone"
                      dataKey={() => 2}
                      stroke="transparent"
                      fill="#1F2937"
                      fillOpacity={0.8}
                      strokeWidth={0}
                    />
                    
                    {/* Temperature Line */}
                    <Line
                      type="monotone"
                      dataKey="internal"
                      stroke="#3B82F6"
                      strokeWidth={3}
                      dot={<CustomDot />}
                      activeDot={{
                        r: 8,
                        fill: '#FFFFFF',
                        stroke: '#3B82F6',
                        strokeWidth: 2,
                        className: 'cursor-pointer'
                      }}
                      name="Temperature"
                    />
                  </LineChart>
                </ResponsiveContainer>
                
                {/* Data Points Legend */}
                <div className="flex items-center justify-center gap-6 mt-4 text-xs text-gray-500">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500" />
                    <span>Temperature Reading</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-white border border-blue-500" />
                    <span>Latest Reading</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <span>Out of Range</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-96 flex flex-col items-center justify-center">
                <div className="relative mb-6">
                  <Thermometer className="w-16 h-16 text-gray-600" />
                </div>
                <p className="text-gray-500">No temperature data found</p>
                <p className="text-sm text-gray-600 mt-2">Waiting for ESP32 to send data to Firebase</p>
                <button
                  onClick={() => fetchFirebaseData(true)}
                  className="mt-4 px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors"
                >
                  Check for Data
                </button>
              </div>
            )}
            
            {/* Chart Footer */}
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-700/30">
              <div className="text-sm text-gray-500">
                Data Source: Firebase Realtime Database
                <span className="mx-2">•</span>
                Polling: Every 10 seconds
              </div>
              
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-gray-400">Auto-refresh active</span>
                </div>
                
                <button
                  onClick={() => {
                    if (chartData.length > 0) {
                      const csvContent = "data:text/csv;charset=utf-8," 
                        + "Timestamp,Temperature(°C)\n"
                        + chartData.map(d => `${d.fullTime},${d.internal}`).join("\n");
                      
                      const encodedUri = encodeURI(csvContent);
                      const link = document.createElement("a");
                      link.setAttribute("href", encodedUri);
                      link.setAttribute("download", `temperature_data_${new Date().toISOString().split('T')[0]}.csv`);
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                      
                      toast.success('📥 Data exported to CSV', {
                        duration: 3000
                      });
                    }
                  }}
                  className="px-3 py-1 text-sm bg-gray-700/50 hover:bg-gray-700 rounded-lg transition-colors"
                  disabled={chartData.length === 0}
                >
                  Export CSV
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Footer */}
        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center text-sm text-gray-500 border-t border-gray-800/50 pt-6"
        >
          <p>Real-time Monitoring System • ESP32 → Firebase Realtime Database • Instant Updates</p>
          <p className="mt-2">Alert System: Toast → SMS → Email Escalation • Checks for new data every 10 seconds</p>
          <div className="flex items-center justify-center gap-4 mt-4 text-xs">
            <span className="flex items-center gap-1">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></div>
              {isConnected ? 'Connected to Firebase' : 'Disconnected from Firebase'}
            </span>
            <span>•</span>
            <span>Data Points: {chartData.length}</span>
            <span>•</span>
            <span>System Time: {currentTime.toLocaleTimeString()}</span>
          </div>
        </motion.footer>
      </main>
    </div>
  );
};

export default ThermoSafeDashboard;