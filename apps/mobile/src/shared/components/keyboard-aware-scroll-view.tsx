import React from "react";
import { ValidationScrollContext } from "@lucro-caseiro/ui";
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TextInput,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type MeasureInWindowOnSuccessCallback,
  type ScrollViewProps,
  type View,
} from "react-native";

type KeyboardAwareScrollViewProps = ScrollViewProps & {
  scrollRef?: React.RefObject<ScrollView | null>;
  keyboardVerticalOffset?: number;
  extraScrollHeight?: number;
};

type KeyboardScrollable = Pick<ScrollView, "getNativeScrollRef" | "scrollTo">;
type FocusedInput = ReturnType<typeof TextInput.State.currentlyFocusedInput>;

function scheduleAfterKeyboardLayout(callback: () => void) {
  let layoutFrame: number | null = null;
  const keyboardFrame = requestAnimationFrame(() => {
    layoutFrame = requestAnimationFrame(callback);
  });

  return () => {
    cancelAnimationFrame(keyboardFrame);
    if (layoutFrame !== null) cancelAnimationFrame(layoutFrame);
  };
}

export function scrollInputIntoVisibleArea(
  scrollView: KeyboardScrollable | null,
  focusedInput: FocusedInput | null | undefined,
  scrollOffsetY: number,
  extraScrollHeight: number,
) {
  if (!scrollView || !focusedInput || Platform.OS === "web") return;

  const measureInput = (
    scrollViewTop: number,
    scrollViewHeight: number,
  ): MeasureInWindowOnSuccessCallback => {
    return (_x, inputTop, _width, inputHeight) => {
      const visibleTop = scrollViewTop + extraScrollHeight;
      const visibleBottom = scrollViewTop + scrollViewHeight - extraScrollHeight;
      const inputBottom = inputTop + inputHeight;
      let delta = 0;

      if (inputBottom > visibleBottom) {
        delta = inputBottom - visibleBottom;
      } else if (inputTop < visibleTop) {
        delta = inputTop - visibleTop;
      }

      if (Math.abs(delta) < 1) return;
      scrollView.scrollTo({
        y: Math.max(0, scrollOffsetY + delta),
        animated: true,
      });
    };
  };

  const measureScrollView: MeasureInWindowOnSuccessCallback = (
    _x,
    scrollViewTop,
    _width,
    scrollViewHeight,
  ) => {
    focusedInput.measureInWindow(measureInput(scrollViewTop, scrollViewHeight));
  };
  scrollView.getNativeScrollRef()?.measureInWindow(measureScrollView);
}

export function useScrollFocusedInputIntoView(
  scrollViewRef: React.RefObject<ScrollView | null>,
  extraScrollHeight: number,
  enabled = true,
) {
  const scrollOffsetRef = React.useRef(0);
  const trackScroll = React.useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      scrollOffsetRef.current = event.nativeEvent.contentOffset.y;
    },
    [],
  );
  const scrollFocusedInput = React.useCallback(() => {
    if (Platform.OS === "web") return;
    scrollInputIntoVisibleArea(
      scrollViewRef.current,
      TextInput.State.currentlyFocusedInput(),
      scrollOffsetRef.current,
      extraScrollHeight,
    );
  }, [extraScrollHeight, scrollViewRef]);

  React.useEffect(() => {
    if (!enabled || Platform.OS === "web") return;

    let cancelScheduledScroll: (() => void) | undefined;
    const keyboardShowEvent =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const subscription = Keyboard.addListener(keyboardShowEvent, () => {
      cancelScheduledScroll?.();
      cancelScheduledScroll = scheduleAfterKeyboardLayout(scrollFocusedInput);
    });

    return () => {
      subscription.remove();
      cancelScheduledScroll?.();
    };
  }, [enabled, scrollFocusedInput]);

  const scrollValidationField = React.useCallback(
    (target: View) => {
      if (Platform.OS === "web") return;
      const scroll = scrollViewRef.current;
      scroll?.getNativeScrollRef()?.measureInWindow((_x, top) => {
        target.measureInWindow((_fieldX, fieldTop) => {
          scroll.scrollTo({
            y: Math.max(0, scrollOffsetRef.current + fieldTop - top - extraScrollHeight),
            animated: true,
          });
        });
      });
    },
    [scrollViewRef, extraScrollHeight],
  );
  return { scrollFocusedInput, trackScroll, scrollValidationField };
}

export function KeyboardAwareScrollView({
  children,
  keyboardVerticalOffset = 0,
  extraScrollHeight = 24,
  keyboardShouldPersistTaps = "handled",
  showsVerticalScrollIndicator = false,
  style,
  onFocus,
  onScroll,
  scrollRef,
  ...props
}: Readonly<KeyboardAwareScrollViewProps>) {
  const internalScrollRef = React.useRef<ScrollView>(null);
  const scrollViewRef = scrollRef ?? internalScrollRef;
  const { scrollFocusedInput, trackScroll, scrollValidationField } =
    useScrollFocusedInputIntoView(scrollViewRef, extraScrollHeight);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={keyboardVerticalOffset}
      style={[{ flex: 1, minHeight: 0 }, style]}
    >
      <ScrollView
        ref={scrollViewRef}
        style={{ flex: 1, minHeight: 0 }}
        keyboardShouldPersistTaps={keyboardShouldPersistTaps}
        keyboardDismissMode={Platform.select({
          ios: "interactive",
          android: "on-drag",
          default: "none",
        } as const)}
        showsVerticalScrollIndicator={showsVerticalScrollIndicator}
        scrollEventThrottle={16}
        onFocus={(event) => {
          onFocus?.(event);
          scrollFocusedInput();
        }}
        onScroll={(event) => {
          trackScroll(event);
          onScroll?.(event);
        }}
        {...props}
      >
        <ValidationScrollContext.Provider value={scrollValidationField}>
          {children}
        </ValidationScrollContext.Provider>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
