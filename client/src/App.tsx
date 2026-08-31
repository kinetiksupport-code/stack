import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Login from "./pages/Login";
import NewProject from "./pages/NewProject";
import Conversations from "./pages/Conversations";
import Publish from "./pages/Publish";
import Settings from "./pages/Settings";
import Support from "./pages/Support";
import Workspace from "./pages/Workspace";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/login" component={Login} />
      <Route path="/workspace" component={Workspace} />
      <Route path="/workspace/new" component={NewProject} />
      <Route path="/workspace/conversations" component={Conversations} />
      <Route path="/workspace/settings" component={Settings} />
      <Route path="/workspace/support" component={Support} />
      <Route path="/publish" component={Publish} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster theme="light" />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
