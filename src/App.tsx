/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { Layout } from './components/Layout';
import { LandingPage } from './pages/LandingPage';
import { DashboardPage } from './pages/DashboardPage';
import { ReportIssuePage } from './pages/ReportIssuePage';
import { MapViewPage } from './pages/MapViewPage';
import { CityTimelinePage } from './pages/CityTimelinePage';
import { AIAnalystPage } from './pages/AIAnalystPage';
import { AIInsightsPage } from './pages/AIInsightsPage';
import { MunicipalReportPage } from './pages/MunicipalReportPage';

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/report" element={<ReportIssuePage />} />
            <Route path="/map" element={<MapViewPage />} />
            <Route path="/timeline" element={<CityTimelinePage />} />
            <Route path="/analyst" element={<AIAnalystPage />} />
            <Route path="/insights" element={<AIInsightsPage />} />
            <Route path="/municipal-report" element={<MunicipalReportPage />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </ThemeProvider>
  );
}
