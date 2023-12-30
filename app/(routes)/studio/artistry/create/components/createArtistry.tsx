"use client";

import * as z from "zod";
import React, { useEffect, useRef, useState } from "react";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Editor } from "@/components/editor";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, PlusCircle, Trash2 } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { uploadFiles } from "@/lib/uploadthing";
import { fetchAddress } from "@/lib/walletUtil";
import { storeJSONToWeb3Storage } from "@/service/Web3Storage";
import { useRouter } from "next/navigation";
import { Combobox } from "@/components/ui/combobox";
import { useToast } from "@/components/ui/use-toast";
import FilePreview from "./filePreview";
import MarketplaceInteraction from "@/contracts/interaction/MarketplaceInteraction";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

type Category = {
  id: string;
  name: string;
};

type CreateArtistryProps = {
  categories: Category[];
};

const formSchema = z.object({
  title: z.string().min(1, {
    message: "Title is required",
  }),
  image: z
    .custom<File>(
      (file) => {
        console.log("Validating file:", file);
        return file instanceof File;
      },
      {
        message: "Image is required",
      }
    )
    .refine(
      (file) => {
        const isValidSize = file.size <= 10 * 1024 * 1024;
        console.log("Checking file size:", isValidSize);
        return isValidSize;
      },
      {
        message: `The image must be a maximum of 10MB.`,
      }
    ),
  art: z
    .custom<File>(
      (file) => file instanceof File, // Ensures it's a File object
      {
        message: "File is required",
      }
    )
    .refine(
      (file) => file.size <= 10 * 1024 * 1024, // 10 MB size limit
      {
        message: "File must be less than 10MB",
      }
    ),
  categoryId: z.string().min(1),
  description: z.string().min(1),
  url: z.string().min(1),
  properties: z
    .array(
      z.object({
        name: z.string().min(1, { message: "Property name is required" }),
        value: z.string().min(1, { message: "Property value is required" }),
      })
    )
    .refine(
      (properties) =>
        properties.length > 0 &&
        properties.every((prop) => prop.name && prop.value),
      {
        message:
          "All properties must be filled and at least one property is required",
      }
    ),
});

const NFTTypes = [
  { name: "Standard", videoSrc: "/art.mp4", disabled: false },
  { name: "Dynamic", videoSrc: "/dynamic.mp4", disabled: false },
  { name: "Immersive", videoSrc: "/art.mp4", disabled: true },
];

