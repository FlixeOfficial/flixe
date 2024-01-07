import dynamic from "next/dynamic";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
// import { FormDataProp } from "../create-nft";
import { useRef } from "react";
// import UploadFile from "../upload-file";

// Importing the code editor component with dynamic imports
const CodeEditor = dynamic(() => import("./CodeEditor"), {
  ssr: false,
});

type FormDataProp = {
  ide: {
    html: string;
    css: string;
    js: string;
  };
};

type InteractiveNFTProps = {
  formData: FormDataProp;
  setFormData: React.Dispatch<React.SetStateAction<FormDataProp>>;
};

export default function InteractiveNFT({
  formData,
  setFormData,
}: InteractiveNFTProps) {
  const coverInputRef = useRef<HTMLInputElement>(null);
  const open = true;
  return (
    <div className="grid grid-cols-1 w-full gap-y-4 rounded-3xl dark:bg-light-dark max-w-2xl mx-auto p-6">
      {(["html", "css", "js"] as const).map((mode) => (
        <Accordion key={mode} type="single" collapsible>
          <AccordionItem value="item-1">
            <AccordionTrigger
              className="flex justify-between w-full px-4 py-2 text-sm font-medium text-left text-white bg-dark border dark:border-gray-700 rounded-2xl focus:outline-none focus-visible:ring focus-visible:ring-blue-500 focus-visible:ring-opacity-75 transition-all duration-200"
            >
              <span className="text-base tracking-widest my-auto">
                <b>{mode.toUpperCase()}</b>
                {"  "}
                Code
              </span>
            </AccordionTrigger>
            <AccordionContent
              className={`-mt-4 ${
                open ? "block" : "hidden"
              } rounded-b-2xl m-auto w-full`}
            >
              <CodeEditor
                mode={mode as any}
                value={
                  mode === "html"
                    ? formData.ide.html
                    : mode === "css"
                    ? formData.ide.css
                    : formData.ide.js
                }
                onChange={(value) => {
                  if (mode === "html") {
                    setFormData((prevState) => ({
                      ...prevState,
                      ide: {
                        ...prevState.ide,
                        html: value,
                      },
                    }));
                  }
                  if (mode === "css") {
                    setFormData((prevState) => ({
                      ...prevState,
                      ide: {
                        ...prevState.ide,
                        css: value,
                      },
                    }));
                  }
                  if (mode === "js") {
                    setFormData((prevState) => ({
                      ...prevState,
                      ide: {
                        ...prevState.ide,
                        js: value,
                      },
                    }));
                  }
                }}
              />
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      ))}
      {/* <div className=" border-gray-200 dark:border-gray-700 dark:bg-dark border rounded-2xl py-5">
        <UploadFile
          fileData={formData}
          setFileData={setFormData}
          coverInputRef={coverInputRef}
        />
      </div> */}
    </div>
  );
}
