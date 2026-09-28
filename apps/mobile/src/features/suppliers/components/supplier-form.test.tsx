import React from "react";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  pick: vi.fn(),
  upload: vi.fn(),
}));

vi.mock("@lucro-caseiro/ui", async () => ({
  ValidationField: (
    await import("../../../../../../packages/ui/src/components/validation-field")
  ).ValidationField,
  Button: ({
    title,
    onPress,
    accessibilityLabel,
    disabled,
  }: {
    title: string;
    onPress?: () => void;
    accessibilityLabel?: string;
    disabled?: boolean;
  }) => (
    <button
      type="button"
      aria-label={accessibilityLabel ?? title}
      disabled={disabled}
      onClick={onPress}
    >
      {title}
    </button>
  ),
  Typography: ({ children }: { children?: React.ReactNode }) => <span>{children}</span>,
  radii: { sm: 8, lg: 16, full: 999 },
  spacing: { xs: 4, sm: 8, md: 12, lg: 16, xl: 20 },
  useTheme: () => ({
    theme: {
      colors: {
        alert: "red",
        border: "#ddd",
        primaryBg: "pink",
        primaryInteractive: "#733",
        primaryLight: "#c99",
        primaryStrong: "#733",
        surface: "#eee",
        surfaceElevated: "white",
        text: "#222",
        textSecondary: "#666",
      },
    },
  }),
}));

vi.mock("../../../shared/components/form-field", async () => {
  const { ValidationField } =
    await import("../../../../../../packages/ui/src/components/validation-field");
  return {
    fieldMetrics: { height: 48, radius: 12, paddingX: 14, iconSize: 20 },
    useFieldPalette: () => ({
      border: "#ddd",
      fieldBg: "white",
      fieldBgFocus: "white",
      icon: "#666",
    }),
    FormField: ({
      label,
      hint,
      validation,
      children,
    }: {
      label?: string;
      hint?: string;
      validation?: React.ComponentProps<typeof ValidationField>;
      children: React.ReactNode;
    }) => (
      <div>
        {label ? <span>{label}</span> : null}
        {hint ? <span>{hint}</span> : null}
        {validation ? (
          <ValidationField {...validation}>{children}</ValidationField>
        ) : (
          children
        )}
      </div>
    ),
    TextField: ({
      accessibilityLabel,
      value,
      onChangeText,
      multiline,
    }: {
      accessibilityLabel: string;
      value: string;
      onChangeText: (value: string) => void;
      multiline?: boolean;
    }) =>
      multiline ? (
        <textarea
          aria-label={accessibilityLabel}
          value={value}
          onChange={(event) => onChangeText(event.target.value)}
        />
      ) : (
        <input
          aria-label={accessibilityLabel}
          value={value}
          onChange={(event) => onChangeText(event.target.value)}
        />
      ),
    ChoiceField: ({
      value,
      options,
      onChange,
      accessibilityLabel,
    }: {
      value: string;
      options: { value: string; label: string }[];
      onChange: (value: string) => void;
      accessibilityLabel: string;
    }) => (
      <div role="radiogroup" aria-label={accessibilityLabel}>
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={option.value === value}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
    ),
  };
});
vi.mock("../../../shared/components/form-layout", () => ({
  FormBody: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  FormGrid: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
}));
vi.mock("../../../shared/components/form-section", () => ({
  FormSection: ({ title, children }: { title: string; children?: React.ReactNode }) => (
    <section>
      <h2>{title}</h2>
      {children}
    </section>
  ),
}));

