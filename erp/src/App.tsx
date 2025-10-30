import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "./components/Layout";
import { AuthGuard } from "./components/AuthGuard";
import { AuthProvider } from "./hooks/useAuth";
import { RBACProvider } from "./hooks/useRBAC";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Projects from "./pages/Projects";
import Schemes from "./pages/Schemes";
import Applications from "./pages/Applications";
import UpcomingInterviews from "./pages/UpcomingInterviews";
import Donors from "./pages/Donors";
import AllDonors from "./pages/donors/AllDonors";


import AnonymousDonation from "./pages/donors/AnonymousDonation";
import DonationHistory from "./pages/donors/DonationHistory";
import Donations from "./pages/donors/Donations";
import FormBuilder from "./pages/FormBuilder";
import Budget from "./pages/Budget";
import Locations from "./pages/Locations";
import UserManagement from "./pages/UserManagement";
import RoleManagement from "./pages/RoleManagement";
import Communications from "./pages/Communications";
import Settings from "./pages/Settings";
import Auth from "./pages/Auth";
import Beneficiaries from "./pages/Beneficiaries";
import PaymentTracking from "./pages/PaymentTracking";
import BeneficiaryPayments from "./pages/BeneficiaryPayments";
import NotFound from "./pages/NotFound";
import PublicSchemes from "./pages/PublicSchemes";
import Login from "./pages/Login";
import BeneficiaryLogin from "./pages/BeneficiaryLogin";
import BeneficiaryDashboard from "./pages/BeneficiaryDashboard";
import BeneficiarySchemes from "./pages/BeneficiarySchemes";
import BeneficiaryApplication from "./pages/BeneficiaryApplication";
import BeneficiaryAuthGuard from "./components/BeneficiaryAuthGuard";
import ApplicationTracking from "./pages/ApplicationTracking";
import DebugPermissions from "./pages/DebugPermissions";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <RBACProvider>
            <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/login" element={<Login />} />
            <Route path="/beneficiary-login" element={<BeneficiaryLogin />} />
            <Route path="/public-schemes" element={<PublicSchemes />} />

            {/* Beneficiary Routes */}
            <Route path="/beneficiary/dashboard" element={<BeneficiaryAuthGuard><BeneficiaryDashboard /></BeneficiaryAuthGuard>} />
            <Route path="/beneficiary/schemes" element={<BeneficiaryAuthGuard><BeneficiarySchemes /></BeneficiaryAuthGuard>} />
            <Route path="/beneficiary/apply/:schemeId" element={<BeneficiaryAuthGuard><BeneficiaryApplication /></BeneficiaryAuthGuard>} />
            <Route path="/beneficiary/track/:id" element={<BeneficiaryAuthGuard><ApplicationTracking /></BeneficiaryAuthGuard>} />

            {/* Admin Routes - Protected */}
            <Route path="/dashboard" element={<AuthGuard><Layout><Dashboard /></Layout></AuthGuard>} />
            <Route path="/projects" element={<AuthGuard><Layout><Projects /></Layout></AuthGuard>} />
            <Route path="/schemes" element={<AuthGuard><Layout><Schemes /></Layout></AuthGuard>} />
            <Route path="/applications" element={<AuthGuard><Layout><Applications /></Layout></AuthGuard>} />
            <Route path="/upcoming-interviews" element={<AuthGuard><Layout><UpcomingInterviews /></Layout></AuthGuard>} />
            <Route path="/beneficiaries" element={<AuthGuard><Layout><Beneficiaries /></Layout></AuthGuard>} />
            <Route path="/payment-distribution" element={<AuthGuard><Layout><BeneficiaryPayments /></Layout></AuthGuard>} />
            <Route path="/payment-tracking" element={<AuthGuard><Layout><PaymentTracking /></Layout></AuthGuard>} />
            {/* Donor Routes */}
            <Route path="/donors" element={<AuthGuard><Layout><Donors /></Layout></AuthGuard>} />
            <Route path="/donors/all" element={<AuthGuard><Layout><AllDonors /></Layout></AuthGuard>} />
            <Route path="/donors/donations" element={<AuthGuard><Layout><Donations /></Layout></AuthGuard>} />
            <Route path="/donors/history" element={<AuthGuard><Layout><DonationHistory /></Layout></AuthGuard>} />
            <Route path="/form-builder" element={<AuthGuard><Layout><FormBuilder /></Layout></AuthGuard>} />
            <Route path="/budget" element={<AuthGuard><Layout><Budget /></Layout></AuthGuard>} />
            <Route path="/locations" element={<AuthGuard><Layout><Locations /></Layout></AuthGuard>} />
            <Route path="/users" element={<AuthGuard><Layout><UserManagement /></Layout></AuthGuard>} />
            <Route path="/roles" element={<AuthGuard><Layout><RoleManagement /></Layout></AuthGuard>} />
            <Route path="/communications" element={<AuthGuard><Layout><Communications /></Layout></AuthGuard>} />
            <Route path="/settings" element={<AuthGuard><Layout><Settings /></Layout></AuthGuard>} />
            <Route path="/debug-permissions" element={<AuthGuard><Layout><DebugPermissions /></Layout></AuthGuard>} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
            </Routes>
          </RBACProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
