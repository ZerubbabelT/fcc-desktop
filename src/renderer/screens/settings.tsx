import { useState, useEffect } from "react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from 'renderer/components/ui/card'
import { Switch } from 'renderer/components/ui/switch'
import { Label } from 'renderer/components/ui/label'
import { Input } from 'renderer/components/ui/input'
import { Separator } from 'renderer/components/ui/separator'
import { Button } from 'renderer/components/ui/button'
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

function envKeyForProvider(provider: Provider): string {
  const map: Record<Provider, string> = {
    nvidia_nim: 'NVIDIA_NIM_API_KEY',
    open_router: 'OPENROUTER_API_KEY',
    deepseek: 'DEEPSEEK_API_KEY',
    lmstudio: 'LM_STUDIO_BASE_URL',
    llamacpp: 'LLAMACPP_BASE_URL',
    ollama: 'OLLAMA_BASE_URL',
  }
  return map[provider]
}

export function SettingsScreen() {
  const [config, setConfig] = useState<Record<string, string>>({})
  const [selectedProvider, setSelectedProvider] = useState<Provider>('nvidia_nim')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    window.App.config.get().then((cfg) => {
      setConfig(cfg)
      for (const p of providers) {
        const key = envKeyForProvider(p.id)
        if (cfg[key]) {
          setSelectedProvider(p.id)
          break
        }
      }
    })
  }, [])

  const updateConfig = (key: string, value: string) => {
    setConfig((prev) => ({ ...prev, [key]: value }))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await window.App.config.save(config)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } finally {
      setSaving(false)
    }
  }

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
                <Input
                  type="password"
                  placeholder="nvapi-..."
                  value={config['NVIDIA_NIM_API_KEY'] || ''}
                  onChange={(e) => updateConfig('NVIDIA_NIM_API_KEY', e.target.value)}
                />
              )}
              {selectedProvider === 'open_router' && (
                <Input
                  type="password"
                  placeholder="sk-or-..."
                  value={config['OPENROUTER_API_KEY'] || ''}
                  onChange={(e) => updateConfig('OPENROUTER_API_KEY', e.target.value)}
                />
              )}
              {selectedProvider === 'deepseek' && (
                <Input
                  type="password"
                  placeholder="DeepSeek API key"
                  value={config['DEEPSEEK_API_KEY'] || ''}
                  onChange={(e) => updateConfig('DEEPSEEK_API_KEY', e.target.value)}
                />
              )}
              {(selectedProvider === 'lmstudio' || selectedProvider === 'llamacpp' || selectedProvider === 'ollama') && (
                <div className="flex flex-col gap-2">
                  <Input
                    placeholder={
                      selectedProvider === 'lmstudio' ? 'http://localhost:1234/v1' :
                      selectedProvider === 'llamacpp' ? 'http://localhost:8080/v1' :
                      'http://localhost:11434'
                    }
                    value={config[envKeyForProvider(selectedProvider)] || ''}
                    onChange={(e) => updateConfig(envKeyForProvider(selectedProvider), e.target.value)}
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
                { label: 'Default Model', key: 'MODEL', hint: 'Fallback for all requests' },
                { label: 'Opus (complex tasks)', key: 'MODEL_OPUS', hint: 'Hard reasoning' },
                { label: 'Sonnet (daily coding)', key: 'MODEL_SONNET', hint: 'Balanced' },
                { label: 'Haiku (quick tasks)', key: 'MODEL_HAIKU', hint: 'Fast & cheap' },
              ].map((m) => (
                <div key={m.key} className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor={m.key} className="text-xs">{m.label}</Label>
                    <span className="text-[10px] text-neutral-500">{m.hint}</span>
                  </div>
                  <Input
                    id={m.key}
                    placeholder={`${selectedProvider}/model-name`}
                    className="font-mono text-xs"
                    value={config[m.key] || ''}
                    onChange={(e) => updateConfig(m.key, e.target.value)}
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
                <Input
                  id="host"
                  className="font-mono text-xs"
                  value={config['HOST'] || '0.0.0.0'}
                  onChange={(e) => updateConfig('HOST', e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="port">Port</Label>
                <Input
                  id="port"
                  type="number"
                  className="font-mono text-xs"
                  value={config['PORT'] || '8082'}
                  onChange={(e) => updateConfig('PORT', e.target.value)}
                />
              </div>
            </div>
            <Separator />
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="auth-token" className="text-xs">Auth Token (optional)</Label>
              <Input
                id="auth-token"
                type="password"
                placeholder="ANTHROPIC_AUTH_TOKEN"
                className="font-mono text-xs"
                value={config['ANTHROPIC_AUTH_TOKEN'] || ''}
                onChange={(e) => updateConfig('ANTHROPIC_AUTH_TOKEN', e.target.value)}
              />
              <p className="text-[10px] text-neutral-500">Leave empty for no authentication</p>
            </div>
            <Separator />
            <div className="flex flex-col gap-3">
              <p className="text-xs font-medium text-neutral-500">Rate Limiting</p>
              <div className="grid grid-cols-3 gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs">Limit</Label>
                  <Input
                    type="number"
                    className="font-mono text-xs"
                    value={config['PROVIDER_RATE_LIMIT'] || '40'}
                    onChange={(e) => updateConfig('PROVIDER_RATE_LIMIT', e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs">Window (s)</Label>
                  <Input
                    type="number"
                    className="font-mono text-xs"
                    value={config['RATE_LIMIT_WINDOW'] || '60'}
                    onChange={(e) => updateConfig('RATE_LIMIT_WINDOW', e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs">Concurrency</Label>
                  <Input
                    type="number"
                    className="font-mono text-xs"
                    value={config['PROVIDER_MAX_CONCURRENCY'] || '5'}
                    onChange={(e) => updateConfig('PROVIDER_MAX_CONCURRENCY', e.target.value)}
                  />
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
              <Switch
                id="autostart"
                checked={config['AUTOSTART'] === 'true'}
                onCheckedChange={(v) => updateConfig('AUTOSTART', String(v))}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="thinking">Thinking mode</Label>
                <p className="text-xs text-neutral-500">Enable reasoning tokens</p>
              </div>
              <Switch
                id="thinking"
                checked={config['ENABLE_MODEL_THINKING'] !== 'false'}
                onCheckedChange={(v) => updateConfig('ENABLE_MODEL_THINKING', String(v))}
              />
            </div>
          </CardContent>
        </Card>

        {/* Save */}
        <Card>
          <CardFooter className="flex justify-end gap-3 pt-4">
            {saved && (
              <span className="text-sm text-emerald-500">Configuration saved</span>
            )}
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : 'Save Configuration'}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
