import ReactMarkdown from "react-markdown";

export function Markdown({ source }: { source: string }) {
  return (
    <div className="md">
      <ReactMarkdown>{source}</ReactMarkdown>
    </div>
  );
}
