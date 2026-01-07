import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  Check,
  Undo,
  Trash,
  ArrowLeft,
  ArrowRight,
  ArrowsHorizontal,
  Play,
  Plus,
  Close,
  Copy,
  Folder,
  FolderPlus,
  Images,
  CheckCircle,
  InfoBox,
} from "../pixel-icon";

const meta: Meta = {
  title: "UI/Pixel Icons",
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const AllIcons: Story = {
  name: "All Icons",
  render: () => (
    <div className="grid grid-cols-5 gap-6">
      <IconDisplay icon={<Check />} name="Check" />
      <IconDisplay icon={<Undo />} name="Undo" />
      <IconDisplay icon={<Trash />} name="Trash" />
      <IconDisplay icon={<ArrowLeft />} name="ArrowLeft" />
      <IconDisplay icon={<ArrowRight />} name="ArrowRight" />
      <IconDisplay icon={<ArrowsHorizontal />} name="ArrowsHorizontal" />
      <IconDisplay icon={<Play />} name="Play" />
      <IconDisplay icon={<Plus />} name="Plus" />
      <IconDisplay icon={<Close />} name="Close" />
      <IconDisplay icon={<Copy />} name="Copy" />
      <IconDisplay icon={<Folder />} name="Folder" />
      <IconDisplay icon={<FolderPlus />} name="FolderPlus" />
      <IconDisplay icon={<Images />} name="Images" />
      <IconDisplay icon={<CheckCircle />} name="CheckCircle" />
      <IconDisplay icon={<InfoBox />} name="InfoBox" />
    </div>
  ),
};

export const TriageIcons: Story = {
  name: "Triage Icons",
  render: () => (
    <div className="flex gap-8">
      <div className="flex flex-col items-center gap-2">
        <div className="flex size-12 items-center justify-center rounded-lg bg-keep text-keep-foreground">
          <Check size={24} />
        </div>
        <span className="text-xs text-muted-foreground">Keep</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <div className="flex size-12 items-center justify-center rounded-lg bg-maybe text-maybe-foreground">
          <Undo size={24} />
        </div>
        <span className="text-xs text-muted-foreground">Maybe</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <div className="flex size-12 items-center justify-center rounded-lg bg-yeet text-yeet-foreground">
          <Trash size={24} />
        </div>
        <span className="text-xs text-muted-foreground">Yeet</span>
      </div>
    </div>
  ),
};

export const Sizes: Story = {
  name: "Sizes",
  render: () => (
    <div className="flex items-end gap-4">
      <div className="flex flex-col items-center gap-2">
        <Check size={16} />
        <span className="text-xs text-muted-foreground">16px</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <Check size={20} />
        <span className="text-xs text-muted-foreground">20px</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <Check size={24} />
        <span className="text-xs text-muted-foreground">24px</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <Check size={32} />
        <span className="text-xs text-muted-foreground">32px</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <Check size={48} />
        <span className="text-xs text-muted-foreground">48px</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <Check size={64} />
        <span className="text-xs text-muted-foreground">64px</span>
      </div>
    </div>
  ),
};

export const Colors: Story = {
  name: "Colors",
  render: () => (
    <div className="flex gap-4">
      <Check size={32} className="text-foreground" />
      <Check size={32} className="text-muted-foreground" />
      <Check size={32} className="text-keep" />
      <Check size={32} className="text-maybe" />
      <Check size={32} className="text-yeet" />
      <Check size={32} className="text-primary" />
    </div>
  ),
};

function IconDisplay({ icon, name }: { icon: React.ReactNode; name: string }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex size-10 items-center justify-center rounded-md border bg-card">
        {icon}
      </div>
      <span className="text-xs text-muted-foreground">{name}</span>
    </div>
  );
}
