import type { Meta, StoryObj } from "@storybook/react-vite";
import { FilmstripItem } from "../FilmstripItem";
import type { ImageFile } from "@/stores/useAppStore";

// Mock image data
const mockImage: ImageFile = {
  id: "mock-1",
  path: "/path/to/image.jpg",
  name: "sample-image.jpg",
  thumbnailUrl: "https://picsum.photos/180",
  size: 1024 * 1024 * 2.5, // 2.5 MB
  dimensions: { width: 1920, height: 1080 },
};

const mockImageNoThumbnail: ImageFile = {
  ...mockImage,
  id: "mock-2",
  thumbnailUrl: null,
};

const meta: Meta<typeof FilmstripItem> = {
  title: "Browse/FilmstripItem",
  component: FilmstripItem,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    isSelected: {
      control: "boolean",
    },
    size: {
      control: { type: "range", min: 100, max: 250, step: 10 },
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    image: mockImage,
    isSelected: false,
    onClick: () => console.log("Clicked"),
    size: 180,
  },
};

export const Selected: Story = {
  args: {
    image: mockImage,
    isSelected: true,
    onClick: () => console.log("Clicked"),
    size: 180,
  },
};

export const Loading: Story = {
  args: {
    image: mockImageNoThumbnail,
    isSelected: false,
    onClick: () => console.log("Clicked"),
    size: 180,
  },
};

export const SmallSize: Story = {
  args: {
    image: mockImage,
    isSelected: false,
    onClick: () => console.log("Clicked"),
    size: 120,
  },
};

export const LargeSize: Story = {
  args: {
    image: mockImage,
    isSelected: true,
    onClick: () => console.log("Clicked"),
    size: 220,
  },
};

export const MultipleItems: Story = {
  render: () => (
    <div className="flex gap-3">
      <FilmstripItem
        image={{ ...mockImage, id: "1" }}
        isSelected={false}
        onClick={() => {}}
        size={180}
      />
      <FilmstripItem
        image={{ ...mockImage, id: "2" }}
        isSelected={true}
        onClick={() => {}}
        size={180}
      />
      <FilmstripItem
        image={{ ...mockImage, id: "3" }}
        isSelected={false}
        onClick={() => {}}
        size={180}
      />
    </div>
  ),
};
