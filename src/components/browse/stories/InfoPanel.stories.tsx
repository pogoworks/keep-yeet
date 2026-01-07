import type { Meta, StoryObj } from "@storybook/react-vite";
import { InfoPanel } from "../InfoPanel";
import type { ImageFile } from "@/stores/useAppStore";

const mockImage: ImageFile = {
  id: "mock-1",
  path: "/Users/user/Documents/stable-diffusion/outputs/txt2img/2024-01-07/00042-landscape.png",
  name: "00042-landscape.png",
  thumbnailUrl: null,
  size: 1024 * 1024 * 3.2, // 3.2 MB
  dimensions: { width: 1920, height: 1080 },
};

const mockSmallImage: ImageFile = {
  id: "mock-2",
  path: "/path/to/small-thumbnail.jpg",
  name: "thumbnail.jpg",
  thumbnailUrl: null,
  size: 45 * 1024, // 45 KB
  dimensions: { width: 150, height: 150 },
};

const mockNoDimensions: ImageFile = {
  id: "mock-3",
  path: "/path/to/unknown.webp",
  name: "unknown-format.webp",
  thumbnailUrl: null,
  size: 1024 * 512, // 512 KB
  dimensions: undefined,
};

const mockLongFilename: ImageFile = {
  id: "mock-4",
  path: "/very/long/path/to/some/deeply/nested/folder/structure/with/many/levels/image-with-a-very-long-descriptive-filename-that-might-overflow.png",
  name: "image-with-a-very-long-descriptive-filename-that-might-overflow.png",
  thumbnailUrl: null,
  size: 1024 * 1024 * 15.7, // 15.7 MB
  dimensions: { width: 4096, height: 4096 },
};

const meta: Meta<typeof InfoPanel> = {
  title: "Browse/InfoPanel",
  component: InfoPanel,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div className="h-[500px]">
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

export const SmallImage: Story = {
  args: {
    image: mockSmallImage,
  },
};

export const NoDimensions: Story = {
  args: {
    image: mockNoDimensions,
  },
};

export const LongFilename: Story = {
  args: {
    image: mockLongFilename,
  },
};

export const NoImage: Story = {
  args: {
    image: undefined,
  },
};
