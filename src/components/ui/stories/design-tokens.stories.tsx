import type { Meta, StoryObj } from "@storybook/react-vite";

const meta: Meta = {
  title: "Design System/Tokens",
  parameters: {
    layout: "padded",
  },
};

export default meta;
type Story = StoryObj;

// Color swatch component
const ColorSwatch = ({
  name,
  variable,
  className,
}: {
  name: string;
  variable: string;
  className?: string;
}) => (
  <div className="flex items-center gap-3">
    <div
      className={`size-12 rounded-lg border border-border ${className}`}
      style={{ backgroundColor: `var(${variable})` }}
    />
    <div>
      <p className="text-sm font-medium">{name}</p>
      <p className="text-xs text-muted-foreground font-mono">{variable}</p>
    </div>
  </div>
);

export const Colors: Story = {
  name: "Color Palette",
  render: () => (
    <div className="space-y-8">
      {/* Grayscale */}
      <section>
        <h2 className="text-lg font-semibold mb-4">Grayscale</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          <ColorSwatch name="Gray 50" variable="--gray-50" />
          <ColorSwatch name="Gray 100" variable="--gray-100" />
          <ColorSwatch name="Gray 200" variable="--gray-200" />
          <ColorSwatch name="Gray 300" variable="--gray-300" />
          <ColorSwatch name="Gray 400" variable="--gray-400" />
          <ColorSwatch name="Gray 500" variable="--gray-500" />
          <ColorSwatch name="Gray 600" variable="--gray-600" />
          <ColorSwatch name="Gray 700" variable="--gray-700" />
          <ColorSwatch name="Gray 800" variable="--gray-800" />
          <ColorSwatch name="Gray 900" variable="--gray-900" />
          <ColorSwatch name="Gray 950" variable="--gray-950" />
        </div>
      </section>

      {/* Semantic Colors */}
      <section>
        <h2 className="text-lg font-semibold mb-4">Semantic Colors</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          <ColorSwatch name="Background" variable="--background" />
          <ColorSwatch name="Foreground" variable="--foreground" />
          <ColorSwatch name="Card" variable="--card" />
          <ColorSwatch name="Primary" variable="--primary" />
          <ColorSwatch name="Secondary" variable="--secondary" />
          <ColorSwatch name="Muted" variable="--muted" />
          <ColorSwatch name="Accent" variable="--accent" />
          <ColorSwatch name="Destructive" variable="--destructive" />
          <ColorSwatch name="Border" variable="--border" />
          <ColorSwatch name="Ring" variable="--ring" />
        </div>
      </section>

      {/* Triage Colors */}
      <section>
        <h2 className="text-lg font-semibold mb-4">Triage Colors</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Intentionally distinct: warm chartreuse (KEEP), cool violet (MAYBE), warm coral (YEET)
        </p>
        <div className="grid grid-cols-3 gap-6">
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-keep">KEEP (Chartreuse)</h3>
            <ColorSwatch name="Keep" variable="--keep" />
            <ColorSwatch name="Keep Hover" variable="--keep-hover" />
            <ColorSwatch name="Keep Muted" variable="--keep-muted" />
            <ColorSwatch name="Keep Foreground" variable="--keep-foreground" />
          </div>
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-maybe">MAYBE (Violet)</h3>
            <ColorSwatch name="Maybe" variable="--maybe" />
            <ColorSwatch name="Maybe Hover" variable="--maybe-hover" />
            <ColorSwatch name="Maybe Muted" variable="--maybe-muted" />
            <ColorSwatch name="Maybe Foreground" variable="--maybe-foreground" />
          </div>
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-yeet">YEET (Coral)</h3>
            <ColorSwatch name="Yeet" variable="--yeet" />
            <ColorSwatch name="Yeet Hover" variable="--yeet-hover" />
            <ColorSwatch name="Yeet Muted" variable="--yeet-muted" />
            <ColorSwatch name="Yeet Foreground" variable="--yeet-foreground" />
          </div>
        </div>
      </section>
    </div>
  ),
};

