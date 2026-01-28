import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { HospitalProvider } from "@/context/HospitalContext";
import { DashboardLayout } from "@/components/layout/DashboardLayout";

// Pages
import Landing from "@/pages/Landing";
import Login from "@/pages/Login";
import NotFound from "@/pages/NotFound";

// Admin Pages
import AdminDashboard from "@/pages/admin/Dashboard";
import Patients from "@/pages/admin/Patients";
import Visits from "@/pages/admin/Visits";
import Doctors from "@/pages/admin/Doctors";
import AdminCSVUpload from "@/pages/admin/CSVUpload";

// Doctor Pages
import DoctorDashboard from "@/pages/doctor/Dashboard";
import MyVisits from "@/pages/doctor/MyVisits";
import Prescriptions from "@/pages/doctor/Prescriptions";
import DoctorCSVUpload from "@/pages/doctor/DoctorCSVUpload";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <HospitalProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Landing />} />
            <Route path="/login/:portal" element={<Login />} />

            {/* Admin Routes */}
            <Route path="/admin" element={<DashboardLayout requiredRole="admin" />}>
              <Route index element={<AdminDashboard />} />
              <Route path="patients" element={<Patients />} />
              <Route path="visits" element={<Visits />} />
              <Route path="doctors" element={<Doctors />} />
              <Route path="upload" element={<AdminCSVUpload />} />
            </Route>

            {/* Doctor Routes */}
            <Route path="/doctor" element={<DashboardLayout requiredRole="doctor" />}>
              <Route index element={<DoctorDashboard />} />
              <Route path="visits" element={<MyVisits />} />
              <Route path="prescriptions" element={<Prescriptions />} />
              <Route path="upload" element={<DoctorCSVUpload />} />
            </Route>

            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </HospitalProvider>
  </QueryClientProvider>
);

export default App;
