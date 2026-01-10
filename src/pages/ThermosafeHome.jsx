import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Thermometer, Shield, Zap, BarChart3, 
  Cloud, Clock, Smartphone, Globe,
  CheckCircle, Users, Battery, Wifi
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ThermoSafeHome = () => {
  const navigate = useNavigate();

  // Clear all authentication data when homepage loads
  useEffect(() => {
    // Clear localStorage authentication data
    localStorage.removeItem('thermosafe_user');
    localStorage.removeItem('thermosafe_auth_token');
    localStorage.removeItem('thermosafe_admin_session');
    localStorage.removeItem('user_email');
    localStorage.removeItem('user_phone');
    
    // Clear sessionStorage
    sessionStorage.clear();
    
    // Clear any cookies (by setting expiry to past date)
    document.cookie.split(";").forEach(cookie => {
      const cookieName = cookie.split("=")[0].trim();
      document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    });
    
    console.log('🔐 All authentication data cleared from homepage');
  }, []);

  const features = [
    {
      icon: <Thermometer className="w-8 h-8" />,
      title: "Real-time Monitoring",
      description: "24/7 temperature tracking with instant alerts",
      color: "from-blue-500 to-cyan-500"
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: "Smart Alerts",
      description: "SMS, Email & Dashboard notifications",
      color: "from-emerald-500 to-green-500"
    },
    {
      icon: <Zap className="w-8 h-8" />,
      title: "AI Predictions",
      description: "Predict temperature breaches before they happen",
      color: "from-amber-500 to-orange-500"
    },
    {
      icon: <Cloud className="w-8 h-8" />,
      title: "Cloud Storage",
      description: "Secure Firebase data storage & analytics",
      color: "from-purple-500 to-pink-500"
    }
  ];

  const steps = [
    {
      number: "01",
      title: "Connect Device",
      description: "Plug in your ThermoSafe IoT device",
      icon: <Wifi className="w-6 h-6" />
    },
    {
      number: "02",
      title: "Monitor Temperature",
      description: "Real-time tracking on dashboard",
      icon: <Thermometer className="w-6 h-6" />
    },
    {
      number: "03",
      title: "Get Alerts",
      description: "Instant notifications on violations",
      icon: <Smartphone className="w-6 h-6" />
    },
    {
      number: "04",
      title: "Take Action",
      description: "Prevent spoilage with timely actions",
      icon: <CheckCircle className="w-6 h-6" />
    }
  ];

  const stats = [
    { icon: <Clock className="w-5 h-5" />, value: "24/7", label: "Monitoring" },
    { icon: <Thermometer className="w-5 h-5" />, value: "±0.1°C", label: "Accuracy" },
    { icon: <Users className="w-5 h-5" />, value: "100+", label: "Users" },
    { icon: <Battery className="w-5 h-5" />, value: "99.8%", label: "Uptime" }
  ];

  // Handle login navigation with session clear
  const handleLoginClick = () => {
    // Double clear before navigating to login
    localStorage.removeItem('thermosafe_user');
    sessionStorage.clear();
    navigate('/login');
  };

  // Handle dashboard navigation
  const handleDashboardClick = () => {
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-gray-100 overflow-x-hidden">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background Animation */}
        <div className="absolute inset-0">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-emerald-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse delay-1000"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24">
          <div className="text-center">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="inline-block mb-6"
            >
              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full blur opacity-30"></div>
                <div className="relative bg-gray-800 p-4 rounded-full">
                  <Thermometer className="w-12 h-12 text-blue-400" />
                </div>
              </div>
            </motion.div>

            <motion.h1
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6"
            >
              <span className="bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
                ThermoSafe Pro
              </span>
            </motion.h1>

            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto"
            >
              Intelligent temperature monitoring for cold chain logistics. 
              Prevent spoilage with real-time alerts and AI predictions.
            </motion.p>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              {/* <button
                onClick={handleDashboardClick}
                className="px-8 py-4 bg-gradient-to-r from-blue-600 to-emerald-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-emerald-700 transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                Go to Dashboard
              </button> */}
              
              <button
                onClick={handleLoginClick}
                className="px-8 py-4 bg-gray-800 border border-gray-700 text-gray-300 font-semibold rounded-xl hover:bg-gray-700 transition-all duration-300"
              >
                Login
              </button>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16 max-w-2xl mx-auto"
            >
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <div className="text-blue-400">{stat.icon}</div>
                    <div className="text-2xl font-bold">{stat.value}</div>
                  </div>
                  <div className="text-sm text-gray-400">{stat.label}</div>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Why Choose ThermoSafe?</h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Advanced features for reliable temperature monitoring and prevention
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ y: 30, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-2xl p-6 hover:border-gray-600 transition-all duration-300"
              >
                <div className={`inline-flex p-3 rounded-xl bg-gradient-to-r ${feature.color} mb-4`}>
                  <div className="text-white">{feature.icon}</div>
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-400">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">How It Works</h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Simple 4-step process to secure your cold chain
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ y: 30, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="relative"
              >
                <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-2xl p-6">
                  <div className="text-4xl font-bold text-gray-700 mb-4">{step.number}</div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-blue-500/10 rounded-lg">
                      <div className="text-blue-400">{step.icon}</div>
                    </div>
                    <h3 className="text-xl font-semibold">{step.title}</h3>
                  </div>
                  <p className="text-gray-400">{step.description}</p>
                </div>
                
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 -right-4 w-8 h-0.5 bg-gray-700"></div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="bg-gradient-to-r from-blue-900/30 to-emerald-900/30 border border-blue-700/30 rounded-2xl p-8 md:p-12 text-center"
          >
            <div className="inline-flex p-4 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-2xl mb-6">
              <BarChart3 className="w-8 h-8 text-white" />
            </div>
            
            <h2 className="text-3xl font-bold mb-4">Ready to Secure Your Cold Chain?</h2>
            <p className="text-gray-300 mb-8 max-w-2xl mx-auto">
              Join hundreds of businesses who trust ThermoSafe for their temperature-sensitive goods monitoring.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={handleDashboardClick}
                className="px-8 py-4 bg-gradient-to-r from-blue-600 to-emerald-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-emerald-700 transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                Start Monitoring Now
              </button>
              
              <button
                onClick={handleLoginClick}
                className="px-8 py-4 bg-gray-800 border border-gray-700 text-gray-300 font-semibold rounded-xl hover:bg-gray-700 transition-all duration-300"
              >
                Admin Portal
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center gap-3 mb-4 md:mb-0">
              <div className="bg-gray-800 p-2 rounded-lg">
                <Thermometer className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <div className="font-bold text-lg">ThermoSafe Pro</div>
                <div className="text-sm text-gray-500">Made in India 🇮🇳</div>
              </div>
            </div>
            
            <div className="text-gray-500 text-sm">
              © {new Date().getFullYear()} ThermoSafe. All rights reserved.
            </div>
            
            <div className="flex items-center gap-4 mt-4 md:mt-0">
              <button className="text-gray-400 hover:text-gray-300 transition-colors">
                <Globe className="w-5 h-5" />
              </button>
              <div className="text-sm text-gray-500">v1.0.0</div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ThermoSafeHome;