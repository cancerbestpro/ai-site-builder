import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Eye, Code, BarChart3, Rocket, Save } from "lucide-react";
import CodeEditor from "./CodeEditor";
import { Sandpack } from "@codesandbox/sandpack-react";

interface BuilderPreviewProps {
  files: Array<{ name: string; content: string; status: 'creating' | 'complete' }>;
  currentView: 'preview' | 'code' | 'analytics';
  onViewChange: (view: 'preview' | 'code' | 'analytics') => void;
  onFilesChange: (files: Array<{ name: string; content: string; status: 'creating' | 'complete' }>) => void;
  onSave: () => void;
}

const BuilderPreview = ({ files, currentView, onViewChange, onFilesChange, onSave }: BuilderPreviewProps) => {
  const handleFileChange = (index: number, newContent: string) => {
    const updatedFiles = [...files];
    updatedFiles[index] = { ...updatedFiles[index], content: newContent };
    onFilesChange(updatedFiles);
  };

  // Convert files to Sandpack format
  const sandpackFiles = files.reduce((acc, file) => {
    const path = file.name.startsWith('/') ? file.name : `/${file.name}`;
    acc[path] = { code: file.content };
    return acc;
  }, {} as Record<string, { code: string }>);

  return (
    <div className="flex-1 flex flex-col bg-background">
      {/* Header */}
      <div className="h-14 border-b border-border flex items-center justify-between px-6">
        <Tabs value={currentView} onValueChange={(v) => onViewChange(v as any)} className="flex-1">
          <TabsList>
            <TabsTrigger value="preview" className="gap-2">
              <Eye className="w-4 h-4" />
              Preview
            </TabsTrigger>
            <TabsTrigger value="code" className="gap-2">
              <Code className="w-4 h-4" />
              Code
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-2">
              <BarChart3 className="w-4 h-4" />
              Analytics
            </TabsTrigger>
          </TabsList>
        </Tabs>
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={onSave} className="gap-2">
            <Save className="w-4 h-4" />
            Save
          </Button>
          <Button variant="default" className="gap-2">
            <Rocket className="w-4 h-4" />
            Publish
          </Button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-auto">
        <Tabs value={currentView} className="h-full">
          <TabsContent value="preview" className="h-full m-0 p-0">
            {files.length > 0 ? (
              <div className="h-full">
                <Sandpack
                  template="react-ts"
                  files={sandpackFiles}
                  theme="dark"
                  options={{
                    showNavigator: true,
                    showLineNumbers: true,
                    showInlineErrors: true,
                    wrapContent: true,
                    editorHeight: "100%",
                  }}
                />
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <div className="text-center">
                  <Eye className="w-16 h-16 mx-auto mb-4 opacity-20" />
                  <p>No preview available yet</p>
                  <p className="text-sm mt-2">Generate a website to see the preview</p>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="code" className="h-full m-0 p-6">
            {files.length > 0 ? (
              <div className="space-y-6">
                {files.map((file, idx) => (
                  <CodeEditor
                    key={idx}
                    file={file}
                    onChange={(newContent) => handleFileChange(idx, newContent)}
                  />
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <div className="text-center">
                  <Code className="w-16 h-16 mx-auto mb-4 opacity-20" />
                  <p>No code generated yet</p>
                  <p className="text-sm mt-2">Generate a website to see the code</p>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="analytics" className="h-full m-0 p-6">
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <div className="text-center">
                <BarChart3 className="w-16 h-16 mx-auto mb-4 opacity-20" />
                <p>Analytics coming soon</p>
                <p className="text-sm mt-2">Track your website's performance</p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default BuilderPreview;
