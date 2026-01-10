import React, { useState, useEffect } from "react";
import {
  Users,
  Package,
  Activity,
  BarChart3,
  AlertCircle,
  CheckCircle,
  Plus,
  Edit,
  Trash2,
  Eye,
  Mail,
  UserPlus,
  Download,
  Phone,
  Key,
  RefreshCw,
  BarChart as BarChartIcon,
} from "lucide-react";
import { LogOut } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  ReferenceLine,
  AreaChart,
  Area,
  PieChart,
  Pie,
} from "recharts";
import { toast, Toaster } from "react-hot-toast";
import { ref, set, push, onValue, remove, update } from "firebase/database";
import { database } from "../config/firebaseConfig";
import { useNavigate } from "react-router-dom";
const AdminDashboard = () => {
  // States
  const [containers, setContainers] = useState([]);
  const [customers, setCustomers] = useState(0);
  const [totalContainers, setTotalContainers] = useState(0);
  const [activeContainers, setActiveContainers] = useState(0);
  const [alertsToday, setAlertsToday] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const navigate = useNavigate();

  const [newContainer, setNewContainer] = useState({
    id: "",
    customerEmail: "",
    customerPhone: "",
    customerName: "",
    temperatureRange: { min: 2, max: 8 },
  });

  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedContainer, setSelectedContainer] = useState(null);
  const [showUsersModal, setShowUsersModal] = useState(false);

  // Fetch containers and users from Firebase on component mount
  useEffect(() => {
    fetchContainers();
    fetchUsers();
  }, []);
  const handleLogout = () => {
    // Clear any stored authentication data if needed
    localStorage.removeItem("thermosafe_user");
    sessionStorage.removeItem("thermosafe_user");

    // Optional: Show confirmation toast
    toast.success("Logged out successfully");

    // Navigate to home page
    navigate("/");
  };
  // Fetch all containers from Firebase
  const fetchContainers = () => {
    try {
      setLoading(true);
      const containersRef = ref(database, "containers");

      const unsubscribe = onValue(containersRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          // Convert Firebase object to array
          const containersArray = Object.entries(data).map(
            ([key, container]) => ({
              firebaseKey: key,
              ...container,
            })
          );

          // Sort by creation date (newest first)
          containersArray.sort(
            (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
          );

          setContainers(containersArray);
          calculateStats(containersArray);
        } else {
          setContainers([]);
          resetStats();
        }
        setLoading(false);
      });

      return unsubscribe;
    } catch (error) {
      console.error("Error fetching containers:", error);
      toast.error("Failed to load containers");
      setLoading(false);
    }
  };

  // Fetch all users from Firebase
  const fetchUsers = () => {
    try {
      const usersRef = ref(database, "users");

      onValue(usersRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const usersArray = Object.entries(data).map(([key, user]) => ({
            firebaseKey: key,
            ...user,
          }));
          setUsers(usersArray);
        } else {
          setUsers([]);
        }
      });
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  // Calculate statistics
  const calculateStats = (containersArray) => {
    setTotalContainers(containersArray.length);
    setActiveContainers(
      containersArray.filter((c) => c.status === "active").length
    );
    setAlertsToday(
      containersArray.reduce((sum, c) => sum + (c.alerts || 0), 0)
    );

    // Get unique customers
    const uniqueEmails = [
      ...new Set(
        containersArray
          .filter((c) => c.customerEmail)
          .map((c) => c.customerEmail.toLowerCase())
      ),
    ];
    setCustomers(uniqueEmails.length);
  };

  // Reset statistics
  const resetStats = () => {
    setTotalContainers(0);
    setActiveContainers(0);
    setAlertsToday(0);
    setCustomers(0);
  };

  // Sanitize email for Firebase key
  const sanitizeEmail = (email) => {
    return email
      .toLowerCase()
      .replace(/@/g, "_at_")
      .replace(/\./g, "_dot_")
      .replace(/[^a-zA-Z0-9_]/g, "_");
  };

  // Generate password as per requirement: customerName + "@123"
  const generatePassword = (customerName) => {
    if (!customerName || customerName.trim() === "") {
      return "User@123";
    }
    // Take first word of the name and capitalize first letter
    const firstName = customerName.trim().split(" ")[0];
    const capitalizedName =
      firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();
    return `${capitalizedName}@123`;
  };

  // Send email notification (stub function for backend integration)
  // Send email notification - FIXED VERSION