vi.mock("react-native", () => ({
  Text: ({ children }: { children?: React.ReactNode }) => <span>{children}</span>,
  Platform: { OS: "web" },
  View: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  ScrollView: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  Image: ({ source }: { source: { uri: string } }) => (
    <img alt="Pré-visualização" src={source.uri} />
  ),
  Pressable: ({
    children,
    onPress,
    accessibilityLabel,
    accessibilityRole,
    accessibilityState,
    disabled,
  }: {
    children?: React.ReactNode;
    onPress?: () => void;
    accessibilityLabel?: string;
    accessibilityRole?: string;
    accessibilityState?: { selected?: boolean; checked?: boolean };
    disabled?: boolean;
  }) => (
    <button
      type="button"
      aria-label={accessibilityLabel}
      aria-pressed={accessibilityState?.selected}
      aria-checked={accessibilityState?.checked}
      role={accessibilityRole === "checkbox" ? "checkbox" : "button"}
      disabled={disabled}
      onClick={onPress}
    >
      {children}
    </button>
  ),
  Switch: ({
    value,
    onValueChange,
    accessibilityLabel,
  }: {
    value: boolean;
    onValueChange: (value: boolean) => void;
    accessibilityLabel: string;
  }) => (
    <input
      type="checkbox"
      aria-label={accessibilityLabel}
      checked={value}
      onChange={(event) => onValueChange(event.target.checked)}
    />
  ),
}));

vi.mock("../../../shared/components/app-icon", () => ({ AppIcon: () => null }));
vi.mock("./supplier-illustration", () => ({ SupplierIllustration: () => null }));
vi.mock("../../../shared/hooks/use-image-picker", () => ({
  useImagePicker: () => ({ pickFromGalleryAsset: mocks.pick }),
}));
vi.mock("../../../shared/utils/upload-image", () => ({
  uploadSupplierImage: mocks.upload,
}));

import { SupplierForm, type SupplierFormHandle } from "./supplier-form";

