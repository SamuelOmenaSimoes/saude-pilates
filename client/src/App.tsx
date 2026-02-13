import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { RequireAuth } from "./components/RequireAuth";
import Home from "./pages/Home";
import About from "./pages/About";
import Plans from "./pages/Plans";
import Contact from "./pages/Contact";
import TrialClass from "./pages/TrialClass";
import SingleClass from "./pages/SingleClass";
import BookClass from "./pages/BookClass";
import Dashboard from "./pages/Dashboard";
import MyAppointments from "./pages/MyAppointments";
import Profile from "./pages/Profile";
import Admin from "./pages/Admin";
import MyPlan from "./pages/MyPlan";
import Success from "./pages/Success";

import CompleteProfile from "./pages/CompleteProfile";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/about"} component={About} />
      <Route path={"/plans"} component={Plans} />
      <Route path={"/contact"} component={Contact} />
      <Route path={"/login"} component={Login} />
      <Route path={"/register"} component={Register} />
      <Route path={"/forgot-password"} component={ForgotPassword} />
      <Route path={"/reset-password/:token"} component={ResetPassword} />
      <Route path={"/success"} component={Success} />
      
  <Route
  path="/trial-class"
  component={() => (
    <RequireAuth>
      <TrialClass />
    </RequireAuth>
  )}
/>

<Route
  path="/single-class"
  component={() => (
    <RequireAuth>
      <SingleClass />
    </RequireAuth>
  )}
/>

<Route
  path="/book-class"
  component={() => (
    <RequireAuth>
      <BookClass />
    </RequireAuth>
  )}
/>

<Route
  path="/dashboard"
  component={() => (
    <RequireAuth>
      <Dashboard />
    </RequireAuth>
  )}
/>

<Route
  path="/my-appointments"
  component={() => (
    <RequireAuth>
      <MyAppointments />
    </RequireAuth>
  )}
/>

<Route
  path="/my-plan"
  component={() => (
    <RequireAuth>
      <MyPlan />
    </RequireAuth>
  )}
/>

<Route
  path="/profile"
  component={() => (
    <RequireAuth>
      <Profile />
    </RequireAuth>
  )}
/>

<Route
  path="/complete-profile"
  component={() => (
    <RequireAuth>
      <CompleteProfile />
    </RequireAuth>
  )}
/>

      <Route
  path="/admin"
  component={() => (
    <RequireAuth requireAdmin>
      <Admin />
    </RequireAuth>
  )}
/>

      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
        // switchable
      >
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