const sendEmailNotification = async (email, customerName, containerId, password) => {
  try {
    const subject = `Welcome to ThermoSafe - Your Container ${containerId} is Ready!`;
    const message = `
Dear ${customerName},

Your ThermoSafe container (ID: ${containerId}) has been successfully registered.


Dashboard: https://cmrhyd.up.railway.app/login


Email: ${email}
Password: ${password}

You can monitor your container's temperature in real-time on the dashboard.

For support, please contact us.

Best regards,
ThermoSafe Team
`;

    console.log("📧 Sending email to:", email);
    console.log("📝 Subject:", subject);
    console.log("🌐 Backend URL:", 'https://c-mrbackend.vercel.app/send-email');

    // Call backend API with correct parameter names
    const response = await fetch('https://c-mrbackend.vercel.app/send-email', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        to: email, 
        subject: subject, 
        message: message // Changed from 'body' to 'message'
      })
    });

    const result = await response.json();
    
    if (result.success) {
      console.log("✅ Email sent successfully:", result.msg);
      toast.success(`Email sent to ${email}`);
      return true;
    } else {
      console.error("❌ Email sending failed:", result.msg);
      toast.error(`Failed to send email: ${result.msg}`);
      return false;
    }
  } catch (error) {
    console.error("❌ Error sending email:", error);
    toast.error(`Error: ${error.message}`);
    return false;
  }
};
// Test email sending function
const testEmailSending = async () => {
  try {
    // Show loading toast
    toast.loading('Sending test email...', { id: 'test-email' });
    
    const testData = {
      email: 'devdakshtit@gcoea.ac.in',
      customerName: 'Test',
      containerId: 'TS-TEST-001',
      password: 'Test@123'
    };

    console.log('🧪 Testing email sending functionality...');
    
    const result = await sendEmailNotification(
      testData.email,
      testData.customerName,
      testData.containerId,
      testData.password
    );

    toast.dismiss('test-email');
    
    if (result) {
      toast.success('Test email sent successfully! Check console for details.', {
        duration: 5000
      });
    }
  } catch (error) {
    toast.dismiss('test-email');
    console.error('Test email error:', error);
    toast.error(`Test failed: ${error.message}`);
  }
};
  // Add new container to Firebase
  const addContainer = async () => {
    try {
      // Validate inputs
      const validationErrors = [];
      if (!newContainer.id.trim()) validationErrors.push("Container ID");
      if (!newContainer.customerEmail.trim())
        validationErrors.push("Customer Email");
      if (!newContainer.customerPhone.trim())
        validationErrors.push("Customer Phone");
      if (!newContainer.customerName.trim())
        validationErrors.push("Customer Name");

      if (validationErrors.length > 0) {
        toast.error(`Please fill in: ${validationErrors.join(", ")}`);
        return;
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(newContainer.customerEmail)) {
        toast.error("Please enter a valid email address");
        return;
      }

      // Check if container ID already exists
      const existingContainer = containers.find(
        (c) => c.id === newContainer.id
      );
      if (existingContainer) {
        toast.error("Container ID already exists. Please use a different ID.");
        return;
      }

      // Generate password as per requirement
      const userPassword = generatePassword(newContainer.customerName);

      // Prepare container data
      const containerData = {
        id: newContainer.id,
        customerEmail: newContainer.customerEmail.toLowerCase(),
        customerPhone: newContainer.customerPhone,
        customerName: newContainer.customerName,
        status: "active",
        alerts: 0,
        uptime: "100%",
        lastUpdate: new Date().toLocaleString(),
        createdAt: new Date().toISOString(),
        isActive: true,
        temperatureRange: newContainer.temperatureRange || { min: 2, max: 8 },
      };

      // Add container to Firebase with a unique key
      const newContainerRef = push(ref(database, "containers"));
      await set(newContainerRef, containerData);

      // Create user account with generated password
      await createUserAccount(
        newContainer.customerEmail.toLowerCase(),
        newContainer.customerPhone,
        newContainer.customerName,
        newContainer.id,
        userPassword
      );

      // Prepare email notification
      await sendEmailNotification(
        newContainer.customerEmail.toLowerCase(),
        newContainer.customerName,
        newContainer.id,
        userPassword
      );

      // Show success message
      toast.success(
        <div className="p-2">
          <p className="font-bold text-green-700">
            Container {newContainer.id} added successfully!
          </p>
          <p className="text-sm mt-1">
            User account created for {newContainer.customerEmail}
          </p>
          <p className="text-sm">
            Password:{" "}
            <span className="font-mono bg-yellow-100 px-2 py-1 rounded">
              {userPassword}
            </span>
          </p>
        </div>,
        { duration: 8000 }
      );

      // Reset form
      setNewContainer({
        id: "",
        customerEmail: "",
        customerPhone: "",
        customerName: "",
        temperatureRange: { min: 2, max: 8 },
      });
      setShowAddModal(false);
    } catch (error) {
      console.error("Error adding container:", error);
      toast.error(`Failed to add container: ${error.message}`);
    }
  };

  // Create user account in Firebase
  const createUserAccount = async (
    email,
    phone,
    name,
    containerId,
    password
  ) => {
    try {
      const sanitizedEmail = sanitizeEmail(email);

      const userData = {
        email: email,
        phone: phone,
        name: name,
        password: password, // Using the generated password
        role: "user",
        containerId: containerId,
        createdAt: new Date().toISOString(),
        isActive: true,
        lastLogin: null,
      };

      // Store user under users/{sanitizedEmail}
      const userRef = ref(database, `users/${sanitizedEmail}`);
      await set(userRef, userData);

      console.log("User created in Firebase:", {
        email: email,
        password: password,
        containerId: containerId,
        firebasePath: `users/${sanitizedEmail}`,
      });
    } catch (error) {
      console.error("Error creating user:", error);
      throw error; // Re-throw to handle in parent function
    }
  };

  // Delete container from Firebase
  const deleteContainer = async (containerId, firebaseKey) => {
    if (
      !window.confirm(
        `Are you sure you want to delete container ${containerId}? This action cannot be undone.`
      )
    ) {
      return;
    }

    try {
      // Delete the container
      const containerRef = ref(database, `containers/${firebaseKey}`);
      await remove(containerRef);

      toast.success(`Container ${containerId} deleted successfully`);

      // Refresh the containers list
      fetchContainers();
    } catch (error) {
      console.error("Error deleting container:", error);
      toast.error("Failed to delete container");
    }
  };

  // Update container status
  const updateContainerStatus = async (firebaseKey, newStatus) => {
    try {
      const containerRef = ref(database, `containers/${firebaseKey}/status`);
      await set(containerRef, newStatus);

      toast.success(`Container status updated to ${newStatus}`);
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Failed to update status");
    }
  };

  // Reset user password
  const resetUserPassword = async (email, customerName) => {
    try {
      const sanitizedEmail = sanitizeEmail(email);
      const newPassword = generatePassword(customerName);

      const userRef = ref(database, `users/${sanitizedEmail}/password`);
      await set(userRef, newPassword);

      // Send email notification for password reset
      await sendEmailNotification(
        email,
        customerName,
        "Password Reset",
        newPassword
      );

      toast.success(
        <div className="p-2">
          <p className="font-bold">🔑 Password Reset</p>
          <p className="text-sm mt-1">New password for {email}:</p>
          <p className="font-mono bg-green-100 px-3 py-2 rounded-lg mt-2 text-center">
            {newPassword}
          </p>
          <p className="text-xs text-gray-600 mt-1">
            Email notification sent to user
          </p>
        </div>,
        { duration: 8000 }
      );
    } catch (error) {
      console.error("Error resetting password:", error);
      toast.error("Failed to reset password");
    }
  };

  // Delete user account
  const deleteUserAccount = async (email) => {
    if (
      !window.confirm(
        `Are you sure you want to delete user account for ${email}?`
      )
    ) {
      return;
    }

    try {
      const sanitizedEmail = sanitizeEmail(email);
      const userRef = ref(database, `users/${sanitizedEmail}`);
      await remove(userRef);

      toast.success(`User account for ${email} deleted successfully`);
      fetchUsers();
    } catch (error) {
      console.error("Error deleting user:", error);
      toast.error("Failed to delete user account");
    }
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "active":
        return "bg-green-100 text-green-800 border-green-200";
      case "warning":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "critical":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  // Prepare analytics data
  const getAnalyticsData = () => {
    if (containers.length === 0) {
      return Array.from({ length: 8 }, (_, i) => ({
        time: `${i * 3}:00`,
        internal: Math.random() * 6 + 2,
        external: Math.random() * 10 + 25,
      }));
    }

    return containers.slice(0, 8).map((container, index) => ({
      name: container.id,
      uptime: parseFloat(container.uptime) || 100,
      alerts: container.alerts || 0,
    }));
  };

  // Prepare status data for pie chart
  const getStatusData = () => {
    const statusCount = {
      active: 0,
      warning: 0,
      critical: 0,
      inactive: 0,
    };

    containers.forEach((container) => {
      const status = container.status?.toLowerCase() || "inactive";
      statusCount[status] = (statusCount[status] || 0) + 1;
    });

    return [
      { name: "Active", value: statusCount.active, color: "#10B981" },
      { name: "Warning", value: statusCount.warning, color: "#F59E0B" },
      { name: "Critical", value: statusCount.critical, color: "#EF4444" },
      { name: "Inactive", value: statusCount.inactive, color: "#6B7280" },
    ].filter((item) => item.value > 0);
  };

  // Stats data
  const statsData = [
    {
      name: "Total Containers",
      value: totalContainers,
      icon: Package,
      color: "text-blue-600",
      bgColor: "from-blue-50 to-indigo-50",
    },
    {
      name: "Active",
      value: activeContainers,
      icon: CheckCircle,
      color: "text-green-600",
      bgColor: "from-green-50 to-emerald-50",
    },
    {
      name: "Customers",
      value: customers,
      icon: Users,
      color: "text-purple-600",
      bgColor: "from-purple-50 to-violet-50",
    },
    {
      name: "Total Users",
      value: users.length,
      icon: UserPlus,
      color: "text-pink-600",
      bgColor: "from-pink-50 to-rose-50",
    },
  ];

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: "#1F2937",
            color: "#F3F4F6",
            border: "1px solid #374151",
            borderRadius: "0.75rem",
            padding: "16px",
            maxWidth: "500px",
          },
        }}
      />

      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                ThermoSafe Admin Dashboard
              </h1>
              <p className="text-gray-600 text-sm sm:text-base mt-1">
                Manage containers, users, and monitor temperature data
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setShowUsersModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all font-medium"
              >
                <Users className="w-4 h-4" />
                <span className="hidden sm:inline">View Users</span>
                <span className="sm:hidden">Users</span>
              </button>
              <button
                onClick={fetchContainers}
                disabled={statsLoading}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all font-medium disabled:opacity-50"
              >
                <RefreshCw
                  className={`w-4 h-4 ${statsLoading ? "animate-spin" : ""}`}
                />
                <span className="hidden sm:inline">Refresh</span>
              </button>
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 sm:px-6 py-2.5 rounded-lg hover:bg-blue-700 transition-all font-medium shadow-md"
              >
                <Plus className="w-5 h-5" />
                <span className="hidden sm:inline">Add Container</span>
                <span className="sm:hidden">Add</span>
              </button>
                {/* ADD TEST EMAIL BUTTON HERE */}
  {/* <button
    onClick={testEmailSending}
    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all font-medium"
  >
    <Mail className="w-4 h-4" />
    <span className="hidden sm:inline">Test Email</span>
    <span className="sm:hidden">Test Email</span>
  </button> */}
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all font-medium"
              >
                <LogOut className="w-4 h-4" />{" "}
                {/* Add LogOut import from lucide-react */}
                <span className="hidden sm:inline">Logout</span>
                <span className="sm:hidden">Logout</span>
              </button>
             
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          {statsData.map((stat, idx) => (
            <div
              key={idx}
              className="bg-white rounded-xl shadow-lg p-4 sm:p-6 hover:shadow-xl transition-all border hover:border-blue-200"
            >
              <div className="flex items-center justify-between">
                <div
                  className={`p-3 rounded-xl bg-gradient-to-r ${stat.bgColor}`}
                >
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
                <div className="text-right">
                  <p className="text-2xl sm:text-3xl font-bold text-gray-900">
                    {stat.value}
                  </p>
                  <p className="text-sm text-gray-600">{stat.name}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
          {/* Containers Table */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="p-4 sm:p-6 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Package className="w-6 h-6 text-blue-600" />
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                    Containers
                  </h2>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">
                    {containers.length} containers
                  </span>
                  <span
                    className={`w-2 h-2 rounded-full ${
                      loading ? "bg-yellow-500 animate-pulse" : "bg-green-500"
                    }`}
                  ></span>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="p-8 text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="mt-2 text-gray-600">Loading containers...</p>
              </div>
            ) : containers.length === 0 ? (
              <div className="p-8 text-center">
                <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No containers found</p>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="mt-4 text-blue-600 hover:text-blue-800 font-medium"
                >
                  Add your first container
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Container
                      </th>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Customer
                      </th>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {containers.slice(0, 10).map((container) => (
                      <tr
                        key={container.firebaseKey}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                              <Package className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                            </div>
                            <div>
                              <div className="text-sm font-semibold text-gray-900">
                                {container.id}
                              </div>
                              <div className="text-xs text-gray-400 mt-1">
                                {formatDate(container.createdAt)}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 sm:px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">
                            {container.customerName || "N/A"}
                          </div>
                          <div className="text-xs text-gray-500 truncate max-w-[150px]">
                            {container.customerEmail}
                          </div>
                          <div className="text-xs text-gray-400">
                            {container.customerPhone}
                          </div>
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-col gap-1">
                            <span
                              className={`inline-flex px-2 sm:px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(
                                container.status
                              )}`}
                            >
                              {container.status?.toUpperCase() || "INACTIVE"}
                            </span>
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <span>Uptime: {container.uptime || "N/A"}</span>
                              <span>•</span>
                              <span>Alerts: {container.alerts || 0}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end gap-1 sm:gap-2">
                            <button
                              onClick={() => setSelectedContainer(container)}
                              className="text-blue-600 hover:text-blue-900 p-1.5 hover:bg-blue-50 rounded-lg transition-colors"
                              title="View Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() =>
                                updateContainerStatus(
                                  container.firebaseKey,
                                  "active"
                                )
                              }
                              className="text-green-600 hover:text-green-900 p-1.5 hover:bg-green-50 rounded-lg transition-colors"
                              title="Set Active"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() =>
                                resetUserPassword(
                                  container.customerEmail,
                                  container.customerName
                                )
                              }
                              className="text-purple-600 hover:text-purple-900 p-1.5 hover:bg-purple-50 rounded-lg transition-colors"
                              title="Reset Password"
                            >
                              <Key className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() =>
                                deleteContainer(
                                  container.id,
                                  container.firebaseKey
                                )
                              }
                              className="text-red-600 hover:text-red-900 p-1.5 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Analytics Sidebar */}
          <div className="space-y-6">
            {/* Status Distribution */}
            <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <BarChartIcon className="w-5 h-5 text-blue-600" />
                Status Distribution
              </h3>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={getStatusData()}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) =>
                        `${name}: ${(percent * 100).toFixed(0)}%`
                      }
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {getStatusData().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Temperature Overview */}
            <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">
                Temperature Overview
              </h3>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={getAnalyticsData()}>
                  <defs>
                    <linearGradient
                      id="tempGradient"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="time" fontSize={10} />
                  <YAxis fontSize={10} />
                  <Tooltip />
                  <ReferenceLine
                    y={2}
                    stroke="#EF4444"
                    strokeDasharray="3 3"
                    strokeWidth={1}
                  />
                  <ReferenceLine
                    y={8}
                    stroke="#EF4444"
                    strokeDasharray="3 3"
                    strokeWidth={1}
                  />
                  <Area
                    type="monotone"
                    dataKey="internal"
                    stroke="#3B82F6"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#tempGradient)"
                    name="Internal Temp"
                  />
                  <Line
                    type="monotone"
                    dataKey="external"
                    stroke="#F59E0B"
                    strokeWidth={2}
                    dot={false}
                    name="External Temp"
                  />
                </AreaChart>
              </ResponsiveContainer>
              <div className="flex items-center justify-center gap-4 mt-4 text-xs text-gray-600">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span>Internal</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
                  <span>External</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span>Safe Range</span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">
                Quick Actions
              </h3>
              <div className="space-y-3">
                <button
                  onClick={() => setShowAddModal(true)}
                  className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  <Plus className="w-4 h-4" />
                  Add New Container
                </button>
                <button
                  onClick={() => setShowUsersModal(true)}
                  className="w-full flex items-center justify-center gap-2 bg-purple-600 text-white py-3 px-4 rounded-lg hover:bg-purple-700 transition-colors font-medium"
                >
                  <Users className="w-4 h-4" />
                  View All Users
                </button>
                <button
                  onClick={fetchContainers}
                  className="w-full flex items-center justify-center gap-2 bg-gray-100 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                >
                  <RefreshCw className="w-4 h-4" />
                  Refresh Data
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Container Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-white border-b px-4 sm:px-6 py-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                  Add New Container
                </h2>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  <svg
                    className="w-6 h-6 text-gray-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                addContainer();
              }}
              className="p-4 sm:p-6 space-y-6"
            >
              <div className="space-y-1">
                <label className="block text-sm font-semibold text-gray-700">
                  Container ID <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newContainer.id}
                  onChange={(e) =>
                    setNewContainer({
                      ...newContainer,
                      id: e.target.value.toUpperCase(),
                    })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="TS-001"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-semibold text-gray-700">
                  Customer Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newContainer.customerName}
                  onChange={(e) =>
                    setNewContainer({
                      ...newContainer,
                      customerName: e.target.value,
                    })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="John Doe"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-semibold text-gray-700">
                  Customer Email <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2 items-center">
                  <input
                    type="email"
                    value={newContainer.customerEmail}
                    onChange={(e) =>
                      setNewContainer({
                        ...newContainer,
                        customerEmail: e.target.value,
                      })
                    }
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="customer@example.com"
                    required
                  />
                  <Mail className="w-5 h-5 text-gray-400" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-semibold text-gray-700">
                  Customer Phone <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2 items-center">
                  <input
                    type="tel"
                    value={newContainer.customerPhone}
                    onChange={(e) =>
                      setNewContainer({
                        ...newContainer,
                        customerPhone: e.target.value,
                      })
                    }
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="+91 9876543210"
                    required
                  />
                  <Phone className="w-5 h-5 text-gray-400" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-sm font-semibold text-gray-700">
                    Min Temp (°C)
                  </label>
                  <input
                    type="number"
                    value={newContainer.temperatureRange.min}
                    onChange={(e) =>
                      setNewContainer({
                        ...newContainer,
                        temperatureRange: {
                          ...newContainer.temperatureRange,
                          min: parseInt(e.target.value) || 2,
                        },
                      })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="-20"
                    max="20"
                    step="0.5"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-sm font-semibold text-gray-700">
                    Max Temp (°C)
                  </label>
                  <input
                    type="number"
                    value={newContainer.temperatureRange.max}
                    onChange={(e) =>
                      setNewContainer({
                        ...newContainer,
                        temperatureRange: {
                          ...newContainer.temperatureRange,
                          max: parseInt(e.target.value) || 8,
                        },
                      })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="0"
                    max="30"
                    step="0.5"
                  />
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <Key className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-blue-800 font-medium">
                      Password Rule:
                    </p>
                    <p className="text-xs text-blue-700 mt-1">
                      Password will be automatically generated as:{" "}
                      <span className="font-mono">CustomerName@123</span>
                    </p>
                    <p className="text-xs text-blue-700 mt-2">
                      Email notification will be sent to the customer with login
                      credentials.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <button
                  type="submit"
                  disabled={
                    !newContainer.id ||
                    !newContainer.customerName ||
                    !newContainer.customerEmail ||
                    !newContainer.customerPhone
                  }
                  className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-6 rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transition-all"
                >
                  Create Container
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all font-medium"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Users Modal */}
      {showUsersModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-white border-b px-6 py-4">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">
                  User Accounts ({users.length})
                </h2>
                <button
                  onClick={() => setShowUsersModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-xl"
                >
                  <svg
                    className="w-6 h-6 text-gray-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6">
              {users.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No user accounts found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Email
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Phone
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Container
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Password
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {users.map((user) => (
                        <tr key={user.firebaseKey} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {user.name}
                            </div>
                            <div className="text-xs text-gray-500 capitalize">
                              {user.role}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {user.email}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {user.phone}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {user.containerId}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                              {user.password}
                            </code>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() =>
                                  resetUserPassword(user.email, user.name)
                                }
                                className="text-blue-600 hover:text-blue-900"
                              >
                                Reset Password
                              </button>
                              <button
                                onClick={() => deleteUserAccount(user.email)}
                                className="text-red-600 hover:text-red-900 ml-4"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Container Details Modal */}
      {selectedContainer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-white border-b px-6 py-4">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">
                  Container Details
                </h2>
                <button
                  onClick={() => setSelectedContainer(null)}
                  className="p-2 hover:bg-gray-100 rounded-xl"
                >
                  <svg
                    className="w-6 h-6 text-gray-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Container ID</p>
                  <p className="font-semibold text-lg">
                    {selectedContainer.id}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <span
                    className={`inline-flex px-3 py-1 rounded-full text-sm font-semibold border ${getStatusColor(
                      selectedContainer.status
                    )}`}
                  >
                    {selectedContainer.status?.toUpperCase()}
                  </span>
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-500 mb-2">
                  Customer Information
                </p>
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <span className="text-sm">
                      {selectedContainer.customerEmail}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span className="text-sm">
                      {selectedContainer.customerPhone}
                    </span>
                  </div>
                  {selectedContainer.customerName && (
                    <div>
                      <span className="text-sm text-gray-600">Name:</span>
                      <span className="text-sm font-medium ml-2">
                        {selectedContainer.customerName}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-500 mb-2">Container Stats</p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-50 rounded-lg p-3 text-center">
                    <p className="text-xs text-gray-600">Uptime</p>
                    <p className="text-lg font-bold text-blue-600">
                      {selectedContainer.uptime || "N/A"}
                    </p>
                  </div>
                  <div className="bg-red-50 rounded-lg p-3 text-center">
                    <p className="text-xs text-gray-600">Alerts</p>
                    <p className="text-lg font-bold text-red-600">
                      {selectedContainer.alerts || 0}
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t space-y-3">
                <button
                  onClick={() => {
                    resetUserPassword(
                      selectedContainer.customerEmail,
                      selectedContainer.customerName
                    );
                    setSelectedContainer(null);
                  }}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-xl font-semibold hover:from-purple-700 hover:to-pink-700 transition-all"
                >
                  Reset User Password
                </button>
                <button
                  onClick={() => {
                    setSelectedContainer(null);
                    setShowAddModal(true);
                  }}
                  className="w-full border border-blue-600 text-blue-600 py-3 rounded-xl font-semibold hover:bg-blue-50 transition-all"
                >
                  Duplicate Container
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