const CreateArtistry = ({ categories }: CreateArtistryProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const [walletAddress, setWalletAddress] = useState(null);
  const updateWalletAddress = async () => {
    const address = await fetchAddress();
    setWalletAddress(address);
  };

  useEffect(() => {
    updateWalletAddress();
  }, []);

  const router = useRouter();

  const [selectedNFTType, setSelectedNFTType] = useState("Standard");
  const videoRefs = useRef(new Array(NFTTypes.length).fill(null));

  const handleRadioChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedNFTType(event.target.value);
  };

  const handleMouseEnter = (index: number) => {
    const video = videoRefs.current[index];
    if (video) video.play();
  };

  const handleMouseLeave = (index: number) => {
    const video = videoRefs.current[index];
    if (video) video.pause();
  };

  const categorieOptions = categories.map((category) => ({
    label: category.name,
    value: category.id,
  }));

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      image: undefined,
      art: undefined,
      categoryId: "",
      description: "",
      url: "",
      properties: [{ name: "", value: "" }],
    },
  });

  const { isSubmitting, isValid, errors } = form.formState;

  const [fileType, setFileType] = useState<
    "Image" | "Model" | "Video" | "Music" | "Unknown"
  >("Unknown");

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "properties",
  });

  const handleAddProperty = () => {
    const properties = form.getValues("properties");
    const lastProperty = properties[properties.length - 1];
    if (lastProperty && lastProperty.name && lastProperty.value) {
      append({ name: "", value: "" });
    } else {
      toast({
        title: "Value misisng updated",
        description: "Plz fill all the properties to addk new one.",
      });
      console.log("Please fill the previous property before adding a new one.");
    }
  };

  const canAddNewProperty = () => {
    const properties = form.getValues("properties");
    const lastProperty = properties[properties.length - 1];
    return lastProperty && lastProperty.name && lastProperty.value;
  };

  const determineFileType = (file: any) => {
    const fileType = file.type;
    const model = file.name.split(".").pop().toLowerCase();
    if (fileType.startsWith("image/")) {
      setFileType("Image");
    } else if (["gltf", "glb"].includes(model)) {
      setFileType("Model");
    } else if (fileType.startsWith("video/")) {
      setFileType("Video");
    } else if (fileType.startsWith("audio/")) {
      setFileType("Music");
    } else {
      setFileType("Unknown");
    }
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    const { title, image, art, categoryId, description, url, properties } =
      values;

    debugger;

    // Ensure the file exists and is a File instance
    if (
      values.image &&
      values.image instanceof File &&
      values.art &&
      values.art instanceof File
    ) {
      try {
        const [res1] = await uploadFiles({
          files: [values.image],
          endpoint: "imageUploader",
        });
        const [res2] = await uploadFiles({
          files: [values.art],
          endpoint: "glbModelUploader",
        });

        const args = {
          ...{ title, image, art, categoryId, description, url, properties },
          imageUrl: res1.url,
          artUrl: res2.url,
        };

        console.log("args: ", args);
        debugger;

        const web3StorageResponse = await storeJSONToWeb3Storage(
          args,
          "artistrydata.json"
        );
        const artistryURI = `${web3StorageResponse}/artistrydata.json`;

        console.log("artistryURI: ", artistryURI);

        const nftMarketplace = MarketplaceInteraction();
        const nftId = await nftMarketplace.mintNFT(artistryURI);

        console.log("nftId: ", nftId);

        router.push("/studio/artistry");
      } catch (error) {
        console.error("Error uploading file:", error);
      }
    } else {
      console.error("No file or invalid file provided");
    }
  };

  return (
    <div className="p-4">
      {/* {isLoading && <Loader />} */}

      <div className="flex items-center justify-between bg-card border rounded-md px-4 py-2">
        <div className="flex items-center flex-row justify-center align-middle">
          <Link
            href={`/studio/artistry`}
            className="text-sm hover:opacity-75 transition -ml-4 -my-2 mr-4 rounded-l-md bg-background/30 hover:bg-background/70"
          >
            <ArrowLeft className="h-4 w-4 mx-4 my-4" />
          </Link>
          <div className="font-medium flex flex-col gap-4">
            <h1 className="text-3xl font-bold tracking-wider">
              Create a new{" "}
              <span className="font-black text-[#8b7ad0]">Artistry</span>
            </h1>
          </div>
        </div>
        <Button
          disabled={!isValid || isSubmitting}
          type="submit"
          variant="outline"
          size="sm"
          form="hook-form"
        >
          Create
        </Button>
      </div>

      <Form {...form}>
        <form
          id="hook-form"
          onSubmit={form.handleSubmit(onSubmit)}
          className="w-full mt-10 flex flex-col gap-10"
        >
          <div className="flex gap-8">
            <div className="font-medium flex flex-col justify-evenly gap-10 w-3/5 min-[2300px]:w-2/3">
              <RadioGroup
                defaultValue="Standard"
                className="grid grid-cols-3 gap-8 px-2"
                onChange={handleRadioChange}
              >
                {NFTTypes.map((type, index) => (
                  <div key={type.name} className="relative">
                    <RadioGroupItem
                      value={type.name}
                      id={type.name}
                      className="peer sr-only"
                      disabled={type.disabled}
                    />
                    <Label
                      htmlFor={type.name}
                      className="h-24 max-h-24 flex items-center justify-center rounded-md ring-2 ring-[#7aaed050] ring-offset-2 ring-offset-background bg-popover p-4 hover:bg-accent hover:ring-[#7aaed050] peer-data-[state=checked]:ring-[#7aaed0] [&:has([data-state=checked])]:ring-[#7aaed0] relative"
                      onMouseEnter={() => handleMouseEnter(index)}
                      onMouseLeave={() => handleMouseLeave(index)}
                    >
                      {/* Video Element */}
                      {!type.disabled && (
                        <video
                          ref={(el) => (videoRefs.current[index] = el)}
                          loop
                          muted
                          playsInline
                          className="absolute inset-0 w-full h-full object-cover rounded-md z-8"
                          style={{ filter: "brightness(95%)" }}
                        >
                          <source src={type.videoSrc} type="video/mp4" />
                        </video>
                      )}
                      <div
                        className="absolute inset-0 w-full h-full bg-black rouded-md opacity-10 z-9"
                        style={{
                          backgroundImage: `url("/noise.png")`,
                        }}
                      ></div>
                      {/* Text Overlay */}
                      <span className="relative font-bold text-white z-10">
                        {type.name}
                      </span>
                    </Label>
                  </div>
                ))}
              </RadioGroup>

              <div className="flex gap-4 w-full">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem className="w-2/3 flex flex-col gap-4">
                      <FormLabel>Display name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Give a name for your art"
                          className="h-[50px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage>
                        {errors.title && <span>{errors.title.message}</span>}
                      </FormMessage>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="categoryId"
                  render={({ field }) => (
                    <FormItem className="w-1/3 flex flex-col gap-4">
                      <FormLabel>Art Category</FormLabel>
                      <FormControl>
                        <Combobox
                          options={categorieOptions}
                          className="h-[50px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex gap-4">
                <FormField
                  control={form.control}
                  name="art"
                  render={({ field }) => (
                    <FormItem className="flex flex-row gap-3 items-center justify-between rounded-lg border p-4 bg-card w-1/2">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Upload Art</FormLabel>
                        <FormDescription className="whitespace-nowrap">
                          (image, model, video, music)
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Input
                          type="file"
                          accept="image/*, .glb, .gltf-binary, video/*, audio/*"
                          multiple={false}
                          className="max-w-[50%] font-bold text-[#d0a17a] text-sm"
                          {...{ ...field, value: undefined }}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              field.onChange(file);
                              determineFileType(file);
                            }
                          }}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="image"
                  render={({ field }) => (
                    <FormItem className="flex flex-row gap-3 items-center justify-between rounded-lg border p-4 bg-card w-1/2">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Cover Image</FormLabel>
                        <FormDescription className="whitespace-nowrap">
                          Pick an image under 10MB
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Input
                          type="file"
                          accept="image/*"
                          multiple={false}
                          className="max-w-[50%] font-bold text-[#d0a17a] text-sm"
                          {...{ ...field, value: undefined }}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              field.onChange(file);
                            }
                          }}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem className="flex flex-col gap-4">
                    <FormLabel className="font-medium">Description</FormLabel>
                    <FormControl>
                      <Editor {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div></div>

              <FormField
                control={form.control}
                name="url"
                render={({ field }) => (
                  <FormItem className="flex flex-col gap-4">
                    <FormLabel className="font-medium">External URL</FormLabel>
                    <FormControl>
                      <Input
                        className="h-[50px]"
                        placeholder="Give a one line of the flix"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="">
                <div className="flex items-center justify-between text-xl leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 font-medium">
                  Art properties
                  <Button
                    type="button"
                    onClick={handleAddProperty}
                    variant="ghost"
                    disabled={!canAddNewProperty()}
                    // className="bg-muted hover:bg-muted-foreground/20"
                  >
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Add New
                  </Button>
                  {/* <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Button
                          type="button"
                          onClick={handleAddProperty}
                          variant="ghost"
                          disabled={!canAddNewProperty()}
                          // className="bg-muted hover:bg-muted-foreground/20"
                        >
                          <PlusCircle className="h-4 w-4 mr-2" />
                          Add New
                        </Button>
                      </TooltipTrigger>
                      {!canAddNewProperty() && (
                        <TooltipContent>
                          <p>
                            Please fill out all properties before adding a new
                            one.
                          </p>
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </TooltipProvider> */}
                </div>
                {fields.map((item, index) => (
                  <div
                    key={item.id}
                    className="my-4 bg-border/20 p-2 rounded-md"
                  >
                    <div className="flex gap-4 items-center">
                      {/* Property Name */}
                      <FormField
                        control={form.control}
                        name={`properties[${index}].name` as any}
                        render={({ field }) => (
                          <FormItem className="flex flex-row gap-3 items-center justify-between rounded-lg border p-4 bg-card w-1/2">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">
                                Property Name
                              </FormLabel>
                            </div>
                            <FormControl>
                              <Input
                                type="text"
                                placeholder="E.g. Color"
                                {...field}
                                className="max-w-[50%]"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      {/* Property Value */}
                      <FormField
                        control={form.control}
                        name={`properties[${index}].value` as any}
                        render={({ field }) => (
                          <FormItem className="flex flex-row gap-3 items-center justify-between rounded-lg border p-4 bg-card w-1/2">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">
                                Property Value
                              </FormLabel>
                            </div>
                            <FormControl>
                              <Input
                                type="text"
                                placeholder="E.g. Red"
                                {...field}
                                className="max-w-[50%]"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      {/* Remove Button */}
                      <Button
                        onClick={() => remove(index)}
                        disabled={index === 0}
                        variant="ghost"
                        className="hover:bg-muted-foreground/20 items-center text-white/30 hover:text-red-500"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="font-medium flex flex-col gap-8 w-2/5 min-[2300px]:w-1/3 relative">
              {/* Image Preview */}
              <FilePreview
                file={form.watch("art")}
                fileType={fileType}
                className={`self-end ${
                  !fileType ? "opacity-50 cursor-not-allowed" : ""
                }`}
                disabled={fileType === "Unknown"}
              />

              <div className="relative group hover:shadow-sm w-[600px] h-[340px] rounded-lg bg-card cursor-pointer hover:bg-card self-end border">
                <div className="relative h-full">
                  {form.watch("image") ? (
                    <Image
                      src={URL.createObjectURL(form.watch("image"))}
                      alt={`Selected thumbnail`}
                      className={`rounded-lg `}
                      layout="fill"
                      objectFit="cover"
                    />
                  ) : (
                    <div className="flex justify-center items-center bg-card w-[100%] h-[100%] rounded-lg text-center p-5 font-semibold text-xl text-primary/30">
                      Select a Cover Image
                    </div>
                  )}
                  <div className="absolute rounded-b-lg inset-0 bg-gradient-to-t from-black to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end">
                    <p className="text-muted dark:text-muted-foreground mb-2 text-xl p-5">
                      {form.watch("title")
                        ? form.watch("title")
                        : "Give a name to your ART"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </form>

        {Object.entries(errors).map(([key, error]) => (
          <p key={key} className="text-red-500 text-sm mt-2">
            {key.charAt(0).toUpperCase() + key.slice(1)}: {error?.message}
          </p>
        ))}
      </Form>
    </div>
  );
};

export default CreateArtistry;
