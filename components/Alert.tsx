// components/Alert.tsx
interface AlertProps {
  message: string;
  type?: "success" | "error" | "warning" | "info";
}

export default function Alert({ message, type = "info" }: AlertProps) {
  const colors = {
    success: "bg-[hsl(160_20%_50%_/_0.12)] text-[hsl(160_15%_82%)] border border-[hsl(160_20%_50%_/_0.25)]",
    error: "bg-neutral-800 text-neutral-200 border border-[color:var(--border-soft)]",
    warning: "bg-neutral-800 text-neutral-200 border border-[color:var(--border-soft)]",
    info: "bg-neutral-800 text-neutral-300 border border-[color:var(--border-soft)]",
  };

  return <div className={`p-3 rounded ${colors[type]}`}>{message}</div>;
}
