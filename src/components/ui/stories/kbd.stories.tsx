import type { Meta, StoryObj } from "@storybook/react-vite";
import { Kbd, KbdGroup } from "../kbd";
import { Button } from "../button";

const meta: Meta<typeof Kbd> = {
  title: "UI/Kbd",
  component: Kbd,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: "K",
  },
};

export const Enter: Story = {
  args: {
    children: "↵",
  },
};

export const Backspace: Story = {
  args: {
    children: "⌫",
  },
};

export const Modifier: Story = {
  args: {
    children: "⌘",
  },
};

export const Shift: Story = {
  args: {
    children: "⇧",
  },
};

export const KeyCombination: Story = {
  name: "Key Combination",
  render: () => (
    <KbdGroup>
      <Kbd>⌘</Kbd>
      <Kbd>K</Kbd>
    </KbdGroup>
  ),
};

export const ShiftEnter: Story = {
  name: "Shift + Enter",
  render: () => (
    <KbdGroup>
      <Kbd>⇧</Kbd>
      <Kbd>↵</Kbd>
    </KbdGroup>
  ),
};

export const InButton: Story = {
  name: "In Button",
  render: () => (
    <div className="flex gap-4">
      <Button variant="keep" size="lg">
        Keep <Kbd className="ml-2 bg-black/20 text-current">↵</Kbd>
      </Button>
      <Button variant="maybe" size="lg">
        Maybe <Kbd className="ml-2 bg-black/20 text-current">⇧↵</Kbd>
      </Button>
      <Button variant="yeet" size="lg">
        Yeet <Kbd className="ml-2 bg-black/20 text-current">⌫</Kbd>
      </Button>
    </div>
  ),
};

export const AllKeys: Story = {
  name: "Common Keys",
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Kbd>↵</Kbd>
      <Kbd>⌫</Kbd>
      <Kbd>⇧</Kbd>
      <Kbd>⌘</Kbd>
      <Kbd>⌥</Kbd>
      <Kbd>⌃</Kbd>
      <Kbd>⎋</Kbd>
      <Kbd>⇥</Kbd>
      <Kbd>←</Kbd>
      <Kbd>→</Kbd>
      <Kbd>↑</Kbd>
      <Kbd>↓</Kbd>
    </div>
  ),
};
