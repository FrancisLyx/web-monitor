import { createBrowserRouter } from 'react-router-dom';
import Dashboard from '../pages/Dashboard';
import Performance from '../pages/Performance';
import Error from '../pages/Error';

const router = createBrowserRouter([
  {
    path: '/',
    element: <Dashboard />
  },
  {
    path: '/performance',
    element: <Performance />
  },
  {
    path: '/error',
    element: <Error />
  }
]);

export default router;