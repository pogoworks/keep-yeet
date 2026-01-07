import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn, formatBytes } from "@/lib/utils";
import type { ImageFile } from "@/stores/useAppStore";

export interface InfoPanelProps {
  image: ImageFile | undefined;
  className?: string;
}

export function InfoPanel({ image, className }: InfoPanelProps) {
  return (
    <aside
      data-slot="info-panel"
      className={cn("w-72 border-l bg-muted/30 p-4", className)}
    >
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Image Info</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {image ? (
            <>
              <InfoRow label="Filename" value={image.name} mono truncate />
              <InfoRow
                label="Dimensions"
                value={
                  image.dimensions
                    ? `${image.dimensions.width} x ${image.dimensions.height}`
                    : "Unknown"
                }
              />
              <InfoRow label="File Size" value={formatBytes(image.size)} />
              <InfoRow label="Path" value={image.path} mono truncate small />
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              Select an image to view details
            </p>
          )}
        </CardContent>
      </Card>
    </aside>
  );
}

interface InfoRowProps {
  label: string;
  value: string;
  mono?: boolean;
  truncate?: boolean;
  small?: boolean;
}

function InfoRow({ label, value, mono, truncate, small }: InfoRowProps) {
  return (
    <div data-slot="info-row" className="space-y-1">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p
        className={cn(
          "text-sm",
          mono && "font-mono",
          truncate && "truncate",
          small && "text-xs"
        )}
        title={truncate ? value : undefined}
      >
        {value}
      </p>
    </div>
  );
}
