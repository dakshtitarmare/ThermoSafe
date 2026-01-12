import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Toaster, toast } from 'react-hot-toast';
import { Mail, Lock, LogIn, Shield, Thermometer, Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react';
import { FaLinkedin } from "react-icons/fa"
import DeveloperFooter from "../component/developerFooter";

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // Firebase Realtime Database URL
  const FIREBASE_URL = 'https://cmrhyd-default-rtdb.asia-southeast1.firebasedatabase.app';
  const USERS_PATH = '/users.json';

  // Validate email format
  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Validate password strength
  const validatePassword = (password) => {
    if (password.length < 6) {
      return 'Password must be at least 6 characters';
    }
    return null;
  };

  // Fetch user from Firebase Realtime Database
  const authenticateUser = async (email, password) => {
    try {
      const response = await fetch(`${FIREBASE_URL}${USERS_PATH}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch user data');
      }
      
      const users = await response.json();
      
      if (!users) {
        return { success: false, message: 'No users found in database' };
      }

      // Convert object to array and find user
      const userArray = Object.entries(users).map(([key, user]) => ({
        id: key,
        ...user
      }));

      const user = userArray.find(u => 
        u.email === email && u.password === password
      );

      if (user) {
        // Store login state in localStorage if remember me is checked
        if (rememberMe) {
          localStorage.setItem('user', JSON.stringify({
            email: user.email,
            name: user.name,
            timestamp: new Date().toISOString()
          }));
        } else {
          sessionStorage.setItem('thermosafe_user', JSON.stringify({
            email: user.email,
            name: user.name,
            timestamp: new Date().toISOString()
          }));
        }

        return { 
          success: true, 
          user: {
            email: user.email,
            name: user.name,
            role: user.role || 'user'
          }
        };
      } else {
        return { success: false, message: 'Invalid email or password' };
      }
    } catch (error) {
      console.error('Authentication error:', error);
      return { 
        success: false, 
        message: 'Connection error. Please try again.' 
      };
    }
  };

  // Handle login submission
  const handleLogin = async (e) => {
    e.preventDefault();
    
    // Validate email
    if (!email.trim()) {
      toast.error('Please enter your email address', {
        icon: '📧',
        style: {
          background: '#1F2937',
          color: '#FCA5A5',
          border: '1px solid #DC2626',
        },
      });
      return;
    }

    if (!isValidEmail(email)) {
      toast.error('Please enter a valid email address', {
        icon: '⚠️',
        style: {
          background: '#1F2937',
          color: '#FCA5A5',
          border: '1px solid #DC2626',
        },
      });
      return;
    }

    // Validate password
    if (!password) {
      toast.error('Please enter your password', {
        icon: '🔒',
        style: {
          background: '#1F2937',
          color: '#FCA5A5',
          border: '1px solid #DC2626',
        },
      });
      return;
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      toast.error(passwordError, {
        icon: '⚠️',
        style: {
          background: '#1F2937',
          color: '#FCA5A5',
          border: '1px solid #DC2626',
        },
      });
      return;
    }

    setLoading(true);

    try {
      const result = await authenticateUser(email, password);
      
      if (result.success) {
        toast.success(`Welcome back, ${result.user.name}!`, {
          icon: '🎉',
          duration: 4000,
          style: {
            background: '#1F2937',
            color: '#86EFAC',
            border: '1px solid #059669',
          },
        });

        // Simulate navigation delay
        setTimeout(() => {
          // In a real app, you would navigate to the dashboard
          // For now, we'll just show a success message
          console.log('Login successful:', result.user);
          window.location.href = '/dashboard';
          
          // Show redirect message
          toast.success('Redirecting to dashboard...', {
            icon: '🚀',
          });
        }, 1500);

      } else {
        toast.error(result.message, {
          duration: 5000,
          style: {
            background: '#1F2937',
            color: '#FCA5A5',
            border: '1px solid #DC2626',
          },
        });
      }
    } catch (error) {
      toast.error('An unexpected error occurred. Please try again.', {
        duration: 5000,
        style: {
          background: '#1F2937',
          color: '#FCA5A5',
          border: '1px solid #DC2626',
        },
      });
    } finally {
      setLoading(false);
    }
  };

  // Demo credentials for testing
  const handleDemoLogin = () => {
    setEmail('admin@thermosafe.com');
    setPassword('demo123');
    toast.info('Demo credentials filled. Click Login to continue.', {
      duration: 3000,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-gray-100 overflow-hidden">
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

      {/* Background animation */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-emerald-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse delay-2000"></div>
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 py-12">
        {/* Header */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full blur opacity-30"></div>
              <div className="relative bg-gray-800 p-3 rounded-full">
                <Thermometer className="w-8 h-8 text-blue-400" />
              </div>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
              ThermoSafe
            </h1>
          </div>
          <p className="text-gray-400 text-sm sm:text-base">Secure Temperature Monitoring Dashboard</p>
          <p className="text-gray-500 text-xs sm:text-sm mt-1">Access real-time temperature data and alerts</p>
        </motion.div>

        {/* Login Card */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="w-full max-w-md"
        >
         <div className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-lg border border-gray-700/50 rounded-2xl p-6 sm:p-8 shadow-2xl">
  <div className="text-center mb-8">
    <div className="flex items-center justify-center gap-2 mb-3">
      <Shield className="w-6 h-6 text-blue-400" />
      <h2 className="text-xl sm:text-2xl font-bold text-gray-100">
        Admin Access Required
      </h2>
    </div>
    <p className="text-gray-400 text-sm">
      This dashboard is restricted. Please contact the developer for access.
    </p>
  </div>

  {/* Contact Card */}
  <div className="bg-gray-900/60 border border-gray-700/50 rounded-xl p-5 space-y-4">
    {/* Email */}
    <div className="flex items-center gap-3">
      <Mail className="w-5 h-5 text-blue-400" />
      <a
        href="mailto:devdakshtit@gcoea.ac.in"
        className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
      >
        devdakshtit@gcoea.ac.in
      </a>
    </div>

    {/* LinkedIn */}
    <div className="flex items-center gap-3">
      <FaLinkedin className="w-5 h-5 text-blue-500" />
      <a
        href="https://www.linkedin.com/in/dakshtitarmare/"
        target="_blank"
        rel="noopener noreferrer"
        className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
      >
        Connect on LinkedIn
      </a>
    </div>
  </div>

{/* Footer Developer */}
<DeveloperFooter/>


</div>
        </motion.div>

        {/* Footer */}
        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-center mt-8"
        >
          <p className="text-xs text-gray-500">
            ThermoSafe Pro v1.0 • Secure Temperature Monitoring System
          </p>
          <p className="text-xs text-gray-600 mt-1">
            Made with ❤️ for IoT Temperature Monitoring
          </p>
        </motion.footer>
      </div>
    </div>
  );
};

export default AdminLogin;