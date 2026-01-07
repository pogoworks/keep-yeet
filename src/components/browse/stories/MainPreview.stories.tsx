import type { Meta, StoryObj } from "@storybook/react-vite";
import { MainPreview } from "../MainPreview";
import type { ImageFile } from "@/stores/useAppStore";

const mockImage: ImageFile = {
  id: "mock-1",
  path: "/path/to/image.jpg",
  name: "landscape-photo.jpg",
  thumbnailUrl: "https://picsum.photos/1920/1080",
  size: 1024 * 1024 * 3.2,
  dimensions: { width: 1920, height: 1080 },
};

const mockPortraitImage: ImageFile = {
  id: "mock-2",
  path: "/path/to/portrait.jpg",
  name: "portrait-photo.jpg",
  thumbnailUrl: "https://picsum.photos/1080/1920",
  size: 1024 * 1024 * 2.1,
  dimensions: { width: 1080, height: 1920 },
};

const meta: Meta<typeof MainPreview> = {
  title: "Browse/MainPreview",
  component: MainPreview,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div className="h-[600px] w-full">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    image: mockImage,
  },
};

export const PortraitImage: Story = {
  args: {
    image: mockPortraitImage,
  },
};

export const NoImage: Story = {
  args: {
    image: undefined,
  },
};

export const WithCustomClass: Story = {
  args: {
    image: mockImage,
    className: "rounded-lg border",
  },
};
