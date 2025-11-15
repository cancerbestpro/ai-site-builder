import Editor from '@monaco-editor/react';
import { Card } from '@/components/ui/card';

interface CodeEditorProps {
  file: {
    name: string;
    content: string;
    status: 'creating' | 'complete';
  };
  onChange: (content: string) => void;
}

const CodeEditor = ({ file, onChange }: CodeEditorProps) => {
  const getLanguage = (filename: string) => {
    if (filename.endsWith('.html')) return 'html';
    if (filename.endsWith('.css')) return 'css';
    if (filename.endsWith('.js') || filename.endsWith('.jsx')) return 'javascript';
    if (filename.endsWith('.ts') || filename.endsWith('.tsx')) return 'typescript';
    if (filename.endsWith('.json')) return 'json';
    return 'plaintext';
  };

  return (
    <Card className="overflow-hidden border-border">
      <div className="bg-muted px-4 py-2 font-mono text-sm font-semibold border-b border-border">
        {file.name}
      </div>
      <Editor
        height="500px"
        language={getLanguage(file.name)}
        value={file.content}
        onChange={(value) => onChange(value || '')}
        theme="vs-dark"
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          lineNumbers: 'on',
          scrollBeyondLastLine: false,
          automaticLayout: true,
          tabSize: 2,
          wordWrap: 'on',
        }}
      />
    </Card>
  );
};

export default CodeEditor;
