import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Eye, Code, BarChart3, Rocket } from "lucide-react";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface BuilderPreviewProps {
  files: Array<{ name: string; content: string; status: 'creating' | 'complete' }>;
  currentView: 'preview' | 'code' | 'analytics';
  onViewChange: (view: 'preview' | 'code' | 'analytics') => void;
}

const BuilderPreview = ({ files, currentView, onViewChange }: BuilderPreviewProps) => {
  const htmlFile = files.find(f => f.name.endsWith('.html'));

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
        
        <Button variant="default" className="gap-2">
          <Rocket className="w-4 h-4" />
          Publish
        </Button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-auto">
        <Tabs value={currentView} className="h-full">
          <TabsContent value="preview" className="h-full m-0 p-6">
            {htmlFile ? (
              <div className="bg-white rounded-lg border border-border h-full overflow-auto">
                <iframe
                  srcDoc={htmlFile.content}
                  className="w-full h-full"
                  title="Preview"
                  sandbox="allow-scripts"
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
              <div className="space-y-4">
                {files.map((file, idx) => (
                  <div key={idx} className="border border-border rounded-lg overflow-hidden">
                    <div className="bg-muted px-4 py-2 font-mono text-sm font-semibold">
                      {file.name}
                    </div>
                    <SyntaxHighlighter
                      language={file.name.endsWith('.html') ? 'html' : file.name.endsWith('.css') ? 'css' : 'javascript'}
                      style={vscDarkPlus}
                      customStyle={{ margin: 0, borderRadius: 0 }}
                    >
                      {file.content}
                    </SyntaxHighlighter>
                  </div>
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
