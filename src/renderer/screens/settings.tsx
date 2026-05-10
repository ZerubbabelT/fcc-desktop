import { useState } from "react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from 'renderer/components/ui/card'
import { Switch } from 'renderer/components/ui/switch'
import { Label } from 'renderer/components/ui/label'
import { Input } from 'renderer/components/ui/input'
import { Separator } from 'renderer/components/ui/separator'
import { cn } from 'renderer/lib/utils'

type Provider = 'nvidia_nim' | 'open_router' | 'deepseek' | 'lmstudio' | 'llamacpp' | 'ollama'

const providers: { id: Provider; name: string; local: boolean; doc: string }[] = [
  { id: 'nvidia_nim', name: 'NVIDIA NIM', local: false, doc: 'build.nvidia.com' },
  { id: 'open_router', name: 'OpenRouter', local: false, doc: 'openrouter.ai' },
  { id: 'deepseek', name: 'DeepSeek', local: false, doc: 'platform.deepseek.com' },
  { id: 'lmstudio', name: 'LM Studio', local: true, doc: 'localhost:1234' },
  { id: 'llamacpp', name: 'Llama.cpp', local: true, doc: 'localhost:8080' },
  { id: 'ollama', name: 'Ollama', local: true, doc: 'localhost:11434' },
]

export function SettingsScreen() {
  const [selectedProvider, setSelectedProvider] = useState<Provider>('nvidia_nim')

  return (
    <div className="flex flex-1 overflow-y-auto">
      <div className="flex w-full flex-col gap-6 p-6">
        {/* Provider Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Provider</CardTitle>
            <CardDescription>Select and configure your LLM provider</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="grid grid-cols-3 gap-2">
              {providers.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setSelectedProvider(p.id)}
                  className={cn(
                    "flex flex-col items-start gap-1 rounded-lg border px-3 py-2.5 text-left text-sm transition-all",
                    selectedProvider === p.id
                      ? "border-emerald-500/40 bg-emerald-500/5 text-emerald-400"
                      : "border-neutral-200 bg-white/50 text-neutral-600 hover:border-neutral-300 dark:border-neutral-700 dark:bg-neutral-800/50 dark:text-neutral-300 dark:hover:border-neutral-600"
                  )}
                >
                  <span className="font-medium">{p.name}</span>
                  <span className="text-xs opacity-60">{p.local ? 'Local' : 'Cloud'}</span>
                </button>
              ))}
            </div>

            <Separator />

            <div className="flex flex-col gap-3">
              <Label>API Key</Label>
              {selectedProvider === 'nvidia_nim' && (
                <Input type="password" placeholder="nvapi-..." />
              )}
              {selectedProvider === 'open_router' && (
                <Input type="password" placeholder="sk-or-..." />
              )}
              {selectedProvider === 'deepseek' && (
                <Input type="password" placeholder="DeepSeek API key" />
              )}
              {(selectedProvider === 'lmstudio' || selectedProvider === 'llamacpp' || selectedProvider === 'ollama') && (
                <div className="flex flex-col gap-2">
                  <Input
                    placeholder={
                      selectedProvider === 'lmstudio' ? 'http://localhost:1234/v1' :
                      selectedProvider === 'llamacpp' ? 'http://localhost:8080/v1' :
                      'http://localhost:11434'
                    }
                  />
                  <p className="text-xs text-neutral-500">No API key needed for local providers</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Model Mapping */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Model Mapping</CardTitle>
            <CardDescription>Route Claude models to specific provider models</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="space-y-3">
              {[
                { label: 'Default Model', id: 'model', hint: 'Fallback for all requests' },
                { label: 'Opus (complex tasks)', id: 'model_opus', hint: 'Hard reasoning' },
                { label: 'Sonnet (daily coding)', id: 'model_sonnet', hint: 'Balanced' },
                { label: 'Haiku (quick tasks)', id: 'model_haiku', hint: 'Fast & cheap' },
              ].map((m) => (
                <div key={m.id} className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor={m.id} className="text-xs">{m.label}</Label>
                    <span className="text-[10px] text-neutral-500">{m.hint}</span>
                  </div>
                  <Input
                    id={m.id}
                    placeholder={`${selectedProvider}/model-name`}
                    className="font-mono text-xs"
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Server Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Server</CardTitle>
            <CardDescription>Configure the proxy server</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="host">Host</Label>
                <Input id="host" defaultValue="0.0.0.0" className="font-mono text-xs" />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="port">Port</Label>
                <Input id="port" defaultValue="8082" type="number" className="font-mono text-xs" />
              </div>
            </div>
            <Separator />
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="auth-token" className="text-xs">Auth Token (optional)</Label>
              <Input id="auth-token" type="password" placeholder="ANTHROPIC_AUTH_TOKEN" className="font-mono text-xs" />
              <p className="text-[10px] text-neutral-500">Leave empty for no authentication</p>
            </div>
            <Separator />
            <div className="flex flex-col gap-3">
              <p className="text-xs font-medium text-neutral-500">Rate Limiting</p>
              <div className="grid grid-cols-3 gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs">Limit</Label>
                  <Input defaultValue="40" type="number" className="font-mono text-xs" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs">Window (s)</Label>
                  <Input defaultValue="60" type="number" className="font-mono text-xs" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs">Concurrency</Label>
                  <Input defaultValue="5" type="number" className="font-mono text-xs" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* General */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">General</CardTitle>
            <CardDescription>Application preferences</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="autostart">Launch on login</Label>
                <p className="text-xs text-neutral-500">Auto-start proxy on system boot</p>
              </div>
              <Switch id="autostart" />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="minimize-tray">Minimize to tray</Label>
                <p className="text-xs text-neutral-500">Keep running in background</p>
              </div>
              <Switch id="minimize-tray" defaultChecked />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="thinking">Thinking mode</Label>
                <p className="text-xs text-neutral-500">Enable reasoning tokens</p>
              </div>
              <Switch id="thinking" defaultChecked />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
