import {
  CenteredTextInput,
  type CenteredTextInputProps,
  Typography,
  ValidationField,
  useTheme,
  fieldColors,
  fieldMetrics,
  fontSizes,
  fonts,
  spacing,
  useFieldOutlineError,
} from "@lucro-caseiro/ui";
import { AppIcon } from "./app-icon";
import type { AppIconName } from "./app-icon";
import React from "react";
import {
  Platform,
  Pressable,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
  TextInput,
} from "react-native";

/**
 * Padrão de formulários do app (ver `form-standard.md`).
 * Um só vocabulário de campo em todas as telas, no celular e no computador:
 * rótulo de 15 px acima, caixa de 48 px com raio 12, borda visível e foco rosa.
 * As medidas e cores vêm de `@lucro-caseiro/ui` (as mesmas do `Input`).
 */
export { fieldMetrics };

/** Cores derivadas do tema para os campos de formulário (claro e escuro). */
export function useFieldPalette() {
  const { theme } = useTheme();
  return { ...fieldColors(theme), sheetBg: theme.colors.surfaceElevated };
}

type FieldLabelProps = Readonly<{
  label: string;
  /** Mantido por compatibilidade: campos obrigatórios não levam marca. */
  required?: boolean;
  /** Mostra "(opcional)" discreto ao lado do rótulo. */
  optional?: boolean;
  hint?: string;
  nativeID?: string;
  /** Ação curta à direita do rótulo (ex.: "Gerar código"). */
  action?: React.ReactNode;
}>;

/**
 * Rótulo de campo (acima do campo). Campos opcionais levam "(opcional)";
 * obrigatórios ficam sem marca e a validação avisa o que falta.
 */
