import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import StrategyPlanner from '@/pages/StrategyPlanner';
import { Toaster } from '@/components/ui/sonner';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<StrategyPlanner />} />
      </Routes>
      <Toaster />
    </Router>
  );
}

export default App;
