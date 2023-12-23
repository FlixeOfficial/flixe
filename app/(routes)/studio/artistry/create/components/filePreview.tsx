import React, { useState, useEffect } from "react";
import Image from "next/image";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import ThreeDModel from "./ThreeDModel";
import { Button } from "@/components/ui/button";
import { Expand, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type FilePreviewProps = {
  file: File;
  fileType: "Image" | "Model" | "Video" | "Music" | "Unknown";
  className?: string;
  disabled?: boolean;
};

const FilePreview: React.FC<FilePreviewProps> = ({
  file,
  fileType,
  className,
  disabled = true,
}) => {
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);
  const previewSize = { width: 500, height: 500 }; // fixed size for 1:1 aspect ratio

  useEffect(() => {
    if (file) {
      const src = URL.createObjectURL(file);
      setPreviewSrc(src);
      return () => URL.revokeObjectURL(src);
    }
  }, [file]);

  const renderPreview = () => {
    switch (fileType) {
      case "Image":
        return (
          <Image
            src={previewSrc ?? ""}
            alt="Preview"
            layout="fill"
            objectFit="cover"
          />
        );
      case "Model":
        return (
          <ThreeDModel
            modelUrl={previewSrc ?? ""}
            modelScale={1}
            animate={true}
            enableDamping={true}
            enablePan={true}
            enableZoom={true}
            loader={<p>Loading Model...</p>}
          />
        );
      case "Video":
        return (
          <video
            controls
            src={previewSrc ?? ""}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          >
            <source src={previewSrc ?? ""} type={file.type} />
          </video>
        );
      case "Music":
        return (
          <audio
            controls
            src={previewSrc ?? ""}
            style={{ width: "100%", height: "100%" }}
          >
            <source src={previewSrc ?? ""} type={file.type} />
          </audio>
        );
      default:
        return (
          <div className="flex flex-col justify-center items-center bg-card w-[100%] h-[100%] rounded-lg text-center p-5 font-semibold text-xl text-primary/30">
            Select Your ART File
            <p className="text-sm">(Image, Video, Music, Model)</p>
          </div>
        );
    }
  };

  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });

  const onImageLoad = (e: any) => {
    const { naturalWidth, naturalHeight } = e.target;
    setImageSize({ width: naturalWidth, height: naturalHeight });
  };

  const renderPopoverContent = () => {
    switch (fileType) {
      case "Image":
        return (
          <Image
            src={previewSrc ?? ""}
            alt="Original"
            layout="responsive"
            width={imageSize.width || 800}
            height={imageSize.height || 800}
            onLoad={onImageLoad}
          />
        );
      case "Video":
        // For videos, use a video tag with controls
        return (
          <video
            src={previewSrc ?? ""}
            controls
            style={{ maxWidth: "100%", maxHeight: "100%" }}
          />
        );
      case "Model":
        // For 3D models, use your ThreeDModel component
        // Ensure it's capable of handling the model URL and adjust props as necessary
        return (
          <ThreeDModel
            modelUrl={previewSrc ?? ""}
            modelScale={1}
            animate={true}
            enableDamping={true}
            enablePan={true}
            enableZoom={true}
            loader={<p>Loading Model...</p>} // Adjust loader as necessary
          />
        );
      default:
        // Default case for unsupported file types
        return <div>Unsupported file type</div>;
    }
  };
  return (
    <div
      style={{ position: "relative", ...previewSize }}
      className={cn(
        "border border-border w-full rounded-lg overflow-hidden",
        className
      )}
    >
      {renderPreview()}
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button
            className="absolute top-0 right-0 z-10 m-4 rounded-full bg-foreground/10 hover:bg-muted-foreground/20 p-3 backdrop-filter backdrop-blur-md text-priamry"
            disabled={disabled}
          >
            <Expand className="h-4 w-4" />
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent className="w-[80%] h-[80%] flex flex-col justify-center items-center">
          <AlertDialogDescription>
            <AlertDialogCancel className="absolute top-2 right-2 z-10 rounded-full bg-foreground/10 hover:bg-muted-foreground/20 p-3 backdrop-filter backdrop-blur-md text-priamry">
              <XCircle className="h-4 w-4" />
            </AlertDialogCancel>
            {renderPopoverContent()}
          </AlertDialogDescription>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default FilePreview;