describe("SupplierForm", () => {
  beforeEach(() => {
    mocks.pick.mockReset();
    mocks.upload.mockReset();
  });
  afterEach(cleanup);

  it("validates the required name and invalid email", async () => {
    const onSubmit = vi.fn();
    const ref = React.createRef<SupplierFormHandle>();
    render(<SupplierForm ref={ref} onSubmit={onSubmit} />);
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "invalido" },
    });

    await act(async () => {
      await ref.current?.submit();
    });

    expect(screen.getByText("Informe o nome do fornecedor.")).toBeTruthy();
    expect(screen.getByText("Confira o email informado.")).toBeTruthy();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("validates WhatsApp enabled without a phone", async () => {
    const ref = React.createRef<SupplierFormHandle>();
    render(<SupplierForm ref={ref} onSubmit={vi.fn()} />);
    fireEvent.change(screen.getByLabelText("Nome do fornecedor"), {
      target: { value: "Bella" },
    });
    fireEvent.click(screen.getByLabelText("Tem WhatsApp"));

    await act(async () => {
      await ref.current?.submit();
    });

    expect(screen.getByText("Informe o telefone para ativar o WhatsApp.")).toBeTruthy();
  });

  it("changes category and immediately refreshes preset suggestions", () => {
    render(<SupplierForm onSubmit={vi.fn()} />);
    expect(
      screen.getByRole("radio", { name: "Insumos" }).getAttribute("aria-checked"),
    ).toBe("true");
    fireEvent.click(screen.getByRole("radio", { name: "Alimentos" }));

    expect(screen.getByText("Sugestões para Alimentos")).toBeTruthy();
    expect(
      screen
        .getByRole("button", { name: "Caixa de frutas e verduras" })
        .getAttribute("aria-pressed"),
    ).toBe("true");
  });

  it("selects a preset and toggles preferred", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const ref = React.createRef<SupplierFormHandle>();
    render(<SupplierForm ref={ref} onSubmit={onSubmit} />);
    fireEvent.change(screen.getByLabelText("Nome do fornecedor"), {
      target: { value: "Central" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Ramo de trigo" }));
    fireEvent.click(
      screen.getByRole("checkbox", { name: "Marcar como fornecedor preferido" }),
    );

    await act(async () => {
      await ref.current?.submit();
    });

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        avatarPresetId: "supplies-wheat",
        avatarType: "preset",
        isPreferred: true,
      }),
    );
  });

  it("uploads only on submit and lets the user remove the preview", async () => {
    const selectedFile = {
      type: "image/webp",
      arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(12)),
    } as unknown as File;
    expect(selectedFile).not.toBeInstanceOf(Blob);
    mocks.pick.mockResolvedValue({
      uri: "blob:foto",
      mimeType: "image/webp",
      fileSize: 1024,
      file: selectedFile,
    });
    mocks.upload.mockResolvedValue("https://cdn.example/supplier.webp");
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const ref = React.createRef<SupplierFormHandle>();
    render(<SupplierForm ref={ref} onSubmit={onSubmit} />);
    fireEvent.change(screen.getByLabelText("Nome do fornecedor"), {
      target: { value: "Central" },
    });

    act(() => {
      fireEvent.click(
        screen.getByRole("button", { name: "Enviar imagem do fornecedor" }),
      );
    });
    expect(mocks.upload).not.toHaveBeenCalled();
    expect(await screen.findByAltText("Pré-visualização")).toBeTruthy();

    await act(async () => {
      await ref.current?.submit();
    });
    expect(mocks.upload).toHaveBeenCalledOnce();
    expect(mocks.upload).toHaveBeenCalledWith("blob:foto", selectedFile, "image/webp");
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        avatarType: "upload",
        avatarUrl: "https://cdn.example/supplier.webp",
      }),
    );

    fireEvent.click(screen.getByRole("button", { name: "Remover imagem do fornecedor" }));
    expect(screen.queryByAltText("Pré-visualização")).toBeNull();
  });

  it("rejects an unsupported image before creating a preview", async () => {
    mocks.pick.mockResolvedValue({
      uri: "foto.gif",
      mimeType: "image/gif",
      fileSize: 1024,
    });
    render(<SupplierForm onSubmit={vi.fn()} />);

    act(() => {
      fireEvent.click(
        screen.getByRole("button", { name: "Enviar imagem do fornecedor" }),
      );
    });

    expect(await screen.findByText("Use uma imagem PNG, JPEG ou WebP.")).toBeTruthy();
    expect(screen.queryByAltText("Pré-visualização")).toBeNull();
  });

  it("rejects an image above the 5 MB limit", async () => {
    mocks.pick.mockResolvedValue({
      uri: "foto.webp",
      mimeType: "image/webp",
      fileSize: 5 * 1024 * 1024 + 1,
    });
    render(<SupplierForm onSubmit={vi.fn()} />);

    act(() => {
      fireEvent.click(
        screen.getByRole("button", { name: "Enviar imagem do fornecedor" }),
      );
    });

    expect(await screen.findByText("A imagem deve ter no máximo 5 MB.")).toBeTruthy();
  });

  it("prevents duplicate submits while the first request is running", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const ref = React.createRef<SupplierFormHandle>();
    render(<SupplierForm ref={ref} onSubmit={onSubmit} />);
    fireEvent.change(screen.getByLabelText("Nome do fornecedor"), {
      target: { value: "Central" },
    });

    await act(async () => {
      await Promise.all([ref.current!.submit(), ref.current!.submit()]);
    });

    expect(onSubmit).toHaveBeenCalledOnce();
  });

  it("loads current values and submits an edited supplier", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const ref = React.createRef<SupplierFormHandle>();
    render(
      <SupplierForm
        ref={ref}
        supplier={{
          id: "11111111-1111-4111-8111-111111111111",
          userId: "22222222-2222-4222-8222-222222222222",
          name: "Fornecedor atual",
          category: "packaging",
          phone: "11999998888",
          hasWhatsApp: true,
          email: "contato@atual.com",
          address: "Rua Atual, 10",
          purchaseDescription: "Caixas e etiquetas",
          notes: null,
          isPreferred: true,
          avatarType: "preset",
          avatarPresetId: "packaging-label",
          avatarUrl: null,
          needsFollowUp: false,
          restockSoon: false,
          isActive: true,
          createdAt: "2026-01-01T00:00:00.000Z",
          updatedAt: "2026-01-01T00:00:00.000Z",
        }}
        onSubmit={onSubmit}
      />,
    );

    expect(screen.getByLabelText<HTMLInputElement>("Nome do fornecedor").value).toBe(
      "Fornecedor atual",
    );
    expect(
      screen.getByRole("radio", { name: "Embalagens" }).getAttribute("aria-checked"),
    ).toBe("true");

    fireEvent.change(screen.getByLabelText("Nome do fornecedor"), {
      target: { value: "Fornecedor atualizado" },
    });
    await act(async () => {
      await ref.current?.submit();
    });

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Fornecedor atualizado",
        category: "packaging",
        avatarPresetId: "packaging-label",
        isPreferred: true,
      }),
    );
  });
});