export const Typography: Story = {
  name: "Typography",
  render: () => (
    <div className="space-y-8">
      <section>
        <h2 className="text-lg font-semibold mb-4">Font Pairing</h2>
        <div className="space-y-6">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">
              Display Font - Syne
            </p>
            <p className="font-display text-4xl font-bold tracking-tight">
              Toss - Rapid Image Triage
            </p>
            <p className="font-display text-2xl font-semibold mt-2">
              Bold, architectural, memorable
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">
              UI Font - Space Grotesk
            </p>
            <p className="font-sans text-lg">
              Clean and readable for interface elements, buttons, and body text.
              Geometric with a technical feel that pairs well with Syne's boldness.
            </p>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-4">Type Scale</h2>
        <div className="space-y-4">
          <div className="flex items-baseline gap-4">
            <span className="text-xs text-muted-foreground w-20">text-xs</span>
            <span className="text-xs">12px - Captions, labels</span>
          </div>
          <div className="flex items-baseline gap-4">
            <span className="text-xs text-muted-foreground w-20">text-sm</span>
            <span className="text-sm">14px - Secondary text, metadata</span>
          </div>
          <div className="flex items-baseline gap-4">
            <span className="text-xs text-muted-foreground w-20">text-base</span>
            <span className="text-base">16px - Body text, buttons</span>
          </div>
          <div className="flex items-baseline gap-4">
            <span className="text-xs text-muted-foreground w-20">text-lg</span>
            <span className="text-lg">18px - Subheadings</span>
          </div>
          <div className="flex items-baseline gap-4">
            <span className="text-xs text-muted-foreground w-20">text-xl</span>
            <span className="text-xl">20px - Section titles</span>
          </div>
          <div className="flex items-baseline gap-4">
            <span className="text-xs text-muted-foreground w-20">text-2xl</span>
            <span className="text-2xl">24px - Page titles</span>
          </div>
          <div className="flex items-baseline gap-4">
            <span className="text-xs text-muted-foreground w-20">text-3xl</span>
            <span className="font-display text-3xl font-semibold">30px - Hero (Syne)</span>
          </div>
          <div className="flex items-baseline gap-4">
            <span className="text-xs text-muted-foreground w-20">text-4xl</span>
            <span className="font-display text-4xl font-bold">36px - Display (Syne)</span>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-4">Font Weights</h2>
        <div className="space-y-3">
          <p className="text-xl font-normal">Normal (400) - Space Grotesk</p>
          <p className="text-xl font-medium">Medium (500) - Space Grotesk</p>
          <p className="text-xl font-semibold">Semibold (600) - Space Grotesk</p>
          <p className="font-display text-xl font-bold">Bold (700) - Syne</p>
          <p className="font-display text-xl font-extrabold">Extra Bold (800) - Syne</p>
        </div>
      </section>
    </div>
  ),
};

export const Spacing: Story = {
  name: "Spacing (8px base)",
  render: () => (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        8px base grid. Values shown are the resulting pixel sizes.
      </p>
      <div className="space-y-3">
        {[
          { name: "0.5", value: "4px" },
          { name: "1", value: "8px" },
          { name: "1.5", value: "12px" },
          { name: "2", value: "16px" },
          { name: "3", value: "24px" },
          { name: "4", value: "32px" },
          { name: "5", value: "40px" },
          { name: "6", value: "48px" },
          { name: "8", value: "64px" },
          { name: "10", value: "80px" },
          { name: "12", value: "96px" },
        ].map(({ name, value }) => (
          <div key={name} className="flex items-center gap-4">
            <span className="text-xs text-muted-foreground w-12 font-mono">
              {name}
            </span>
            <div
              className="h-4 bg-keep rounded"
              style={{ width: value }}
            />
            <span className="text-xs text-muted-foreground">{value}</span>
          </div>
        ))}
      </div>
    </div>
  ),
};

