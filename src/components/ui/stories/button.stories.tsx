import type { Meta, StoryObj } from "@storybook/react-vite";
import { Check, Undo, Trash } from "../pixel-icon";
import { Button } from "../button";

const meta: Meta<typeof Button> = {
  title: "UI/Button",
  component: Button,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: [
        "default",
        "destructive",
        "outline",
        "secondary",
        "ghost",
        "link",
        "keep",
        "maybe",
        "yeet",
      ],
    },
    size: {
      control: "select",
      options: ["default", "sm", "lg", "icon", "icon-sm", "icon-lg"],
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: "Button",
    variant: "default",
  },
};

export const Destructive: Story = {
  args: {
    children: "Delete",
    variant: "destructive",
  },
};

export const Outline: Story = {
  args: {
    children: "Outline",
    variant: "outline",
  },
};

export const Secondary: Story = {
  args: {
    children: "Secondary",
    variant: "secondary",
  },
};

export const Ghost: Story = {
  args: {
    children: "Ghost",
    variant: "ghost",
  },
};

export const Link: Story = {
  args: {
    children: "Link",
    variant: "link",
  },
};

export const Small: Story = {
  args: {
    children: "Small",
    size: "sm",
  },
};

export const Large: Story = {
  args: {
    children: "Large",
    size: "lg",
  },
};

// Triage Action Buttons - Using new design system variants
export const Keep: Story = {
  args: {
    children: "KEEP",
    variant: "keep",
  },
};

export const Maybe: Story = {
  args: {
    children: "MAYBE",
    variant: "maybe",
  },
};

export const Yeet: Story = {
  args: {
    children: "YEET",
    variant: "yeet",
  },
};

export const TriageButtons: Story = {
  name: "Triage Actions",
  render: () => (
    <div className="flex flex-col gap-6">
      <div className="flex gap-4">
        <Button variant="keep" size="lg">
          <Check size={20} />
          KEEP
        </Button>
        <Button variant="maybe" size="lg">
          <Undo size={20} />
          MAYBE
        </Button>
        <Button variant="yeet" size="lg">
          <Trash size={20} />
          YEET
        </Button>
      </div>
      <p className="text-sm text-muted-foreground text-center">
        Hover to see glow effects
      </p>
    </div>
  ),
};

export const AllVariants: Story = {
  name: "All Variants",
  render: () => (
    <div className="flex flex-col gap-6">
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Standard Variants
        </p>
        <div className="flex flex-wrap gap-3">
          <Button variant="default">Default</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="link">Link</Button>
          <Button variant="destructive">Destructive</Button>
        </div>
      </div>
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Triage Actions
        </p>
        <div className="flex gap-3">
          <Button variant="keep">KEEP</Button>
          <Button variant="maybe">MAYBE</Button>
          <Button variant="yeet">YEET</Button>
        </div>
      </div>
    </div>
  ),
};
