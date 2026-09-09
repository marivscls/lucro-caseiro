/** Vertical inset for a text block; overflowing content keeps its normal scroll area. */
export function centeredTextPadding(
  availableHeight: number,
  contentHeight: number,
): number {
  return Math.max(0, (availableHeight - contentHeight) / 2);
}

/** The web TextInput host is a textarea. Keep DOM-specific work out of native paths. */
interface TextAreaHost {
  tagName?: string;
  clientHeight: number;
  scrollHeight: number;
  scrollTop: number;
  style: {
    height: string;
    minHeight: string;
    paddingTop: string;
    paddingBottom: string;
  };
}

export function centerWebTextInput(host: unknown): void {
  const field = host as TextAreaHost | null;
  if (field?.tagName !== "TEXTAREA" || field.clientHeight === 0) return;
  const availableHeight = field.clientHeight;
  const { height, minHeight } = field.style;
  const scrollTop = field.scrollTop;
  // Measure the actual wrapped text (or placeholder), without the textarea's
  // minimum height and padding artificially inflating scrollHeight.
  field.style.height = "0px";
  field.style.minHeight = "0px";
  field.style.paddingTop = "0px";
  field.style.paddingBottom = "0px";
  const contentHeight = field.scrollHeight;
  field.style.height = height;
  field.style.minHeight = minHeight;
  const padding = centeredTextPadding(availableHeight, contentHeight);
  field.style.paddingTop = `${padding}px`;
  field.style.paddingBottom = `${padding}px`;
  field.scrollTop = contentHeight <= availableHeight ? 0 : scrollTop;
}
