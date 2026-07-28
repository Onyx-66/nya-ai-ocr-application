import { useToast } from "@/components/ui/use-toast";
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast";
import { Info, CheckCircle2, AlertCircle } from "lucide-react";

const ICONS = {
  default: Info,
  success: CheckCircle2,
  destructive: AlertCircle,
};
const ICON_CLASS = {
  default: "text-[hsl(var(--c-accent))]",
  success: "text-emerald-400",
  destructive: "text-rose-400",
};

export function Toaster() {
  const { toasts } = useToast();

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, variant, ...props }) {
        const Icon = ICONS[variant] || ICONS.default;
        return (
          <Toast key={id} variant={variant} {...props}>
            <Icon className={`h-5 w-5 flex-shrink-0 mt-0.5 ${ICON_CLASS[variant] || ICON_CLASS.default}`} />
            <div className="grid gap-1 flex-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && (
                <ToastDescription>{description}</ToastDescription>
              )}
            </div>
            {action}
            <ToastClose />
          </Toast>
        );
      })}
      <ToastViewport />
    </ToastProvider>
  );
}