export function FieldLabel({ label, optional, hint, nativeID, action }: FieldLabelProps) {
  const { theme } = useTheme();
  return (
    <View style={{ gap: 2, marginBottom: fieldMetrics.labelGap }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
        <Typography
          nativeID={nativeID}
          variant="desktopFieldLabel"
          color={theme.colors.text}
          style={{ flexShrink: 1 }}
        >
          {label}
          {optional ? (
            <Typography variant="caption" color={theme.colors.textSecondary}>
              {" (opcional)"}
            </Typography>
          ) : null}
        </Typography>
        {action ? <View style={{ marginLeft: "auto" }}>{action}</View> : null}
      </View>
      {hint ? (
        <Typography variant="caption" color={theme.colors.textSecondary}>
          {hint}
        </Typography>
      ) : null}
    </View>
  );
}

type ValidationBinding = Readonly<{
  error?: string;
  summary?: string;
  registerFocus: (focus: () => void) => () => void;
}>;

export type FormFieldProps = Readonly<{
  label?: string;
  optional?: boolean;
  hint?: string;
  /** Resultado de `useFormValidation().field("nome")`: mostra o erro no campo. */
  validation?: ValidationBinding;
  /** Ocupa a linha inteira dentro de `FormGrid`. */
  span?: "one" | "full";
  labelAction?: React.ReactNode;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}>;

/** Rótulo + controle + erro: a peça básica dos formulários. */
export function FormField({
  label,
  optional,
  hint,
  validation,
  labelAction,
  children,
  style,
}: FormFieldProps) {
  const control = validation ? (
    <ValidationField {...validation}>{children}</ValidationField>
  ) : (
    children
  );
  return (
    <View style={[{ minWidth: 0 }, style]}>
      {label ? (
        <FieldLabel label={label} optional={optional} hint={hint} action={labelAction} />
      ) : null}
      {control}
    </View>
  );
}

export type TextFieldProps = Readonly<{
  icon?: AppIconName;
  /** Legado: o ícone agora fica sempre dentro do campo, sem faixa colorida. */
  iconSurface?: boolean;
  /** Texto fixo antes do valor (ex.: "R$"). */
  prefix?: string;
  /** Texto fixo depois do valor (ex.: "kg", "%"). */
  suffix?: string;
  /** Controle dentro do campo, à direita (ex.: mostrar senha). */
  right?: React.ReactNode;
  error?: boolean;
  inputRef?: React.Ref<TextInput>;
  inputStyle?: StyleProp<TextStyle>;
  containerStyle?: StyleProp<ViewStyle>;
}> &
  CenteredTextInputProps;

/** Borda/fundo do campo conforme foco e erro. */
function pressOpacity(disabled: boolean | undefined, pressed: boolean) {
  if (disabled) return 0.5;
  return pressed ? 0.85 : 1;
}

export function useFieldFrame(focused: boolean, errorProp = false): ViewStyle {
  const pal = useFieldPalette();
  const error = errorProp || !!useFieldOutlineError();
  let borderColor = pal.border;
  if (error) borderColor = pal.borderError;
  else if (focused) borderColor = pal.borderFocus;
  return {
    minHeight: fieldMetrics.height,
    borderRadius: fieldMetrics.radius,
    borderWidth: 1,
    borderColor,
    backgroundColor: focused ? pal.fieldBgFocus : pal.fieldBg,
    ...(Platform.OS === "web" && focused && !error
      ? ({ boxShadow: `0 0 0 3px ${pal.focusRing}` } as ViewStyle)
      : null),
  };
}

/** Campo de texto padrão, com ícone, prefixo ou sufixo opcionais. */
export function TextField({
  icon,
  iconSurface: _iconSurface,
  prefix,
  suffix,
  right,
  error = false,
  inputStyle,
  containerStyle,
  inputRef,
  multiline,
  ...inputProps
}: TextFieldProps) {
  const { theme } = useTheme();
  const pal = useFieldPalette();
  const [focused, setFocused] = React.useState(false);
  const frame = useFieldFrame(focused, error);
  return (
    <View
      style={[
        frame,
        {
          flexDirection: "row",
          alignItems: multiline ? "flex-start" : "center",
          minHeight: multiline ? fieldMetrics.multilineHeight : fieldMetrics.height,
          paddingHorizontal: fieldMetrics.paddingX,
          paddingVertical: multiline ? spacing.md : 0,
          gap: spacing.md,
          overflow: "hidden",
        },
        containerStyle,
      ]}
    >
      {icon ? (
        <AppIcon
          name={icon}
          size={fieldMetrics.iconSize}
          color={pal.icon}
          style={multiline ? { marginTop: 2 } : undefined}
        />
      ) : null}
      {prefix ? (
        <Typography variant="bodyBold" color={theme.colors.textSecondary}>
          {prefix}
        </Typography>
      ) : null}
      <CenteredTextInput
        ref={inputRef}
        accessibilityLabel={inputProps.accessibilityLabel ?? inputProps.placeholder}
        placeholderTextColor={pal.placeholder}
        multiline={multiline}
        style={[
          {
            flex: 1,
            minWidth: 0,
            color: theme.colors.text,
            fontSize: fontSizes.md,
            fontFamily: fonts.regular,
            paddingVertical: multiline ? 0 : spacing.sm,
            minHeight: multiline
              ? fieldMetrics.multilineHeight - spacing.md * 2
              : undefined,
            textAlignVertical: multiline ? "top" : "center",
          },
          inputStyle,
        ]}
        {...inputProps}
        onFocus={(event) => {
          setFocused(true);
          inputProps.onFocus?.(event);
        }}
        onBlur={(event) => {
          setFocused(false);
          inputProps.onBlur?.(event);
        }}
      />
      {suffix ? (
        <Typography variant="body" color={theme.colors.textSecondary}>
          {suffix}
        </Typography>
      ) : null}
      {right}
    </View>
  );
}

/** Ação curta ao lado do rótulo (ex.: "Gerar código"): link com ícone, sem ocupar altura. */
export function FieldLinkAction({
  label,
  icon,
  onPress,
  accessibilityLabel,
}: Readonly<{
  label: string;
  icon?: AppIconName;
  onPress: () => void;
  accessibilityLabel?: string;
}>) {
  const { theme } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      hitSlop={{ top: 12, bottom: 12, left: 8, right: 8 }}
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.xs,
        opacity: pressed ? 0.7 : 1,
      })}
    >
      {icon ? <AppIcon name={icon} size={16} color={theme.colors.primaryStrong} /> : null}
      <Typography variant="captionBold" color={theme.colors.primaryStrong}>
        {label}
      </Typography>
    </Pressable>
  );
}

/** Nome antigo do `TextField`, mantido para as telas antigas. */
export const TextFieldCard = TextField;

export type SelectFieldProps = Readonly<{
  value?: string;
  placeholder: string;
  onPress: () => void;
  icon?: AppIconName;
  accessibilityLabel: string;
  disabled?: boolean;
  error?: boolean;
  /** Ícone à direita; o padrão é a seta para baixo. */
  trailingIcon?: AppIconName;
}>;

