import { useState, useEffect } from "react";
import { Sidebar, SidebarBody, SidebarLink } from "renderer/components/ui/sidebar";
import {
  IconHome,
  IconClipboardList,
  IconSettings,
  IconSun,
  IconMoon,
  IconActivity,
} from "@tabler/icons-react";
import { motion } from "motion/react";
import { cn } from "renderer/lib/utils";
import { useNavigate, useLocation } from "react-router-dom";

function useTheme() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof document === 'undefined') return 'dark'
    return document.documentElement.classList.contains('dark') ? 'dark' : 'light'
  })

  useEffect(() => {
    const root = document.documentElement
    if (theme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
    localStorage.setItem('theme', theme)
  }, [theme])

  return { theme, toggle: () => setTheme(t => t === 'dark' ? 'light' : 'dark') }
}

const STATUS: 'running' | 'stopped' = 'stopped'

export default function SidebarDemo({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { theme, toggle } = useTheme()

  const links = [
    { label: "Home", path: '/', icon: IconHome },
    { label: "Logs", path: '/logs', icon: IconClipboardList },
    { label: "Settings", path: '/settings', icon: IconSettings },
  ]

  const [open, setOpen] = useState(false)

  return (
    <div
      className={cn(
        "mx-auto flex w-full max-w-7xl flex-1 flex-col overflow-hidden rounded-md border border-neutral-200 bg-gray-100 md:flex-row dark:border-border dark:bg-background",
        "h-screen",
      )}
    >
      <Sidebar open={open} setOpen={setOpen}>
        <SidebarBody className="justify-between gap-10">
          <div className="flex flex-1 flex-col overflow-x-hidden overflow-y-auto">
            {open ? <Logo /> : <LogoIcon />}
            <div className="mt-8 flex flex-col gap-1">
              {links.map((link) => {
                const active = location.pathname === link.path
                return (
                  <div
                    key={link.path}
                    onClick={() => navigate(link.path)}
                    className={cn(
                      "flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                      active
                        ? "bg-neutral-200/80 text-neutral-900 dark:bg-neutral-700/80 dark:text-white"
                        : "text-neutral-500 hover:bg-neutral-200/50 hover:text-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-700/50 dark:hover:text-neutral-200"
                    )}
                  >
                    <link.icon className="h-5 w-5 shrink-0" />
                    {open && (
                      <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="whitespace-pre"
                      >
                        {link.label}
                      </motion.span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <div
              onClick={toggle}
              className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-neutral-500 transition-colors hover:bg-neutral-200/50 hover:text-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-700/50 dark:hover:text-neutral-200"
            >
              {theme === 'dark' ? (
                <IconSun className="h-5 w-5 shrink-0" />
              ) : (
                <IconMoon className="h-5 w-5 shrink-0" />
              )}
              {open && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="whitespace-pre"
                >
                  {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                </motion.span>
              )}
            </div>

            <div className="flex items-center gap-3 rounded-lg px-3 py-2.5">
              <span className={cn(
                "relative flex h-2.5 w-2.5",
                STATUS === 'running' && "before:absolute before:inset-0 before:animate-ping before:rounded-full before:bg-running before:opacity-75"
              )}>
                <span className={cn(
                  "inline-flex h-2.5 w-2.5 rounded-full",
                  STATUS === 'running' ? "bg-running" : "bg-stopped"
                )} />
              </span>
              {open && (
                <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
                  {STATUS === 'running' ? 'Proxy Running' : 'Proxy Stopped'}
                </span>
              )}
            </div>
          </div>
        </SidebarBody>
      </Sidebar>
      <div className="flex flex-1 bg-background text-foreground">
        {children}
      </div>
    </div>
  )
}

const Logo = () => (
  <div className="flex items-center gap-2.5 px-3 py-1">
    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600">
      <IconActivity className="h-4 w-4 text-white" />
    </div>
    <motion.span
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="text-sm font-bold tracking-tight text-black dark:text-white"
    >
      FCC
    </motion.span>
  </div>
)

const LogoIcon = () => (
  <div className="flex items-center justify-center py-1">
    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600">
      <IconActivity className="h-4 w-4 text-white" />
    </div>
  </div>
)
