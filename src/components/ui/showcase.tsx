import { Button } from "./button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./card"
import { Badge } from "./badge"
import { Input } from "./input"
import { Label } from "./label"
import { Square, Settings, Wifi, AlertCircle, CheckCircle } from "lucide-react"

export function DesignShowcase() {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-foreground">Streviz Design System</h1>
          <p className="text-xl text-muted-foreground">Professional Broadcast Theme with Glassmorphism</p>
        </div>

        {/* Color Palette */}
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold">Color Palette</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {/* Primary Colors */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground">Primary</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded bg-broadcast-blue"></div>
                  <span className="text-sm font-mono">#0066FF</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded bg-broadcast-blue-light"></div>
                  <span className="text-sm font-mono">#4D94FF</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded bg-broadcast-blue-dark"></div>
                  <span className="text-sm font-mono">#0052CC</span>
                </div>
              </div>
            </div>

            {/* Status Colors */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground">Status</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded bg-broadcast-success"></div>
                  <span className="text-sm font-mono">#10B981</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded bg-broadcast-warning"></div>
                  <span className="text-sm font-mono">#F59E0B</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded bg-broadcast-error"></div>
                  <span className="text-sm font-mono">#EF4444</span>
                </div>
              </div>
            </div>

            {/* Glass Surfaces */}
            <div className="space-y-3 col-span-2">
              <h3 className="text-sm font-medium text-muted-foreground">Glass Surfaces</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="glass-sm p-4 rounded-lg">
                  <span className="text-sm">Surface 01 (5%)</span>
                </div>
                <div className="glass p-4 rounded-lg">
                  <span className="text-sm">Surface 02 (8%)</span>
                </div>
                <div className="glass-md p-4 rounded-lg">
                  <span className="text-sm">Surface 03 (12%)</span>
                </div>
                <div className="glass-lg p-4 rounded-lg">
                  <span className="text-sm">Surface 04 (16%)</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Typography */}
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold">Typography</h2>
          <div className="space-y-4">
            <h1 className="text-4xl font-bold">Heading 1 - Inter Bold</h1>
            <h2 className="text-3xl font-semibold">Heading 2 - Inter Semibold</h2>
            <h3 className="text-2xl font-medium">Heading 3 - Inter Medium</h3>
            <p className="text-lg">Body Large - Inter Regular</p>
            <p className="text-base">Body - Inter Regular with optimized readability for broadcast interfaces</p>
            <p className="text-sm text-muted-foreground">Small Text - Inter Regular for secondary information</p>
            <p className="font-mono text-sm">Code Text - Fira Code for technical details</p>
          </div>
        </div>

        {/* Components */}
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold">Components</h2>

          {/* Buttons */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Buttons</h3>
            <div className="flex flex-wrap gap-4">
              <Button>Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="glass">Glass</Button>
              <Button variant="destructive">Destructive</Button>
              <Button size="sm">Small</Button>
              <Button size="lg">Large</Button>
            </div>
          </div>

          {/* Status Badges */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Status Badges</h3>
            <div className="flex flex-wrap gap-4">
              <Badge>Default</Badge>
              <Badge variant="success">Success</Badge>
              <Badge variant="warning">Warning</Badge>
              <Badge variant="destructive">Error</Badge>
              <Badge variant="outline">Outline</Badge>
              <Badge variant="secondary">Secondary</Badge>
            </div>
          </div>

          {/* Status Indicators */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Status Indicators</h3>
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-2">
                <div className="status-online"></div>
                <span>Online</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="status-warning"></div>
                <span>Warning</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="status-offline"></div>
                <span>Offline</span>
              </div>
            </div>
          </div>

          {/* Form Elements */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Form Elements</h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="input1">Input Label</Label>
                <Input id="input1" placeholder="Enter text..." />
              </div>
              <div className="space-y-2">
                <Label htmlFor="input2">Disabled Input</Label>
                <Input id="input2" placeholder="Disabled" disabled />
              </div>
            </div>
          </div>

          {/* Cards */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Cards</h3>
            <div className="grid md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Stream Status</CardTitle>
                  <CardDescription>Active streaming information</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Status</span>
                    <Badge variant="success" className="flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      Active
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Viewers</span>
                    <span className="font-medium">1,234</span>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="flex-1">
                      <Settings className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="destructive" className="flex-1">
                      <Square className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass">
                <CardHeader>
                  <CardTitle>Glass Card</CardTitle>
                  <CardDescription>With glassmorphism effect</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm">This card uses the glass surface style with backdrop blur for a professional broadcast look.</p>
                  <div className="flex items-center gap-2">
                    <Wifi className="w-4 h-4 text-broadcast-success" />
                    <span className="text-sm">Connected</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-destructive">
                <CardHeader>
                  <CardTitle className="text-destructive">Error Status</CardTitle>
                  <CardDescription>Connection issues detected</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2 text-destructive">
                    <AlertCircle className="w-4 h-4" />
                    <span className="text-sm">Stream disconnected</span>
                  </div>
                  <Button size="sm" variant="outline" className="w-full">
                    Reconnect
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Gradients */}
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold">Gradients</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="gradient-primary h-24 rounded-lg flex items-center justify-center text-white font-medium">
              Primary Gradient
            </div>
            <div className="gradient-glow h-24 rounded-lg flex items-center justify-center text-white font-medium border border-white/10">
              Glow Gradient
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}