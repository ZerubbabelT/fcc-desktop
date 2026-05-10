import { Route } from 'react-router-dom'
import { Router } from 'lib/electron-router-dom'
import { MainScreen } from './screens/main'
import { LogsScreen } from './screens/logs'
import { SettingsScreen } from './screens/settings'
import { Outlet } from 'react-router-dom'
import SidebarDemo from 'renderer/components/sidebar-demo'

function Layout() {
  return (
    <SidebarDemo>
      <Outlet />
    </SidebarDemo>
  )
}

export function AppRoutes() {
  return (
    <Router
      main={
        <Route element={<Layout />}>
          <Route element={<MainScreen />} path="/" />
          <Route element={<LogsScreen />} path="/logs" />
          <Route element={<SettingsScreen />} path="/settings" />
        </Route>
      }
    />
  )
}
