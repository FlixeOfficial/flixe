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
import { Expand, Loader2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import Player from "./musicPlayer/Player";

type FilePreviewProps = {
  file: File;
  cover: File;
  fileType: "Image" | "Model" | "Video" | "Music" | "Unknown";
  className?: string;
  disabled?: boolean;
};

const FilePreview: React.FC<FilePreviewProps> = ({
  file,
  cover,
  fileType,
  className,
  disabled = true,
}) => {
  const [fileURL, setFileURL] = useState<string | null>(null);
  const [coverURL, setCoverURL] = useState<string | null>(null);
  const previewSize = { width: 600, height: 600 }; // fixed size for 1:1 aspect ratio

  useEffect(() => {
    if (file) {
      const src = URL.createObjectURL(file);
      setFileURL(src);
      return () => URL.revokeObjectURL(src);
    }
  }, [file]);

  useEffect(() => {
    if (cover) {
      debugger;
      const src = URL.createObjectURL(cover);
      setCoverURL(src);
      return () => URL.revokeObjectURL(src);
    }
  }, [cover]);

  const renderPreview = () => {
    switch (fileType) {
      case "Image":
        return (
          <Image
            src={fileURL ?? ""}
            alt="Preview"
            layout="fill"
            objectFit="cover"
          />
        );
      case "Model":
        return (
          <ThreeDModel
            modelUrl={fileURL ?? ""}
            modelScale={1}
            animate={true}
            enableDamping={true}
            enablePan={true}
            enableZoom={true}
            loader={<Loader2 className="h-3 w-3 animate-spin" />}
          />
        );
      case "Video":
        return (
          <video
            controls
            src={fileURL ?? ""}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          >
            <source src={fileURL ?? ""} type={file.type} />
          </video>
        );
      case "Music":
        return <Player coverImage={coverURL ?? ""} musicSrc={fileURL ?? ""} />;
      default:
        return (
          <div className="flex flex-col justify-center items-center bg-card w-[100%] h-[100%] rounded-lg text-center p-5 font-semibold text-xl text-primary/30">
            Select Your ART File
            <p className="text-sm">( image, video, music, model.glb )</p>
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
            src={fileURL ?? ""}
            alt="Original"
            layout="responsive"
            className="max-w-[80vw] max-h-[80vh] object-contain"
            width={imageSize.width || 800}
            height={imageSize.height || 800}
            onLoad={onImageLoad}
          />
        );
      case "Video":
        // For videos, use a video tag with controls
        return (
          <video
            src={fileURL ?? ""}
            controls
            style={{ maxWidth: "100%", maxHeight: "100%" }}
          />
        );
      case "Model":
        // For 3D models, use your ThreeDModel component
        // Ensure it's capable of handling the model URL and adjust props as necessary
        return (
          <ThreeDModel
            modelUrl={fileURL ?? ""}
            modelScale={1}
            animate={true}
            enableDamping={true}
            enablePan={true}
            enableZoom={true}
            loader={<Loader2 className="h-3 w-3 animate-spin" />}
          />
        );
      case "Music":
        return <Player coverImage={coverURL ?? ""} musicSrc={fileURL ?? ""} />;
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
        <AlertDialogContent className="flex flex-col justify-center items-center">
          <AlertDialogDescription className="w-[80vw] h-[80vh] flex items-center justify-center">
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
