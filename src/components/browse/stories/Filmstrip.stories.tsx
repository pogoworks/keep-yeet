import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Filmstrip } from "../Filmstrip";
import type { ImageFile } from "@/stores/useAppStore";

// Generate mock images
function generateMockImages(count: number): ImageFile[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `mock-${i}`,
    path: `/path/to/image-${i}.jpg`,
    name: `image-${i.toString().padStart(3, "0")}.jpg`,
    thumbnailUrl: `https://picsum.photos/180?random=${i}`,
    size: 1024 * 1024 * (1 + Math.random() * 5),
    dimensions: { width: 1920, height: 1080 },
  }));
}

const meta: Meta<typeof Filmstrip> = {
  title: "Browse/Filmstrip",
  component: Filmstrip,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
  argTypes: {
    thumbnailSize: {
      control: { type: "range", min: 100, max: 250, step: 10 },
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    images: generateMockImages(10),
    selectedIndex: 0,
    onSelect: (index) => console.log("Selected:", index),
    thumbnailSize: 180,
  },
};

export const ManyImages: Story = {
  args: {
    images: generateMockImages(50),
    selectedIndex: 25,
    onSelect: (index) => console.log("Selected:", index),
    thumbnailSize: 180,
  },
};

export const Empty: Story = {
  args: {
    images: [],
    selectedIndex: 0,
    onSelect: (index) => console.log("Selected:", index),
    thumbnailSize: 180,
  },
};

export const SingleImage: Story = {
  args: {
    images: generateMockImages(1),
    selectedIndex: 0,
    onSelect: (index) => console.log("Selected:", index),
    thumbnailSize: 180,
  },
};

export const Interactive: Story = {
  render: () => {
    const [selectedIndex, setSelectedIndex] = useState(5);
    const images = generateMockImages(20);

    return (
      <div className="space-y-4">
        <div className="px-4 text-sm text-muted-foreground">
          Selected: {selectedIndex} | Use click to select, arrow keys work in
          real app
        </div>
        <Filmstrip
          images={images}
          selectedIndex={selectedIndex}
          onSelect={setSelectedIndex}
          thumbnailSize={180}
        />
      </div>
    );
  },
};

export const SmallThumbnails: Story = {
  args: {
    images: generateMockImages(15),
    selectedIndex: 7,
    onSelect: (index) => console.log("Selected:", index),
    thumbnailSize: 120,
  },
};

export const LargeThumbnails: Story = {
  args: {
    images: generateMockImages(8),
    selectedIndex: 3,
    onSelect: (index) => console.log("Selected:", index),
    thumbnailSize: 220,
  },
};
