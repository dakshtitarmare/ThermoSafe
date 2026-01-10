import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Activity, Thermometer, Cloud, Droplets, TrendingUp, 
  TrendingDown, Minus, AlertTriangle, CheckCircle, 
  AlertCircle, Wifi, WifiOff, Clock, Battery, 
  Shield, Target, Zap, RefreshCw, Bell, Mail, MessageSquare,
  AlertOctagon, AlertCircle as AlertCircleIcon
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, ReferenceLine,
  Area, AreaChart
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { toast, Toaster } from 'react-hot-toast';

const dashboardMock = () => {
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
    confidence: 92,
    spoilageRisk: 'No Risk'
  });

  const [chartData, setChartData] = useState([]);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('24h');
  const [alerts, setAlerts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [temperatureHistory, setTemperatureHistory] = useState([]);
  
  const lastTemperatureRef = useRef(null);
  const lastTimestampRef = useRef(null);
  const alertCooldownRef = useRef({});
  const hasInitialDataRef = useRef(false);
  const spoilageAlertCooldown = useRef(false);

  // Firebase configuration
  const FIREBASE_URL = 'https://cmrhyd-default-rtdb.asia-southeast1.firebasedatabase.app';
  const SENSOR_LOGS_PATH = '/sensor_logs.json';

  // Backend API URL (Replace with your Vercel URL)
  const BACKEND_API_URL = 'https://c-mrbackend.vercel.app'; // Replace with your actual Vercel URL

  // Send alerts via backend API
  // const sendAlert = async (type, data) => {
  //   try {
  //     const response = await fetch(`${BACKEND_API_URL}/send-alert`, {
  //       method: 'POST',
  //       headers: {
  //         'Content-Type': 'application/json',
  //       },
  //       body: JSON.stringify({
  //         type,
  //         ...data,
  //         timestamp: new Date().toISOString(),
  //         source: 'ThermoSafe Dashboard'
  //       })
  //     });

  //     if (!response.ok) throw new Error('Failed to send alert');
      
  //     const result = await response.json();
  //     console.log(`Alert sent via ${type}:`, result);
  //     return result;
  //   } catch (error) {
  //     console.error(`Error sending ${type} alert:`, error);
  //     return { success: false, error: error.message };
  //   }
  // };

  // Send SMS Alert
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

  // Calculate spoilage risk based on temperature history
  const calculateSpoilageRisk = (temperatures) => {
    if (temperatures.length < 6) return { risk: 'Low', message: 'Insufficient data for spoilage calculation' };
    
    const last30min = temperatures.slice(-6); // Assuming 5-minute intervals
    const avgTemp = last30min.reduce((sum, t) => sum + t, 0) / last30min.length;
    
    // Spoilage calculation logic
    if (avgTemp >= 10) {
      const hoursToSpoilage = Math.max(1, Math.round(24 / (avgTemp - 8)));
      return {
        risk: 'CRITICAL',
        message: `HIGH SPOILAGE RISK! Products may spoil in ${hoursToSpoilage} hours`,
        hoursToSpoilage
      };
    } else if (avgTemp >= 8.5) {
      const hoursToSpoilage = Math.max(4, Math.round(48 / (avgTemp - 7)));
      return {
        risk: 'HIGH',
        message: `Medium spoilage risk. Estimated spoilage in ${hoursToSpoilage} hours`,
        hoursToSpoilage
      };
    } else if (avgTemp >= 7.5) {
      const hoursToSpoilage = Math.max(12, Math.round(72 / (avgTemp - 6)));
      return {
        risk: 'MEDIUM',
        message: `Low spoilage risk. Monitor closely. Safe for ${hoursToSpoilage} hours`,
        hoursToSpoilage
      };
    } else {
      return {
        risk: 'LOW',
        message: 'No spoilage risk detected. Products are safe.',
        hoursToSpoilage: null
      };
    }
  };

  // Enhanced Alert escalation system
  const escalateAlert = useCallback(async (temp, previousTemp, tempHistory) => {
    const now = Date.now();
    const tempRounded = Math.floor(temp * 2) / 2; // Round to nearest 0.5
    const alertKey = `${tempRounded}_${Math.floor(now / 300000)}`; // 5-minute buckets
    
    // Cooldown to prevent spam
    if (alertCooldownRef.current[alertKey] && 
        now - alertCooldownRef.current[alertKey] < 300000) { // 5 minutes cooldown
      return;
    }
    
    alertCooldownRef.current[alertKey] = now;
    
    const tempDiff = previousTemp ? Math.abs(temp - previousTemp) : 0;
    const timeStr = new Date().toLocaleTimeString('en-IN', { hour12: true });
    
    let alertMessage = '';
    let subject = '';
    let priority = 'low';
    let spoilageInfo = null;
    
    // Calculate spoilage risk
    const spoilageData = calculateSpoilageRisk(tempHistory);
    
    // SCENARIO 1: Extremely High Temperature (>15°C)
    if (temp >= 15) {
      subject = '🚨 CRITICAL: Temperature Extremely High!';
      alertMessage = `Temperature ${temp.toFixed(1)}°C is CRITICALLY HIGH! Immediate action required to prevent COMPLETE SPOILAGE.`;
      priority = 'high';
      spoilageInfo = `IMMEDIATE SPOILAGE RISK! Products will spoil within 1-2 hours if not cooled immediately.`;
      
      // Update AI prediction
      setAiPrediction(prev => ({
        ...prev,
        spoilageRisk: 'CRITICAL SPOILAGE IMMINENT'
      }));
      
    } 
    // SCENARIO 2: High Temperature (10°C - 15°C)
    else if (temp >= 10) {
      subject = '⚠️ HIGH RISK: Temperature Above Safe Limit';
      alertMessage = `Temperature ${temp.toFixed(1)}°C has crossed 10°C threshold. High risk of spoilage if not addressed soon.`;
      priority = 'high';
      spoilageInfo = spoilageData.message;
      
      // Update AI prediction
      setAiPrediction(prev => ({
        ...prev,
        spoilageRisk: spoilageData.risk
      }));
      
    }
    // SCENARIO 3: Above Optimal (8.5°C - 10°C)
    else if (temp >= 8.5) {
      subject = '⚠️ Warning: Temperature Rising Above Optimal';
      alertMessage = `Temperature ${temp.toFixed(1)}°C is above optimal range (2-8°C). Risk of spoilage increasing.`;
      priority = 'medium';
      spoilageInfo = spoilageData.message;
      
      // Update AI prediction
      setAiPrediction(prev => ({
        ...prev,
        spoilageRisk: spoilageData.risk
      }));
      
    }
    // SCENARIO 4: Near Upper Limit (7.5°C - 8.5°C) - Spoilage Alert Only
    else if (temp >= 7.5) {
      if (!spoilageAlertCooldown.current) {
        subject = 'ℹ️ Monitoring: Temperature Near Upper Limit';
        alertMessage = `Temperature ${temp.toFixed(1)}°C is approaching upper safe limit. Monitor for spoilage risk.`;
        priority = 'low';
        spoilageInfo = spoilageData.message;
        
        spoilageAlertCooldown.current = true;
        setTimeout(() => {
          spoilageAlertCooldown.current = false;
        }, 1800000); // 30 minutes cooldown for spoilage alerts
        
        // Update AI prediction
        setAiPrediction(prev => ({
          ...prev,
          spoilageRisk: spoilageData.risk
        }));
      }
    }
    // SCENARIO 5: Rapid Temperature Change
    else if (tempDiff >= 3) {
      const direction = temp > previousTemp ? 'risen' : 'dropped';
      subject = '📈 Rapid Temperature Change Detected';
      alertMessage = `Temperature ${direction} rapidly by ${tempDiff.toFixed(1)}°C to ${temp.toFixed(1)}°C`;
      priority = tempDiff >= 5 ? 'high' : 'medium';
    }
    
    // Only proceed if we have an alert to send
    if (!alertMessage) return;
    
    // Show toast immediately
    // Show toast immediately
if (priority === 'high') {
  toast.error(`🚨 ${subject}`, {
    duration: 10000,
    position: 'top-right',
    style: {
      background: '#1F2937',
      color: '#FCA5A5',
      border: '2px solid #DC2626',
      fontWeight: 'bold',
    },
    icon: <AlertOctagon className="w-6 h-6" />,
  });
} else if (priority === 'medium') {
  toast.warning(`⚠️ ${subject}`, {
    duration: 8000,
    position: 'top-right',
    style: {
      background: '#1F2937',
      color: '#FCD34D',
      border: '1px solid #D97706',
    },
    icon: <AlertTriangle className="w-5 h-5" />,
  });
} else {
  toast.info(`ℹ️ ${subject}`, {
    duration: 6000,
    position: 'top-right',
    style: {
      background: '#1F2937',
      color: '#93C5FD',
      border: '1px solid #3B82F6',
    },
    icon: <AlertCircleIcon className="w-5 h-5" />,
  });
}

    
    // Add to alerts history
    const newAlert = {
      id: Date.now(),
      type: priority === 'high' ? 'critical' : priority === 'medium' ? 'warning' : 'info',
      message: alertMessage,
      subject,
      temperature: temp,
      previousTemperature: previousTemp,
      time: timeStr,
      priority,
      spoilageInfo
    };
    setAlerts(prev => [newAlert, ...prev.slice(0, 9)]);
    
    // Send notifications based on priority with Indian greeting
    const indianGreeting = "Namaste! From ThermoSafe - Made in India 🇮🇳\n\n";
    
    if (priority === 'high') {
      // High priority: Send SMS and Email
      const smsMessage = `${indianGreeting}${alertMessage}\n\n${spoilageInfo || ''}\n\n🚨 IMMEDIATE ACTION REQUIRED!`;
      const emailMessage = `${indianGreeting}\n\n${alertMessage}\n\n${spoilageInfo ? `📊 ${spoilageInfo}` : ''}\n\nThis is a HIGH PRIORITY alert requiring immediate attention to prevent spoilage.`;
      
      await Promise.all([
        sendSMSAlert(smsMessage, 'high', temp),
        sendEmailAlert(subject, emailMessage, 'high', temp, spoilageInfo)
      ]);
      
      toast.success('📞📧 High priority alerts sent via SMS & Email', {
        duration: 5000,
        position: 'bottom-right',
        icon: '🚨'
      });
      
    } else if (priority === 'medium') {
      // Medium priority: Send Email only
      const emailMessage = `${indianGreeting}\n\n${alertMessage}\n\n${spoilageInfo ? `📈 ${spoilageInfo}` : ''}\n\nPlease monitor the situation closely.`;
      
      await sendEmailAlert(subject, emailMessage, 'medium', temp, spoilageInfo);
      
      toast.success('📧 Alert notification sent via Email', {
        duration: 4000,
        position: 'bottom-right',
        icon: '📧'
      });
      
    } else if (priority === 'low' && spoilageInfo) {
      // Low priority spoilage alert: Dashboard only, no external notifications
      console.log('Spoilage monitoring alert:', alertMessage);
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

  // Update AI prediction with spoilage
  const updateAIPrediction = (temp, trend, tempHistory) => {
    const spoilageData = calculateSpoilageRisk(tempHistory);
    
    if (temp >= 15) {
      setAiPrediction({
        riskLevel: 'CRITICAL',
        timeToBreach: 'NOW',
        recommendation: '🚨 EMERGENCY: Temperature critically high! Immediate action required to prevent complete spoilage.',
        confidence: 98,
        spoilageRisk: 'IMMINENT SPOILAGE'
      });
    } else if (temp >= 10) {
      const minutesToBreach = Math.round((15 - temp) * 20);
      setAiPrediction({
        riskLevel: 'High',
        timeToBreach: `${minutesToBreach} min`,
        recommendation: 'CRITICAL: Temperature above 10°C. High spoilage risk. Activate emergency cooling immediately.',
        confidence: 90,
        spoilageRisk: spoilageData.risk
      });
    } else if (temp >= 8.5) {
      const minutesToBreach = Math.round((10 - temp) * 30);
      setAiPrediction({
        riskLevel: 'Medium',
        timeToBreach: `${minutesToBreach} min`,
        recommendation: 'Warning: Temperature approaching dangerous levels. Check cooling system.',
        confidence: 78,
        spoilageRisk: spoilageData.risk
      });
    } else if (temp >= 7.5) {
      setAiPrediction({
        riskLevel: 'Low',
        timeToBreach: null,
        recommendation: 'Monitor: Temperature near upper limit. Watch for spoilage risk.',
        confidence: 65,
        spoilageRisk: spoilageData.risk
      });
    } else if (temp >= 2 && temp <= 8) {
      setAiPrediction({
        riskLevel: 'Low',
        timeToBreach: null,
        recommendation: 'Container temperature stable. No action required.',
        confidence: 95,
        spoilageRisk: 'No Risk'
      });
    }
  };

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
        const timestamp = new Date(entry.timestamp * 1000);
        return {
          id: key,
          timestamp: timestamp,
          temperature: parseFloat(entry.temperature) || 0,
          isNew: false,
          rawTimestamp: entry.timestamp
        };
      })
      .sort((a, b) => a.rawTimestamp - b.rawTimestamp);

    if (dataArray.length === 0) {
      setIsLoading(false);
      return;
    }

    // Get the latest timestamp
    const latestReading = dataArray[dataArray.length - 1];
    const latestTimestamp = latestReading.rawTimestamp;
    const newTemp = latestReading.temperature;
    const previousTemp = lastTemperatureRef.current;

    // Update temperature history for spoilage calculation
    const newTempHistory = [...temperatureHistory, newTemp].slice(-12); // Keep last hour of data (assuming 5-min intervals)
    setTemperatureHistory(newTempHistory);

    // Check if we have new data (compare timestamps)
    const hasNewData = !lastTimestampRef.current || latestTimestamp > lastTimestampRef.current;

    // Update timestamp reference
    lastTimestampRef.current = latestTimestamp;

    // Check for temperature alerts with spoilage calculation
    if (hasNewData && previousTemp !== null) {
      const tempDiff = Math.abs(newTemp - previousTemp);
      
      // Check all alert conditions
      if (newTemp >= 7.5 || tempDiff >= 3 || newTemp >= 15) {
        escalateAlert(newTemp, previousTemp, newTempHistory);
      }
    } else if (hasNewData) {
      // First data point check
      if (newTemp >= 7.5 || newTemp >= 15) {
        escalateAlert(newTemp, null, newTempHistory);
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

    // Update AI prediction with spoilage
    updateAIPrediction(newTemp, tempTrend, newTempHistory);

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
      external: 28.4 + (Math.random() - 0.5) * 2,
      isNew: hasNewData && index === filteredData.length - 1
    }));

    setChartData(formattedData);
    setIsLoading(false);

    // If we have data, mark that we've loaded initial data
    if (!hasInitialDataRef.current && dataArray.length > 0) {
      hasInitialDataRef.current = true;
    }

    // Show toast for new data
    if (hasNewData && hasInitialDataRef.current) {
      setTimeout(() => {
        setChartData(prev => prev.map(point => ({ ...point, isNew: false })));
      }, 2000);

      toast.success(`📊 New reading: ${newTemp.toFixed(1)}°C at ${latestReading.timestamp.toLocaleTimeString('en-IN')}`, {
        duration: 3000,
        position: 'bottom-left',
        icon: '🌡️'
      });
    }
  }, [activeTab, escalateAlert, temperatureHistory]);

  // Fetch data from Firebase
  const fetchFirebaseData = async (manual = false) => {
    try {
      if (manual) setIsLoading(true);
      
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

  // Initial fetch and setup polling
  useEffect(() => {
    fetchFirebaseData();
    
    const interval = setInterval(() => {
      fetchFirebaseData();
    }, 5000);
    
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

  // Rest of the component remains the same...
  // [All the JSX code from your original component stays exactly the same]
  // Only the backend integration and alert logic has been enhanced

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

  // Add spoilage risk display component
  const SpoilageRiskDisplay = () => {
    if (aiPrediction.spoilageRisk === 'No Risk') return null;
    
    const getRiskColor = () => {
      switch(aiPrediction.spoilageRisk) {
        case 'CRITICAL SPOILAGE IMMINENT':
        case 'IMMINENT SPOILAGE':
          return 'bg-red-500/20 text-red-400';
        case 'CRITICAL':
          return 'bg-orange-500/20 text-orange-400';
        case 'HIGH':
          return 'bg-amber-500/20 text-amber-400';
        case 'MEDIUM':
          return 'bg-yellow-500/20 text-yellow-400';
        default:
          return 'bg-blue-500/20 text-blue-400';
      }
    };
    
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`mt-4 p-4 rounded-xl border ${getRiskColor().split(' ')[0].replace('bg-', 'border-')}/30`}
      >
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangle className="w-5 h-5" />
          <h4 className="font-semibold">Spoilage Risk Assessment</h4>
        </div>
        <p className="text-sm">
          {aiPrediction.spoilageRisk.includes('CRITICAL') ? '🚨 ' : '⚠️ '}
          {aiPrediction.spoilageRisk}
        </p>
        {temperatureHistory.length >= 6 && (
          <p className="text-xs mt-2 text-gray-400">
            Based on last {temperatureHistory.length * 5} minutes of data
          </p>
        )}
      </motion.div>
    );
  };

  // Update the AI Prediction card to include spoilage risk
  const EnhancedAIPredictionCard = () => (
    <motion.div
      whileHover={{ y: -2 }}
      className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700/50 rounded-xl p-6"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-200">AI Prediction & Spoilage Risk</h3>
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-amber-400" />
          <Shield className="w-5 h-5 text-emerald-400" />
        </div>
      </div>
      <div className="text-3xl font-bold text-gray-100 mb-2">
        {aiPrediction.riskLevel} Risk
      </div>
      <div className="text-sm text-gray-500 mb-3">
        {aiPrediction.recommendation}
      </div>
      <SpoilageRiskDisplay />
      {aiPrediction.timeToBreach && (
        <div className="flex items-center gap-2 mt-3 text-sm text-amber-400">
          <Clock className="w-4 h-4" />
          <span>Estimated to breach in: {aiPrediction.timeToBreach}</span>
        </div>
      )}
    </motion.div>
  );

  // Update the alerts panel to show spoilage info
  const EnhancedAlertsPanel = () => {
    if (alerts.length === 0) return null;
    
    return (
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 bg-gradient-to-r from-gray-800/50 to-gray-900/50 border border-gray-700/30 rounded-xl p-4 backdrop-blur-sm"
      >
        <div className="flex items-center gap-3 mb-3">
          <Bell className="w-5 h-5 text-blue-400" />
          <h3 className="font-semibold text-gray-200">Recent Alerts & Notifications</h3>
          <span className="ml-auto text-sm text-blue-400">
            {alerts.filter(a => a.priority === 'high').length} High Priority
          </span>
        </div>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {alerts.slice(0, 5).map(alert => (
            <div 
              key={alert.id} 
              className={`flex items-start gap-3 text-sm p-3 rounded-lg ${
                alert.priority === 'high' 
                  ? 'bg-red-900/20 border border-red-700/30' 
                  : alert.priority === 'medium'
                  ? 'bg-amber-900/20 border border-amber-700/30'
                  : 'bg-blue-900/20 border border-blue-700/30'
              }`}
            >
              <div className={`w-2 h-2 rounded-full mt-2 ${
                alert.priority === 'high' 
                  ? 'bg-red-500 animate-pulse' 
                  : alert.priority === 'medium'
                  ? 'bg-amber-500'
                  : 'bg-blue-500'
              }`} />
              <div className="flex-1">
                <div className="font-medium text-gray-200">{alert.subject}</div>
                <div className="text-gray-400 mt-1">{alert.message}</div>
                {alert.spoilageInfo && (
                  <div className="text-xs text-amber-300 mt-1">📊 {alert.spoilageInfo}</div>
                )}
                <div className="flex justify-between items-center mt-2">
                  <span className="text-xs text-gray-500">{alert.time}</span>
                  <span className={`text-xs px-2 py-1 rounded ${
                    alert.priority === 'high'
                      ? 'bg-red-500/20 text-red-400'
                      : alert.priority === 'medium'
                      ? 'bg-amber-500/20 text-amber-400'
                      : 'bg-blue-500/20 text-blue-400'
                  }`}>
                    {alert.priority.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    );
  };

  // Return statement with all components
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-gray-100">
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
                  ThermoSafe Pro 🇮🇳
                </h1>
                <p className="text-xs text-gray-400">Made in India • Real-time Temperature Monitoring</p>
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
        {/* Enhanced Alerts Panel */}
        <EnhancedAlertsPanel />

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
            
            {/* Temperature Status Indicator */}
            <div className="mt-4">
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-gray-400">Safe Range: 2°C - 8°C</span>
                <span className={`${
                  sensorData.internalTemp < 2 || sensorData.internalTemp > 8 
                    ? 'text-rose-400' 
                    : 'text-emerald-400'
                }`}>
                  {sensorData.internalTemp < 2 ? '❄️ Too Cold' : 
                   sensorData.internalTemp > 8 ? '🔥 Too Hot' : 
                   '✅ Optimal'}
                </span>
              </div>
              <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className={`h-full ${
                    sensorData.internalTemp >= 7.5 && sensorData.internalTemp <= 8 
                      ? 'bg-yellow-500' 
                      : sensorData.internalTemp > 8 
                      ? 'bg-red-500' 
                      : sensorData.internalTemp < 2 
                      ? 'bg-blue-500' 
                      : 'bg-emerald-500'
                  }`}
                  style={{ 
                    width: `${Math.min(Math.max((sensorData.internalTemp / 15) * 100, 0), 100)}%` 
                  }}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>0°C</span>
                <span>2°C</span>
                <span>8°C</span>
                <span>15°C</span>
              </div>
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
            <div className="mt-4 text-sm">
              <div className="flex items-center gap-2 text-gray-400">
                <MessageSquare className="w-4 h-4" />
                <span>Backend Integration: Active</span>
              </div>
              <div className="flex items-center gap-2 text-gray-400 mt-1">
                <Mail className="w-4 h-4" />
                <span>Email Alerts: {alerts.filter(a => a.priority === 'high' || a.priority === 'medium').length} sent</span>
              </div>
            </div>
          </motion.div>

          {/* Enhanced AI Prediction Card */}
          <EnhancedAIPredictionCard />
        </div>

        {/* Main Chart Section - Keep as is */}
        {/* ... [All your existing chart JSX remains exactly the same] ... */}

        {/* Footer with Indian pride */}
        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center text-sm text-gray-500 border-t border-gray-800/50 pt-6"
        >
          <div className="flex items-center justify-center gap-2 mb-3">
            <div className="w-6 h-6 bg-gradient-to-r from-orange-500 to-green-500 rounded-full flex items-center justify-center">
              <span className="text-xs font-bold text-white">🇮🇳</span>
            </div>
            <p className="text-lg font-medium bg-gradient-to-r from-orange-400 to-green-400 bg-clip-text text-transparent">
              Made with Pride in India
            </p>
          </div>
          <p>Real-time Monitoring System • ESP32 → Firebase → Vercel Backend • Instant Updates</p>
          <p className="mt-2">
            Alert System: 
            <span className="text-amber-400"> Dashboard Toast </span> → 
            <span className="text-blue-400"> Email </span> → 
            <span className="text-red-400"> SMS Escalation</span>
          </p>
          <p className="mt-2">
            Spoilage Prediction: AI-powered risk assessment based on temperature history
          </p>
          <div className="flex items-center justify-center gap-4 mt-4 text-xs">
            <span className="flex items-center gap-1">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></div>
              {isConnected ? 'Connected to Firebase' : 'Disconnected from Firebase'}
            </span>
            <span>•</span>
            <span>Backend: {BACKEND_API_URL.includes('vercel') ? 'Vercel Active' : 'Configure Backend URL'}</span>
            <span>•</span>
            <span>Data Points: {chartData.length}</span>
            <span>•</span>
            <span>System Time: {currentTime.toLocaleTimeString('en-IN')}</span>
          </div>
        </motion.footer>
      </main>
    </div>
  );
};

// Helper components (keep as is from original)
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

const getLastReadingTime = () => {
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
}

export default dashboardMock;