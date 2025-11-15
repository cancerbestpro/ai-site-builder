import { useState, useEffect } from "react";

interface StreamingMessageProps {
  content: string;
}

const StreamingMessage = ({ content }: StreamingMessageProps) => {
  const [displayedContent, setDisplayedContent] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (currentIndex < content.length) {
      const timeout = setTimeout(() => {
        setDisplayedContent(prev => prev + content[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, 20);

      return () => clearTimeout(timeout);
    }
  }, [currentIndex, content]);

  return (
    <p className="text-sm">
      {displayedContent}
      {currentIndex < content.length && (
        <span className="inline-block w-1 h-4 bg-current animate-pulse ml-1" />
      )}
    </p>
  );
};

export default StreamingMessage;
