import { notifications } from "@mantine/notifications";

type ToastPayload = string | { title?: string; description?: string };
type ToastOptions = { title?: string; description?: string };

function normalize(input: ToastPayload, fallbackTitle: string, extra?: ToastOptions) {
  if (typeof input === "string") {
    return {
      title: extra?.title || fallbackTitle,
      message: extra?.description || input,
    };
  }

  return {
    title: input.title || extra?.title || fallbackTitle,
    message: input.description || extra?.description || "",
  };
}

function show(color: string, input: ToastPayload, extra?: ToastOptions) {
  const { title, message } = normalize(input, "Notice", extra);
  notifications.show({
    color,
    title,
    message,
    autoClose: 3000,
  });
}

type SuccessOptions = string | ToastOptions;
type ErrorOptions = string | ToastOptions;

type ToastFn = ((input: ToastPayload) => void) & {
  success: (input: SuccessOptions, extra?: ToastOptions) => void;
  error: (input: ErrorOptions, extra?: ToastOptions) => void;
  warning: (input: ToastPayload, extra?: ToastOptions) => void;
};

export const toast: ToastFn = Object.assign(
  (input: ToastPayload) => show("teal", input),
  {
    success: (input: SuccessOptions, extra?: ToastOptions) => show("teal", input, extra),
    error: (input: ErrorOptions, extra?: ToastOptions) => show("red", input, extra),
    warning: (input: ToastPayload, extra?: ToastOptions) => show("yellow", input, extra),
  },
);
