import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Activity, Thermometer, TrendingUp, TrendingDown, AlertTriangle, CheckCircle, 
  AlertCircle, Wifi, WifiOff, Clock, Battery, Zap, RefreshCw, Bell, Mail, MessageSquare
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, ReferenceLine,
  Area, AreaChart
} from 'recharts';
import { motion } from 'framer-motion';
import { toast, Toaster } from 'react-hot-toast';

// Backend API URLs
const BACKEND_URL = "https://c-mrbackend.vercel.app";

const ThermoSafeDashboard = () => {
  // States
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isConnected, setIsConnected] = useState(false);
  const [baselineTemp, setBaselineTemp] = useState(null);
  const [sensorData, setSensorData] = useState({
    internalTemp: 0,
    status: 'SAFE',
    internalTrend: 'steady',
  });

  const [aiPrediction, setAiPrediction] = useState({
    riskLevel: 'Low',
    recommendation: 'Waiting for sensor data...',
    confidence: 92
  });

  const [chartData, setChartData] = useState([]);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('24h');
  const [alerts, setAlerts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hourlyLogs, setHourlyLogs] = useState([]);
  const [userEmail, setUserEmail] = useState('');
  const [userPhone, setUserPhone] = useState('');
  
  // Refs
  const lastTemperatureRef = useRef(null);
  const lastTimestampRef = useRef(null);
  const alertCooldownRef = useRef({});
  const hasInitialDataRef = useRef(false);
  const baselineSetRef = useRef(false);
  const hourlyReportIntervalRef = useRef(null);
  
  // Firebase configuration
  const FIREBASE_URL = 'https://cmrhyd-default-rtdb.asia-southeast1.firebasedatabase.app';
  const SENSOR_LOGS_PATH = '/sensor_logs.json';

  // ====================== USER DATA INITIALIZATION ======================

  useEffect(() => {
    // Get user email and phone from localStorage or default
    const storedUser = localStorage.getItem('thermosafe_user');
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        setUserEmail(userData.email || 'piyushatkari55@gmail.com');
        setUserPhone(userData.phone || '+919022210570');
      } catch (error) {
        console.error('Error parsing user data:', error);
        setUserEmail('piyushatkari55@gmail.com');
        setUserPhone('+919022210570');
      }
    } else {
      // Default test credentials
      setUserEmail('piyushatkari55@gmail.com');
      setUserPhone('+919022210570');
    }
  }, []);

  // ====================== ALERT FUNCTIONS ======================

  // 1. Dashboard Alert (React Toast)
  const sendDashboardAlert = (message, type = 'error', temperature = null) => {
    const config = {
      duration: 6000,
      position: 'top-right',
      style: {
        background: '#1F2937',
        border: '1px solid',
        borderRadius: '0.75rem',
        padding: '16px',
      },
    };

    if (type === 'error') {
      toast.error(`🚨 ${message}`, {
        ...config,
        style: { ...config.style, color: '#FCA5A5', borderColor: '#DC2626' }
      });
    } else if (type === 'warning') {
      toast.warning(`⚠️ ${message}`, {
        ...config,
        style: { ...config.style, color: '#FCD34D', borderColor: '#D97706' }
      });
    } else {
      toast.success(`✅ ${message}`, {
        ...config,
        style: { ...config.style, color: '#86EFAC', borderColor: '#059669' }
      });
    }

    // Add to alerts history
    const newAlert = {
      id: Date.now(),
      type,
      message,
      temperature,
      time: new Date().toLocaleTimeString(),
    };
    setAlerts(prev => [newAlert, ...prev.slice(0, 9)]);
  };

  // 2. SMS Alert API Integration
  const sendSMSAlert = async (temperature, deviation, isSpike = false) => {
    try {
      let message = '';
      
      if (isSpike) {
        message = `🚨 THERMOSAFE ALERT: CRITICAL temperature spike detected! Current: ${temperature.toFixed(1)}°C. Sudden rise of ${deviation.toFixed(1)}°C. Check cooling system immediately!`;
      } else {
        message = `⚠️ THERMOSAFE ALERT: Temperature deviation! Current: ${temperature.toFixed(1)}°C (${deviation > 0 ? '+' : ''}${deviation.toFixed(1)}°C from baseline). Check dashboard for details.`;
      }

      console.log('Sending SMS to:', userPhone, 'Message:', message);

      const response = await fetch(`${BACKEND_URL}/send-sms`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: userPhone,
          message: message
        })
      });

      const result = await response.json();
      
      if (result.success) {
        console.log('SMS sent successfully:', result.msg);
        sendDashboardAlert(`SMS sent to ${userPhone}`, 'success');
        return { success: true, message: result.msg };
      } else {
        console.error('SMS sending failed:', result);
        sendDashboardAlert(`Failed to send SMS: ${result.msg || 'Unknown error'}`, 'error');
        return { success: false, error: result.msg };
      }

    } catch (error) {
      console.error('Error sending SMS:', error);
      sendDashboardAlert('Failed to send SMS: Network error', 'error');
      return { success: false, error: error.message };
    }
  };

  // 3. Email Alert API Integration
  const sendEmailAlert = async (temperature, deviation, isSpike = false, baseline = null) => {
    try {
      const subject = isSpike 
        ? `🚨 CRITICAL: Temperature Spike Detected - ${temperature.toFixed(1)}°C` 
        : `⚠️ ALERT: Temperature Deviation Detected - ${temperature.toFixed(1)}°C`;

      const message = `
Temperature Alert Details:

🌡️ CURRENT TEMPERATURE: ${temperature.toFixed(1)}°C
${baseline ? `📊 BASELINE TEMPERATURE: ${baseline.toFixed(1)}°C` : ''}
📈 DEVIATION: ${deviation > 0 ? '+' : ''}${deviation.toFixed(1)}°C
🚨 ALERT TYPE: ${isSpike ? 'SUDDEN SPIKE (≥5°C)' : 'BASELINE DEVIATION (±5°C)'}
⏰ TIME: ${new Date().toLocaleString()}

${isSpike 
  ? '🚨 IMMEDIATE ACTION REQUIRED:\n1. Check cooling system\n2. Contact emergency maintenance\n3. Activate backup cooling'
  : '⚠️ RECOMMENDED ACTION:\n1. Monitor temperature closely\n2. Check cooling system operation\n3. Review temperature history on dashboard'
}

View real-time data on your ThermoSafe Dashboard.

Best regards,
ThermoSafe Team
      `;

      console.log('Sending Email to:', userEmail, 'Subject:', subject);

      const response = await fetch(`${BACKEND_URL}/send-email`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: userEmail,
          subject: subject,
          message: message
        })
      });

      const result = await response.json();
      
      if (result.success) {
        console.log('Email sent successfully:', result.msg);
        sendDashboardAlert(`Email sent to ${userEmail}`, 'success');
        return { success: true, message: result.msg };
      } else {
        console.error('Email sending failed:', result);
        sendDashboardAlert(`Failed to send email: ${result.msg || 'Unknown error'}`, 'error');
        return { success: false, error: result.msg };
      }

    } catch (error) {
      console.error('Error sending email:', error);
      sendDashboardAlert('Failed to send email: Network error', 'error');
      return { success: false, error: error.message };
    }
  };

  // 4. Hourly Report Email
  const sendHourlyReport = async (logs) => {
    if (logs.length === 0) return;

    try {
      const avgTemp = logs.reduce((sum, log) => sum + log.temperature, 0) / logs.length;
      const minTemp = Math.min(...logs.map(log => log.temperature));
      const maxTemp = Math.max(...logs.map(log => log.temperature));
      const alertCount = logs.filter(log => log.alertTriggered).length;

      const subject = `📊 ThermoSafe Hourly Report - ${new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;

      const message = `
THERMOSAFE HOURLY REPORT
========================

📅 REPORT PERIOD: ${logs[0].time} to ${logs[logs.length - 1].time}

📈 TEMPERATURE STATISTICS:
• Average Temperature: ${avgTemp.toFixed(1)}°C
• Minimum Temperature: ${minTemp.toFixed(1)}°C
• Maximum Temperature: ${maxTemp.toFixed(1)}°C
• Alerts Triggered: ${alertCount}
• Total Readings: ${logs.length}

📝 DETAILED LOGS:
${logs.map(log => `• ${log.time} - ${log.temperature.toFixed(1)}°C - ${log.status} ${log.alertTriggered ? '🚨' : '✅'}`).join('\n')}

View real-time data on your ThermoSafe Dashboard.

Best regards,
ThermoSafe Team
      `;

      console.log('Sending Hourly Report to:', userEmail);

      const response = await fetch(`${BACKEND_URL}/send-email`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: userEmail,
          subject: subject,
          message: message
        })
      });

      const result = await response.json();
      
      if (result.success) {
        console.log('Hourly report sent successfully:', result.msg);
        sendDashboardAlert(`Hourly report sent to ${userEmail}`, 'success');
        return { success: true, message: result.msg };
      } else {
        console.error('Hourly report sending failed:', result);
        return { success: false, error: result.msg };
      }

    } catch (error) {
      console.error('Error sending hourly report:', error);
      return { success: false, error: error.message };
    }
  };

  // ====================== TEMPERATURE VALIDATION ======================

  // Validate temperature against baseline (±5°C rule)
  const validateTemperature = useCallback(async (newTemp, previousTemp) => {
    // Cooldown check (5 minutes)
    const now = Date.now();
    const cooldownKey = 'tempValidation';
    
    if (alertCooldownRef.current[cooldownKey] && 
        now - alertCooldownRef.current[cooldownKey] < 300000) {
      return;
    }

    let alertTriggered = false;
    let alertMessage = '';
    let isCritical = false;
    let deviation = 0;

    // Check 1: Baseline deviation (±5°C)
    if (baselineTemp !== null) {
      deviation = Math.abs(newTemp - baselineTemp);
      
      if (deviation > 5) {
        alertTriggered = true;
        alertMessage = `Temperature deviation: ${newTemp.toFixed(1)}°C (${deviation.toFixed(1)}°C from baseline ${baselineTemp.toFixed(1)}°C)`;
        
        // Send alerts
        sendDashboardAlert(alertMessage, 'error', newTemp);
        
        // Send SMS and Email in parallel
        await Promise.all([
          sendSMSAlert(newTemp, newTemp - baselineTemp, false),
          sendEmailAlert(newTemp, newTemp - baselineTemp, false, baselineTemp)
        ]);
        
        alertCooldownRef.current[cooldownKey] = now;
      }
    }

    // Check 2: Sudden spike (≥5°C from previous reading)
    if (previousTemp !== null && !alertTriggered) {
      const spike = Math.abs(newTemp - previousTemp);
      
      if (spike >= 5) {
        alertTriggered = true;
        isCritical = true;
        alertMessage = `CRITICAL: Temperature spike detected! From ${previousTemp.toFixed(1)}°C to ${newTemp.toFixed(1)}°C (${spike.toFixed(1)}°C increase)`;
        
        // Immediate critical alerts
        sendDashboardAlert(alertMessage, 'error', newTemp);
        
        // Send SMS and Email in parallel
        await Promise.all([
          sendSMSAlert(newTemp, spike, true),
          sendEmailAlert(newTemp, spike, true, previousTemp)
        ]);
        
        alertCooldownRef.current[cooldownKey] = now;
      }
    }

    return { alertTriggered, alertMessage, isCritical, deviation };
  }, [baselineTemp, userEmail, userPhone]);

  // ====================== DATA PROCESSING ======================

  // Process Firebase data
  const processFirebaseData = useCallback(async (data) => {
    if (!data || typeof data !== 'object') {
      setIsLoading(false);
      return;
    }

    // Convert Firebase object to array and sort
    const dataArray = Object.entries(data)
      .map(([key, entry]) => ({
        id: key,
        timestamp: new Date(entry.timestamp * 1000),
        temperature: parseFloat(entry.temperature) || 0,
        rawTimestamp: entry.timestamp
      }))
      .sort((a, b) => a.rawTimestamp - b.rawTimestamp);

    if (dataArray.length === 0) {
      setIsLoading(false);
      return;
    }

    // Get latest reading
    const latestReading = dataArray[dataArray.length - 1];
    const newTemp = latestReading.temperature;
    const previousTemp = lastTemperatureRef.current;
    const hasNewData = !lastTimestampRef.current || latestReading.rawTimestamp > lastTimestampRef.current;

    // Update refs
    lastTimestampRef.current = latestReading.rawTimestamp;
    lastTemperatureRef.current = newTemp;

    // Set baseline temperature (first reading)
    if (!baselineSetRef.current && dataArray.length > 0) {
      const firstTemp = dataArray[0].temperature;
      setBaselineTemp(firstTemp);
      baselineSetRef.current = true;
      sendDashboardAlert(`Baseline temperature set: ${firstTemp.toFixed(1)}°C`, 'success', firstTemp);
    }

    // Validate temperature (only if new data)
    if (hasNewData && previousTemp !== null) {
      const validation = await validateTemperature(newTemp, previousTemp);
      
      // Add to hourly logs if alert was triggered
      if (validation?.alertTriggered) {
        const logEntry = {
          time: latestReading.timestamp.toLocaleTimeString(),
          temperature: newTemp,
          status: validation.isCritical ? 'CRITICAL' : 'WARNING',
          alertTriggered: true,
          alertMessage: validation.alertMessage,
          timestamp: new Date()
        };
        setHourlyLogs(prev => [...prev, logEntry]);
      }
    }

    // Update sensor data
    const status = calculateStatus(newTemp);
    const tempTrend = calculateTrend(newTemp, previousTemp);
    
    setSensorData(prev => ({
      ...prev,
      internalTemp: newTemp,
      status,
      internalTrend: tempTrend
    }));

    // Update AI prediction
    updateAIPrediction(newTemp, tempTrend);

    // Process chart data
    const now = Date.now();
    let filteredData = [...dataArray];

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

    // Format for chart with animation flags
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
      isNew: hasNewData && index === filteredData.length - 1
    }));

    setChartData(formattedData);
    setIsLoading(false);

    // Show toast for new data
    if (hasNewData && hasInitialDataRef.current) {
      setTimeout(() => {
        setChartData(prev => prev.map(point => ({ ...point, isNew: false })));
      }, 2000);

      toast.success(`📊 New reading: ${newTemp.toFixed(1)}°C`, {
        duration: 3000,
        position: 'bottom-left',
        icon: '🌡️'
      });
    }

    // Mark initial data loaded
    if (!hasInitialDataRef.current && dataArray.length > 0) {
      hasInitialDataRef.current = true;
    }
  }, [activeTab, validateTemperature]);

  // ====================== FIREBASE INTEGRATION ======================

  // Fetch data from Firebase
  const fetchFirebaseData = async (manual = false) => {
    try {
      setIsLoading(true);
      
      const response = await fetch(`${FIREBASE_URL}${SENSOR_LOGS_PATH}?orderBy="$key"&limitToLast=100&t=${Date.now()}`);
      
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const data = await response.json();
      
      if (data) {
        await processFirebaseData(data);
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
        sendDashboardAlert('⚠️ Connection lost to Firebase', 'error');
      }
      
      setIsLoading(false);
    }
  };

  // Real-time polling
  useEffect(() => {
    // Initial fetch
    fetchFirebaseData();
    
    // Set up real-time polling every 5 seconds
    const pollInterval = setInterval(() => {
      fetchFirebaseData();
    }, 5000);
    
    return () => clearInterval(pollInterval);
  }, []);

  // Set up hourly report timer
  useEffect(() => {
    // Send initial report after 1 hour
    const sendReport = async () => {
      if (hourlyLogs.length > 0 && userEmail) {
        await sendHourlyReport(hourlyLogs);
        // Clear logs after sending report
        setHourlyLogs([]);
      }
    };

    // Send report every hour
    hourlyReportIntervalRef.current = setInterval(sendReport, 3600000); // 1 hour
    
    // Cleanup
    return () => {
      if (hourlyReportIntervalRef.current) {
        clearInterval(hourlyReportIntervalRef.current);
      }
    };
  }, [hourlyLogs, userEmail]);

  // Refetch when tab changes
  useEffect(() => {
    if (hasInitialDataRef.current) {
      fetchFirebaseData();
    }
  }, [activeTab]);

  // ====================== HELPER FUNCTIONS ======================

  const calculateStatus = (temp) => {
    if (temp >= 2 && temp <= 8) return 'SAFE';
    if ((temp > 8 && temp <= 10) || (temp >= 0 && temp < 2)) return 'WARNING';
    return 'CRITICAL';
  };

  const calculateTrend = (currentValue, previousValue) => {
    if (!previousValue) return 'steady';
    const diff = currentValue - previousValue;
    if (Math.abs(diff) < 0.3) return 'steady';
    return diff > 0 ? 'up' : 'down';
  };

  const updateAIPrediction = (temp, trend) => {
    if (temp >= 2 && temp <= 8) {
      setAiPrediction({
        riskLevel: 'Low',
        recommendation: 'Container temperature stable. No action required.',
        confidence: 95
      });
    } else if (temp > 8 && temp <= 10) {
      setAiPrediction({
        riskLevel: 'Medium',
        recommendation: 'Monitor closely. Consider activating backup cooling.',
        confidence: 78
      });
    } else {
      setAiPrediction({
        riskLevel: 'High',
        recommendation: 'CRITICAL: Activate emergency protocol immediately.',
        confidence: 90
      });
    }
  };

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

  // UI Helper Functions
  const getLastReadingTime = () => {
    if (chartData.length === 0) return '--:--';
    const lastReading = chartData[chartData.length - 1];
    return new Date(lastReading.timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

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

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Test SMS and Email buttons (for debugging)
  const testSMS = async () => {
    const result = await sendSMSAlert(25.5, 5, true);
    console.log('Test SMS result:', result);
  };

  const testEmail = async () => {
    const result = await sendEmailAlert(25.5, 5, true, 20.5);
    console.log('Test Email result:', result);
  };

  // ====================== RENDER ======================

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-gray-100 overflow-x-hidden">
      <Toaster
        toastOptions={{
          duration: 4000,
          style: {
            background: '#1F2937',
            color: '#F3F4F6',
            border: '1px solid #374151',
            borderRadius: '0.75rem',
            padding: '16px',
            maxWidth: '90vw'
          },
        }}
        containerStyle={{
          top: 16,
          right: 16,
          left: 16,
        }}
      />
      
      {/* Header */}
      <motion.header 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="sticky top-0 bg-gray-800/80 backdrop-blur-lg border-b border-gray-700/50 z-50 px-4 sm:px-6 py-3 sm:py-4"
      >
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-lg blur opacity-30"></div>
              <div className="relative bg-gray-800 rounded-lg px-3 sm:px-4 py-1 sm:py-2">
                <h1 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
                  ThermoSafe Pro
                </h1>
                <p className="text-xs text-gray-400">Real-time Temperature Monitoring</p>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-6 w-full sm:w-auto">
            <div className="flex items-center gap-2 sm:gap-3">
              <NextReadingIndicator />
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => fetchFirebaseData(true)}
                className="flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-gray-700/50 hover:bg-gray-700 rounded-lg transition-colors text-sm"
              >
                <RefreshCw className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-400" />
                <span className="text-sm">Refresh</span>
              </motion.button>

              {/* Test buttons for debugging - remove in production */}
              {process.env.NODE_ENV === 'development' && (
                <>
                  <button
                    onClick={testSMS}
                    className="flex items-center gap-2 px-3 py-1.5 bg-green-600 hover:bg-green-700 rounded-lg text-sm"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    Test SMS
                  </button>
                  <button
                    onClick={testEmail}
                    className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    Test Email
                  </button>
                </>
              )}
            </div>
            
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="flex items-center gap-1.5 sm:gap-2">
                {isConnected ? (
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Wifi className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />
                  </motion.div>
                ) : (
                  <WifiOff className="w-4 h-4 sm:w-5 sm:h-5 text-rose-400" />
                )}
                <span className="text-xs sm:text-sm">
                  {isConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </motion.header>

      {/* User Info Banner */}
      {userEmail && (
        <div className="bg-blue-900/30 border border-blue-700/30 mx-4 sm:mx-6 mt-4 rounded-lg p-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div>
              <p className="text-sm text-blue-300">
                Alerts will be sent to:
              </p>
              <p className="text-xs text-blue-400">
                📧 {userEmail} | 📱 {userPhone}
              </p>
            </div>
            <button
              onClick={() => {
                localStorage.removeItem('thermosafe_user');
                window.location.reload();
              }}
              className="text-xs text-blue-400 hover:text-blue-300"
            >
              Change User
            </button>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8">
        {/* Alerts History Panel */}
        {alerts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 sm:mb-6 bg-gradient-to-r from-rose-900/20 to-red-900/10 border border-rose-700/30 rounded-xl p-3 sm:p-4 backdrop-blur-sm"
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 mb-3">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-rose-400" />
                <h3 className="font-semibold text-rose-300 text-sm sm:text-base">Recent Alerts</h3>
              </div>
              <span className="ml-auto text-xs sm:text-sm text-rose-400">
                {alerts.filter(a => a.type === 'error').length} Critical
              </span>
            </div>
            <div className="space-y-2 max-h-32 overflow-y-auto text-xs sm:text-sm">
              {alerts.slice(0, 3).map(alert => (
                <div key={alert.id} className="flex items-center gap-2 sm:gap-3 p-2 bg-rose-900/20 rounded">
                  <div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${alert.type === 'error' ? 'bg-rose-500 animate-pulse' : 'bg-amber-500'}`} />
                  <span className="text-rose-200 flex-1 truncate">{alert.message}</span>
                  <span className="text-rose-400 text-xs shrink-0">{alert.time}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Stats Display */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          {/* Current Temperature */}
          <motion.div
            whileHover={{ y: -2 }}
            className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700/50 rounded-xl p-4 sm:p-6"
          >
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h3 className="font-semibold text-gray-200 text-sm sm:text-base">Current Temperature</h3>
              <motion.div
                animate={{ 
                  scale: sensorData.status === 'CRITICAL' ? [1, 1.2, 1] : 1,
                  transition: sensorData.status === 'CRITICAL' ? { repeat: Infinity, duration: 1 } : {}
                }}
                className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium ${
                  sensorData.status === 'SAFE' ? 'bg-emerald-500/20 text-emerald-400' :
                  sensorData.status === 'WARNING' ? 'bg-amber-500/20 text-amber-400' :
                  'bg-rose-500/20 text-rose-400'
                }`}
              >
                {sensorData.status}
              </motion.div>
            </div>
            <div className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-100 mb-1 sm:mb-2">
              {sensorData.internalTemp.toFixed(1)}°C
            </div>
            <div className="text-xs sm:text-sm text-gray-500">
              {baselineTemp && (
                <span>Baseline: {baselineTemp.toFixed(1)}°C • </span>
              )}
              Last updated: {getLastReadingTime()}
            </div>
          </motion.div>

          {/* Data Points */}
          <motion.div
            whileHover={{ y: -2 }}
            className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700/50 rounded-xl p-4 sm:p-6"
          >
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h3 className="font-semibold text-gray-200 text-sm sm:text-base">Data Points</h3>
              <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
            </div>
            <div className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-100 mb-1 sm:mb-2">
              {chartData.length}
            </div>
            <div className="text-xs sm:text-sm text-gray-500">
              {getDataRangeText()}
            </div>
          </motion.div>

          {/* AI Prediction */}
          <motion.div
            whileHover={{ y: -2 }}
            className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700/50 rounded-xl p-4 sm:p-6 sm:col-span-2 lg:col-span-1"
          >
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h3 className="font-semibold text-gray-200 text-sm sm:text-base">AI Prediction</h3>
              <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-gray-100 mb-1 sm:mb-2">
              {aiPrediction.riskLevel} Risk
            </div>
            <div className="text-xs sm:text-sm text-gray-500 line-clamp-2">
              {aiPrediction.recommendation}
            </div>
          </motion.div>
        </div>

        {/* Main Chart Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-6 sm:mb-8"
        >
          <motion.div 
            className="rounded-xl sm:rounded-2xl bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700/50 p-3 sm:p-4 md:p-6 relative overflow-hidden"
          >
            {/* Chart Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 gap-3 sm:gap-0">
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-gray-100">Temperature History</h2>
                <div className="flex items-center gap-2 sm:gap-3 mt-1">
                  <p className="text-xs sm:text-sm text-gray-500">Real-time Firebase data</p>
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-500"
                  />
                  <span className="text-xs text-emerald-400">Live</span>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 w-full sm:w-auto">
                <div className="flex gap-1 sm:gap-2">
                  {['24h', '6h', '1h'].map((period) => (
                    <motion.button
                      key={period}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className={`px-2 sm:px-3 py-1 rounded-lg text-xs sm:text-sm ${activeTab === period ? 'bg-blue-500 text-white' : 'bg-gray-700/50 text-gray-400 hover:bg-gray-700'}`}
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
              <div className="h-64 sm:h-80 md:h-96 flex flex-col items-center justify-center">
                <div className="relative mb-4 sm:mb-6">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 border-4 border-gray-700 border-t-blue-500 rounded-full animate-spin"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Thermometer className="w-6 h-6 sm:w-8 sm:h-8 text-blue-400" />
                  </div>
                </div>
                <p className="text-sm text-gray-500 text-center px-4">Loading temperature data...</p>
              </div>
            ) : chartData.length > 0 ? (
              <div className="h-64 sm:h-80 md:h-96">
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
                    
                    {/* Baseline Reference Line (if set) */}
                    {baselineTemp && (
                      <ReferenceLine 
                        y={baselineTemp} 
                        stroke="#3B82F6" 
                        strokeDasharray="3 3" 
                        strokeWidth={1.5}
                      >
                        <label value={`Baseline: ${baselineTemp.toFixed(1)}°C`} position="insideTopLeft" fill="#3B82F6" fontSize={10} />
                      </ReferenceLine>
                    )}
                    
                    {/* Baseline Deviation Zone (±5°C) */}
                    {baselineTemp && (
                      <>
                        <ReferenceLine y={baselineTemp + 5} stroke="#F59E0B" strokeDasharray="3 3" strokeWidth={1}>
                          <label value="+5°C Limit" position="insideTopRight" fill="#F59E0B" fontSize={9} />
                        </ReferenceLine>
                        <ReferenceLine y={baselineTemp - 5} stroke="#F59E0B" strokeDasharray="3 3" strokeWidth={1}>
                          <label value="-5°C Limit" position="insideBottomRight" fill="#F59E0B" fontSize={9} />
                        </ReferenceLine>
                      </>
                    )}
                    
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
                
                {/* Chart Legend */}
                <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 mt-3 sm:mt-4 text-xs text-gray-500">
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-blue-500" />
                    <span>Temperature</span>
                  </div>
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-white border border-blue-500" />
                    <span>Latest</span>
                  </div>
                  {baselineTemp && (
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-blue-500 border border-white" />
                      <span>Baseline</span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="h-64 sm:h-80 md:h-96 flex flex-col items-center justify-center px-4">
                <div className="relative mb-4 sm:mb-6">
                  <Thermometer className="w-12 h-12 sm:w-16 sm:h-16 text-gray-600" />
                </div>
                <p className="text-sm text-gray-500 text-center">No temperature data found</p>
                <p className="text-xs text-gray-600 mt-2 text-center">Waiting for ESP32 to send data to Firebase</p>
                <button
                  onClick={() => fetchFirebaseData(true)}
                  className="mt-4 px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors text-sm"
                >
                  Check for Data
                </button>
              </div>
            )}
            
            {/* Chart Footer */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-gray-700/30 gap-3 sm:gap-0">
              <div className="text-xs sm:text-sm text-gray-500">
                <span>Data Source: Firebase • </span>
                <span>Polling: 5s • </span>
                <span>Hourly Reports: Active</span>
              </div>
              
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm">
                  <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-gray-400">Live Updates</span>
                </div>
                
                <button
                  onClick={() => {
                    if (chartData.length > 0) {
                      const csvContent = "data:text/csv;charset=utf-8," 
                        + "Timestamp,Temperature(°C),Baseline(°C)\n"
                        + chartData.map(d => `${d.fullTime},${d.internal},${baselineTemp || ''}`).join("\n");
                      
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
                  className="px-3 py-1 text-xs sm:text-sm bg-gray-700/50 hover:bg-gray-700 rounded-lg transition-colors"
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
          className="text-center text-xs sm:text-sm text-gray-500 border-t border-gray-800/50 pt-4 sm:pt-6"
        >
          <p>Real-time Monitoring System • ESP32 → Firebase • Instant Updates</p>
          <p className="mt-1 sm:mt-2 text-xs">
            Alert System: Dashboard → SMS → Email • Baseline: {baselineTemp ? `${baselineTemp.toFixed(1)}°C ±5°C` : 'Not set'} • Hourly Reports: Active
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-4 mt-3 sm:mt-4 text-xs">
            <span className="flex items-center gap-1">
              <div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></div>
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
            <span className="hidden sm:inline">•</span>
            <span>Data Points: {chartData.length}</span>
            <span className="hidden sm:inline">•</span>
            <span>System Time: {currentTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
          </div>
        </motion.footer>
      </main>
    </div>
  );
};

export default ThermoSafeDashboard;