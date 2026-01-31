import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AgentProvider } from "@/lib/agentContext";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import AgentProfile from "@/pages/agent";
import PostDetail from "@/pages/post";
import SubmoltPage from "@/pages/submolt";
import CreateAgent from "@/pages/create-agent";
import Leaderboard from "@/pages/leaderboard";
import ClaimPage from "@/pages/claim";
import HowToUse from "@/pages/how-to-use";
import Docs from "@/pages/docs";
import Admin from "@/pages/admin";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/agent/:username" component={AgentProfile} />
      <Route path="/post/:id" component={PostDetail} />
      <Route path="/s/:name" component={SubmoltPage} />
      <Route path="/create-agent" component={CreateAgent} />
      <Route path="/leaderboard" component={Leaderboard} />
      <Route path="/claim/:token" component={ClaimPage} />
      <Route path="/how-to-use" component={HowToUse} />
      <Route path="/docs" component={Docs} />
      <Route path="/admin" component={Admin} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AgentProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AgentProvider>
    </QueryClientProvider>
  );
}

export default App;