export const Shadows: Story = {
  name: "Shadows & Glows",
  render: () => (
    <div className="space-y-8">
      <section>
        <h2 className="text-lg font-semibold mb-4">Elevation Shadows</h2>
        <div className="flex flex-wrap gap-8">
          {["xs", "sm", "md", "lg", "xl"].map((size) => (
            <div
              key={size}
              className="size-20 rounded-lg bg-card flex items-center justify-center"
              style={{ boxShadow: `var(--shadow-${size})` }}
            >
              <span className="text-xs font-mono">{size}</span>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-4">Glow Effects</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Used on triage buttons for visual feedback
        </p>
        <div className="flex gap-8">
          <div
            className="size-20 rounded-lg bg-keep flex items-center justify-center"
            style={{ boxShadow: `var(--glow-keep)` }}
          >
            <span className="text-xs font-mono text-keep-foreground">keep</span>
          </div>
          <div
            className="size-20 rounded-lg bg-maybe flex items-center justify-center"
            style={{ boxShadow: `var(--glow-maybe)` }}
          >
            <span className="text-xs font-mono text-maybe-foreground">maybe</span>
          </div>
          <div
            className="size-20 rounded-lg bg-yeet flex items-center justify-center"
            style={{ boxShadow: `var(--glow-yeet)` }}
          >
            <span className="text-xs font-mono text-yeet-foreground">yeet</span>
          </div>
        </div>
      </section>
    </div>
  ),
};

export const MeshGradients: Story = {
  name: "Mesh Gradients",
  render: () => (
    <div className="space-y-8">
      <p className="text-sm text-muted-foreground">
        Pre-baked gradient utilities for hero sections and empty states.
        Include noise overlay for texture.
      </p>

      <section>
        <h3 className="text-sm font-medium mb-3">Hero Gradient</h3>
        <div className="mesh-hero h-48 rounded-xl flex items-center justify-center">
          <span className="text-lg font-semibold relative z-10">
            .mesh-hero
          </span>
        </div>
      </section>

      <section>
        <h3 className="text-sm font-medium mb-3">Empty State Gradient</h3>
        <div className="mesh-empty h-48 rounded-xl flex items-center justify-center">
          <span className="text-lg font-semibold">.mesh-empty</span>
        </div>
      </section>

      <section>
        <h3 className="text-sm font-medium mb-3">Completion Gradient</h3>
        <div className="mesh-complete h-48 rounded-xl flex items-center justify-center">
          <span className="text-lg font-semibold">.mesh-complete</span>
        </div>
      </section>
    </div>
  ),
};

export const Motion: Story = {
  name: "Motion Tokens",
  render: () => (
    <div className="space-y-8">
      <section>
        <h2 className="text-lg font-semibold mb-4">Durations</h2>
        <div className="space-y-4">
          {[
            { name: "instant", value: "75ms", use: "Micro-interactions" },
            { name: "fast", value: "150ms", use: "Button presses, toggles" },
            { name: "base", value: "250ms", use: "Default transitions" },
            { name: "slow", value: "400ms", use: "Modals, page transitions" },
            { name: "slower", value: "600ms", use: "Hero animations" },
          ].map(({ name, value, use }) => (
            <div key={name} className="flex items-center gap-4">
              <span className="text-xs text-muted-foreground w-16 font-mono">
                {name}
              </span>
              <span className="text-sm w-16">{value}</span>
              <span className="text-xs text-muted-foreground">{use}</span>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-4">Easings</h2>
        <div className="space-y-4">
          {[
            { name: "ease-in", value: "cubic-bezier(0.4, 0, 1, 1)" },
            { name: "ease-out", value: "cubic-bezier(0, 0, 0.2, 1)" },
            { name: "ease-in-out", value: "cubic-bezier(0.4, 0, 0.2, 1)" },
            { name: "ease-spring", value: "cubic-bezier(0.34, 1.56, 0.64, 1)" },
          ].map(({ name, value }) => (
            <div key={name} className="flex items-center gap-4">
              <span className="text-xs text-muted-foreground w-24 font-mono">
                {name}
              </span>
              <span className="text-xs font-mono text-muted-foreground">
                {value}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-4">Usage Example</h2>
        <code className="text-sm font-mono text-muted-foreground">
          transition-all duration-[var(--duration-fast)] ease-[var(--ease-out)]
        </code>
      </section>
    </div>
  ),
};