/** Campo que abre uma escolha (categoria, cliente, data…). Mesma caixa do `TextField`. */
export function SelectField({
  value,
  placeholder,
  onPress,
  icon,
  accessibilityLabel,
  disabled = false,
  error = false,
  trailingIcon = "chevron-down",
}: SelectFieldProps) {
  const { theme } = useTheme();
  const pal = useFieldPalette();
  const [hovered, setHovered] = React.useState(false);
  const frame = useFieldFrame(false, error);
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      accessibilityRole="button"
      accessibilityLabel={value ? `${accessibilityLabel}: ${value}` : accessibilityLabel}
      accessibilityState={{ disabled }}
      style={({ pressed }) => [
        frame,
        {
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: fieldMetrics.paddingX,
          gap: spacing.md,
          opacity: pressOpacity(disabled, pressed),
        },
        hovered && !error ? { borderColor: pal.borderHover } : null,
      ]}
    >
      {icon ? (
        <AppIcon name={icon} size={fieldMetrics.iconSize} color={pal.icon} />
      ) : null}
      <Typography
        variant="body"
        color={value ? theme.colors.text : pal.placeholder}
        numberOfLines={1}
        style={{ flex: 1, minWidth: 0 }}
      >
        {value || placeholder}
      </Typography>
      <AppIcon name={trailingIcon} size={fieldMetrics.iconSize} color={pal.icon} />
    </Pressable>
  );
}

export type ChoiceOption<T extends string> = Readonly<{
  value: T;
  label: string;
  icon?: AppIconName;
  description?: string;
  disabled?: boolean;
  /** Recurso de plano pago: mostra um cadeado; o toque ainda chama `onChange`. */
  locked?: boolean;
}>;

/**
 * Escolha única entre 2 a 4 opções curtas, lado a lado (ex.: "Por unidade" /
 * "Por quilo"). Selecionada: fundo rosado, borda vinho e marca de confirmação.
 */
export function ChoiceField<T extends string>({
  value,
  options,
  onChange,
  accessibilityLabel,
}: Readonly<{
  value: T;
  options: readonly ChoiceOption<T>[];
  onChange: (value: T) => void;
  accessibilityLabel: string;
}>) {
  const { theme } = useTheme();
  const pal = useFieldPalette();
  return (
    <View
      accessibilityRole="radiogroup"
      accessibilityLabel={accessibilityLabel}
      style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            disabled={option.disabled}
            accessibilityRole="radio"
            accessibilityLabel={
              option.locked ? `${option.label}, recurso de plano pago` : option.label
            }
            accessibilityHint={option.description}
            accessibilityState={{
              selected,
              checked: selected,
              disabled: option.disabled,
            }}
            style={({ pressed }) => ({
              flexGrow: 1,
              flexBasis: 140,
              minHeight: option.description ? 64 : fieldMetrics.height,
              borderRadius: fieldMetrics.radius,
              borderWidth: selected ? 2 : 1,
              borderColor: selected ? theme.colors.primaryStrong : pal.border,
              backgroundColor: selected ? theme.colors.primaryBg : pal.fieldBgFocus,
              paddingHorizontal: fieldMetrics.paddingX - (selected ? 1 : 0),
              paddingVertical: option.description ? spacing.md : 0,
              flexDirection: "row",
              alignItems: "center",
              gap: spacing.md,
              opacity: pressOpacity(option.disabled, pressed),
            })}
          >
            {option.icon ? (
              <AppIcon
                name={option.icon}
                size={fieldMetrics.iconSize}
                color={selected ? theme.colors.primaryStrong : pal.icon}
              />
            ) : null}
            <View style={{ flex: 1, minWidth: 0 }}>
              <Typography
                variant="bodyBold"
                color={selected ? theme.colors.primaryStrong : theme.colors.text}
              >
                {option.label}
              </Typography>
              {option.description ? (
                <Typography variant="caption" color={theme.colors.textSecondary}>
                  {option.description}
                </Typography>
              ) : null}
            </View>
            {option.locked && !selected ? (
              <AppIcon name="lock-closed" size={16} color={theme.colors.premium} />
            ) : null}
            {selected ? (
              <AppIcon
                name="checkmark-circle"
                size={fieldMetrics.iconSize}
                color={theme.colors.primaryStrong}
              />
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}
