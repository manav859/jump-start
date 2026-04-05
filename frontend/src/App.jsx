import React, { Suspense, lazy } from "react";
import { createBrowserRouter, Navigate, RouterProvider } from "react-router-dom";
import "./index.css";
import MainLayout from "./layout/MainLayout";
import BlankLayout from "./layout/BlankLayout";
import AdminLayout from "./layout/AdminLayout";
import ProtectedRoute from "./components/ProtectedRoute";

const Home = lazy(() => import("./pages/Home"));
const Login = lazy(() => import("./pages/Login"));
const Signup = lazy(() => import("./pages/Signup"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Test = lazy(() => import("./pages/Test"));
const Pretest = lazy(() => import("./pages/Pretest"));
const PretestSections = lazy(() => import("./pages/PretestSections"));
const SectionBreak = lazy(() => import("./pages/SectionBreak"));
const BookCounselling = lazy(() => import("./pages/BookCounselling"));
const Payment = lazy(() => import("./pages/Payment"));
const PaymentConfirmation = lazy(() => import("./pages/PaymentConfirmation"));
const Careerdetail = lazy(() => import("./pages/Careerdetail"));
const Result = lazy(() => import("./pages/Result"));
const StudentReport = lazy(() => import("./pages/StudentReport"));
const Livetest = lazy(() => import("./pages/Livetest"));
const TestCompleted = lazy(() => import("./pages/TestCompleted"));
const Profile = lazy(() => import("./pages/Profile"));
const EditProfile = lazy(() => import("./pages/EditProfile"));
const TestPaused = lazy(() => import("./pages/TestPaused"));
const Admindashboard = lazy(() => import("./pages/admin/Admindashboard"));
const TestSubmissions = lazy(() => import("./pages/admin/TestSubmissions"));
const PublishedResult = lazy(() => import("./pages/admin/PublishedResult"));
const UserManagement = lazy(() => import("./pages/admin/UserManagement"));
const Payments = lazy(() => import("./pages/admin/Payments"));
const Analytics = lazy(() => import("./pages/admin/Analytics"));
const Settings = lazy(() => import("./pages/admin/Settings"));
const ReviewSubmission = lazy(() => import("./pages/admin/ReviewSubmission"));

function RouteFallback() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center px-6 text-sm font-medium text-slate-500">
      Loading page...
    </div>
  );
}

function withSuspense(element) {
  return <Suspense fallback={<RouteFallback />}>{element}</Suspense>;
}

const protectedPage = (element) =>
  withSuspense(<ProtectedRoute>{element}</ProtectedRoute>);

const router = createBrowserRouter([
  {
    path: "/",
    element: <MainLayout />,
    children: [
      { path: "/", element: withSuspense(<Home />) },
      { path: "/login", element: withSuspense(<Login />) },
      { path: "/signup", element: withSuspense(<Signup />) },
      { path: "/test", element: withSuspense(<Test />) },
      { path: "/pretest", element: protectedPage(<Pretest />) },
      { path: "/Pretest", element: protectedPage(<Pretest />) },
      {
        path: "/pretest/sections",
        element: protectedPage(<PretestSections />),
      },
      {
        path: "/Pretest/sections",
        element: protectedPage(<PretestSections />),
      },
      { path: "/bookcounselling", element: withSuspense(<BookCounselling />) },
      { path: "/payment", element: protectedPage(<Payment />) },
      {
        path: "/payment-confirmation",
        element: protectedPage(<PaymentConfirmation />),
      },
      { path: "/careerdetail", element: protectedPage(<Careerdetail />) },
      { path: "/result", element: protectedPage(<Result />) },
      {
        path: "/result/:reportId",
        element: protectedPage(<StudentReport />),
      },
      {
        path: "/test-completed",
        element: protectedPage(<TestCompleted />),
      },
      { path: "/dashboard", element: protectedPage(<Dashboard />) },
      { path: "/profile", element: protectedPage(<Profile />) },
      { path: "/profile/edit", element: protectedPage(<EditProfile />) },
    ],
  },
  {
    path: "/admin",
    element: withSuspense(
      <ProtectedRoute requiredRole="admin" unauthorizedTo="/dashboard">
        <AdminLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="dashboard" replace />,
      },
      {
        path: "dashboard",
        element: withSuspense(<Admindashboard />),
      },
      {
        path: "testsubmissions",
        element: withSuspense(<TestSubmissions />),
      },
      {
        path: "testsubmissions/:userId",
        element: withSuspense(<ReviewSubmission />),
      },
      {
        path: "publishedresults",
        element: withSuspense(<PublishedResult />),
      },
      {
        path: "usermanagement",
        element: withSuspense(<UserManagement />),
      },
      {
        path: "payments",
        element: withSuspense(<Payments />),
      },
      {
        path: "analytics",
        element: withSuspense(<Analytics />),
      },
      {
        path: "settings",
        element: withSuspense(<Settings />),
      },
    ],
  },
  {
    element: <BlankLayout />,
    children: [
      { path: "/sectionbreak", element: protectedPage(<SectionBreak />) },
      { path: "/SectionBreak", element: protectedPage(<SectionBreak />) },
      { path: "/test-paused", element: protectedPage(<TestPaused />) },
      {
        path: "/livetest/:sectionId",
        element: protectedPage(<Livetest />),
      },
    ],
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
