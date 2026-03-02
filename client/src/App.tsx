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
  return (
    <Switch>
      {/* Rotas Públicas */}
      <Route path="/" component={Home} />
      <Route path="/about" component={About} />
      <Route path="/plans" component={Plans} />
      <Route path="/contact" component={Contact} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/forgot-password" component={ForgotPassword} />
      <Route path="/reset-password/:token" component={ResetPassword} />
      <Route path="/success" component={Success} />
      
      {/* Rotas Protegidas (Requer Login) */}
      <Route path="/trial-class">
        <RequireAuth><TrialClass /></RequireAuth>
      </Route>
      <Route path="/single-class">
        <RequireAuth><SingleClass /></RequireAuth>
      </Route>
      <Route path="/book-class">
        <RequireAuth><BookClass /></RequireAuth>
      </Route>
      <Route path="/dashboard">
        <RequireAuth><Dashboard /></RequireAuth>
      </Route>
      <Route path="/my-appointments">
        <RequireAuth><MyAppointments /></RequireAuth>
      </Route>
      <Route path="/my-plan">
        <RequireAuth><MyPlan /></RequireAuth>
      </Route>
      <Route path="/profile">
        <RequireAuth><Profile /></RequireAuth>
      </Route>
      <Route path="/complete-profile">
        <RequireAuth><CompleteProfile /></RequireAuth>
      </Route>

      {/* Rota de Admin (Requer ser Administrador) */}
      <Route path="/admin">
        <RequireAuth requireAdmin><Admin /></RequireAuth>
      </Route>

      {/* Página 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
