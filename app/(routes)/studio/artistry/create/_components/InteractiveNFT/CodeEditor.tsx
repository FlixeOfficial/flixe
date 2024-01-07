import React from "react";
import AceEditor from "react-ace-builds";

import "ace-builds/src-noconflict/mode-html";
import "ace-builds/src-noconflict/mode-css";
import "ace-builds/src-noconflict/mode-javascript";
import "ace-builds/src-noconflict/theme-chaos";
// import Scrollbar from "@/components/ui/scrollbar";

interface CodeEditorProps {
    mode: "html" | "css" | "js";
    value?: string;
    onChange: (value: string) => void;
}

const CodeEditor: React.FC<CodeEditorProps> = ({ mode, value, onChange }) => {
    return (
        // <Scrollbar>
            <AceEditor
                mode={mode}
                theme="chaos"
                value={value}
                onChange={onChange}
                name={`${mode}-editor`}
                editorProps={{ $blockScrolling: true }}
                fontSize={14}
                showPrintMargin={false}
                showGutter={true}
                highlightActiveLine={true}
                setOptions={{
                    enableBasicAutocompletion: true,
                    enableLiveAutocompletion: true,
                    enableSnippets: true,
                    showLineNumbers: true,
                    tabSize: 2,
                }}
                style={{ width: "100%"}}
                className={
                    "w-full h-full rounded-b-xl border border-gray-200 dark:border-gray-700"
                }
            />
        // </Scrollbar>
    );
};

export default CodeEditor;
