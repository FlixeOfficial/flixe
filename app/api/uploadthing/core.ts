// import { auth } from "@clerk/nextjs";
import { createUploadthing, type FileRouter } from "uploadthing/next";

// import { isTeacher } from "@/lib/teacher";
 
const f = createUploadthing();
 
// const handleAuth = () => {
//   const { userId } = auth();
//   const isAuthorized = isTeacher(userId);

//   if (!userId || !isAuthorized) throw new Error("Unauthorized");
//   return { userId };
// }

export const ourFileRouter = {
  imageUploader: f({ image: { maxFileSize: '32MB' } })
  // .middleware(() => handleAuth())
  .onUploadComplete(async ({ metadata, file }) => {}),

  glbModelUploader: f({['model/gltf-binary']: { maxFileSize: '32MB' }, ['model/gltf+json']: { maxFileSize: '32MB' }})
  .onUploadComplete(() => {}),

  flixImage: f({ image: { maxFileSize: "32MB", maxFileCount: 1 } })
    // .middleware(() => handleAuth())
    .onUploadComplete(() => {}),

  flixAttachment: f(["text", "image", "video", "audio", "pdf"])
    // .middleware(() => handleAuth())
    .onUploadComplete(() => {}),

  episodeVideo: f({ video: { maxFileCount: 1, maxFileSize: "512GB" } })
    // .middleware(() => handleAuth())
    .onUploadComplete(() => {}),

  adVideo: f({ video: { maxFileCount: 1, maxFileSize: "512MB" } })
    // .middleware(() => handleAuth())
    .onUploadComplete(() => {})
} satisfies FileRouter;
 
export type OurFileRouter = typeof ourFileRouter;