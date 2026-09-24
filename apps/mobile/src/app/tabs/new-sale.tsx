import { ValidationField } from "@lucro-caseiro/ui";
import { useFormValidation } from "../../shared/hooks/use-form-validation";
import { ScreenHeader } from "../../shared/components/screen-header";
import { useAuth } from "../../shared/hooks/use-auth";
import { guidanceEvent } from "../../shared/guidance/guidance-events";
import { ScreenGuidance } from "../../shared/guidance/screen-guidance";
import { formatCurrency } from "../../shared/utils/format";
import type {
  Product,
  ProductVariation,
  Client,
  PaymentMethod,
  SaleUnit,
} from "@lucro-caseiro/contracts";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import {
  CenteredTextInput,
  Button,
  Card,
  fonts,
  iconSizes,
  Typography,
  useBrand,
  useFeature,
  useTheme,
  spacing,
  radii,
} from "@lucro-caseiro/ui";
import { AppIcon } from "../../shared/components/app-icon";
import type { AppIconName } from "../../shared/components/app-icon";
import { FormStepProgress } from "../../shared/components/form-step-progress";
import React, { useCallback, useState } from "react";
import {
  BackHandler,
  FlatList,
  Image,
  Pressable,
  ScrollView,
  View,
  type ViewStyle,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { useBrandScreenPalette } from "../../shared/brand-palette";
import { useClients } from "../../features/clients/hooks";
import { CreateProductForm } from "../../features/products/components/create-product-form";
import { productMatchesSearch } from "../../features/products/barcode";
import { displayProductName, productInitial } from "../../features/products/display";
import { useAllProducts, useProductCodeLookup } from "../../features/products/hooks";
import {
  cartTotal as computeCartTotal,
  formatWeight,
  salePricing,
  saleVariationFields,
} from "../../features/sales/cart";
import { useCreateSale, useSales } from "../../features/sales/hooks";
import { QuickSaleButton } from "../../features/sales/components/quick-sale-button";
import {
  DesktopChoiceCard,
  DesktopChoiceIcon,
  DesktopListHeading,
  DesktopProductCard,
  DesktopReviewItem,
  DesktopSaleStepHeading,
  DesktopSaleSummary,
  type DesktopSummaryItem,
} from "../../features/sales/components/new-sale-desktop";
import {
  FIRST_SALE_STEP,
  SALE_STEP_ORDER,
  type SaleStep,
  nextSaleStep,
  previousSaleStep,
  saleStepPosition,
} from "../../features/sales/sale-steps";
import { PAYMENT_LABELS } from "../../features/sales/payment";
import { useLimitCheck } from "../../shared/hooks/use-limit-check";
import { useNotificationAsk } from "../../shared/hooks/notification-ask";
import { useOfflineQueue } from "../../shared/hooks/use-offline-queue";
import { usePaywall } from "../../shared/hooks/use-paywall";
import { ApiError } from "../../shared/utils/api-client";
import { maybeAskForReview } from "../../shared/utils/store-review";
import { showAlert } from "../../shared/components/alert-store";
import { QuantityPulse } from "../../shared/components/motion-feedback";
import { BarcodeScanner } from "../../shared/components/barcode-scanner";
import { SkeletonList } from "../../shared/components/skeleton";
import { ResponsiveOverlayModal } from "../../shared/components/responsive-modal-surface";
import { StandardModal } from "../../shared/components/standard-modal";
import { FormSection } from "../../shared/components/form-section";
import {
  ChoiceField,
  FormField,
  TextField,
  type ChoiceOption,
} from "../../shared/components/form-field";
import { FormActions, FormGrid } from "../../shared/components/form-layout";
import { floatingTabBarContentPadding } from "../../shared/layout/floating-tab-bar";
import { useDesktopLayout } from "../../shared/layout/use-desktop-layout";
import {
  DesktopCard,
  DesktopGrid,
  DesktopSection,
  DesktopSplit,
  DesktopToolbarButton,
  desktopPageContent,
} from "../../shared/layout/desktop-page";
import { DesktopStepper } from "../../shared/layout/desktop-stepper";
import {
  desktopModalSurface,
  desktopSplitLayout,
  desktopStretch,
  desktopWidths,
  pageGutter,
} from "../../shared/layout/desktop-density";
import { alertValidation, alertError } from "../../shared/utils/alerts";

type Step = SaleStep;

interface CartItem {
  productId: string;
  productName: string;
  photoUrl: string | null;
  unitPrice: number;
  quantity: number;
  variationId?: string;
  variationName?: string;
  saleUnit: SaleUnit;
}

interface CreateProductInitialValues {
  name?: string;
  category?: string;
  code?: string;
  photoUrl?: string;
}

type PaymentOption = {
  value: PaymentMethod;
  label: string;
  icon: string;
};

type ClientFilter = "all" | "withPhone" | "withoutPhone";

const PAYMENT_OPTIONS: PaymentOption[] = [
  { value: "pix", label: PAYMENT_LABELS.pix, icon: "qr-code-outline" },
  { value: "cash", label: PAYMENT_LABELS.cash, icon: "cash-outline" },
  { value: "card", label: PAYMENT_LABELS.card, icon: "card-outline" },
  { value: "credit", label: PAYMENT_LABELS.credit, icon: "time-outline" },
  {
    value: "transfer",
    label: PAYMENT_LABELS.transfer,
    icon: "swap-horizontal-outline",
  },
];

const STEP_TITLES: Record<Step, string> = {
  1: "Para quem é a venda?",
  2: "O que você vai vender?",
  3: "Forma de pagamento",
  4: "Revisar e confirmar",
};

const STEP_LABELS = ["Cliente", "Produtos", "Pagamento", "Revisão"] as const;

const STEP_SUBTITLES: Record<Step, string> = {
  1: "Toque em um cliente ou continue com uma venda avulsa.",
  2: "Escolha um produto ou adicione um novo.",
  3: "Escolha como o cliente irá pagar.",
  4: "Confira os itens e finalize a venda.",
};

/** Rotulo de quantidade no carrinho: unidades (ex.: "3") ou peso (ex.: "1,5 kg"). */
function cartQuantityLabel(item: CartItem): string {
  return item.saleUnit === "kg" ? formatWeight(item.quantity) : String(item.quantity);
}

function productStockLabel(product: Product): string | null {
  if (product.saleUnit === "kg" || product.isComposite) return null;

  const variationStocks = product.variations
    ?.map((variation) => variation.stockQuantity)
    .filter((stock): stock is number => stock !== undefined);
  const stock =
    variationStocks && variationStocks.length > 0
      ? variationStocks.reduce((total, quantity) => total + quantity, 0)
      : product.stockQuantity;

  if (stock === null) return "Sem controle de estoque";
  if (stock === 0) return "Sem estoque";
  if (product.stockAlertThreshold !== null && stock <= product.stockAlertThreshold) {
    return `${stock} em estoque · baixo`;
  }
  return `${stock} em estoque`;
}

function getSurfaceStyle(theme: ReturnType<typeof useTheme>["theme"]): ViewStyle {
  return {
    backgroundColor: theme.colors.surfaceElevated,
    borderWidth: 1,
    borderColor: theme.colors.border,
  };
}

/** Avatares neutros mantêm o foco no nome do cliente. */
function ClientPickerAvatar({ name }: Readonly<{ name: string }>) {
  const pal = useBrandScreenPalette();
  return (
    <View
      style={{
        width: 40,
        height: 40,
        borderRadius: radii.full,
        backgroundColor: pal.surface,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Typography variant="bodyBold" color={pal.muted}>
        {(name.trim().charAt(0) || "?").toUpperCase()}
      </Typography>
    </View>
  );
}

function searchFieldAccessibilityLabel(placeholder: string): string {
  let label = placeholder.trimEnd();
  if (label.endsWith("…")) label = label.slice(0, -1);
  while (label.endsWith(".")) label = label.slice(0, -1);
  return label.trim();
}

function saleNextStepAccessibilityLabel(step: number): string {
  if (step === 2) return "Ir para cliente";
  if (step === 1) return "Ir para pagamento";
  if (step === 3) return "Ir para revisao";
  return "Confirmar venda";
}

function SearchBox({
  placeholder,
  value,
  onChangeText,
  trailingIcon = "scan-outline",
  trailingLabel = "Abrir busca por código",
  onTrailingPress,
}: Readonly<{
  placeholder: string;
  value: string;
  onChangeText: (value: string) => void;
  trailingIcon?: AppIconName;
  trailingLabel?: string;
  onTrailingPress?: () => void;
}>) {
  const { theme } = useTheme();
  return (
    <View
      style={{
        minHeight: 52,
        borderRadius: radii.lg,
        paddingHorizontal: spacing.md,
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.md,
        ...getSurfaceStyle(theme),
      }}
    >
      <AppIcon name="search-outline" size={20} color={theme.colors.textSecondary} />
      <CenteredTextInput
        placeholder={placeholder}
        accessibilityLabel={searchFieldAccessibilityLabel(placeholder)}
        placeholderTextColor={theme.colors.textSecondary}
        value={value}
        onChangeText={onChangeText}
        style={{
          flex: 1,
          color: theme.colors.text,
          fontSize: 16,
          fontFamily: fonts.regular,
          padding: 0,
        }}
      />
      <Pressable
        onPress={onTrailingPress}
        disabled={!onTrailingPress}
        hitSlop={12}
        accessibilityRole="button"
        accessibilityLabel={trailingLabel}
        style={{
          width: 44,
          height: 44,
          alignItems: "center",
          justifyContent: "center",
          opacity: onTrailingPress ? 1 : 0.7,
        }}
      >
        <AppIcon name={trailingIcon} size={20} color={theme.colors.textSecondary} />
      </Pressable>
    </View>
  );
}

function QuickActionCard({
  icon,
  title,
  onPress,
}: Readonly<{
  icon: AppIconName;
  title: string;
  onPress: () => void;
}>) {
  const { theme } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [
        {
          flex: 1,
          minHeight: 48,
          borderRadius: radii.md,
          paddingHorizontal: spacing.sm,
          flexDirection: "row",
          alignItems: "center",
          gap: spacing.sm,
          opacity: pressed ? 0.86 : 1,
          backgroundColor: theme.colors.surface,
        },
      ]}
    >
      <View
        style={{
          width: 24,
          height: 24,
          borderRadius: radii.full,
          backgroundColor: theme.colors.surface,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <AppIcon name={icon} size={20} color={theme.colors.textSecondary} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Typography variant="caption" color={theme.colors.text} numberOfLines={2}>
          {title}
        </Typography>
      </View>
    </Pressable>
  );
}

function ReviewDetail({
  label,
  value,
  onEdit,
}: Readonly<{
  label: string;
  value: string;
  onEdit: () => void;
}>) {
  const { theme } = useTheme();
  return (
    <Pressable
      onPress={onEdit}
      accessibilityRole="button"
      accessibilityLabel={`Editar ${label.toLowerCase()}: ${value}`}
      style={({ pressed }) => ({
        minHeight: 64,
        paddingVertical: spacing.md,
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.md,
        opacity: pressed ? 0.7 : 1,
      })}
    >
      <View style={{ flex: 1, minWidth: 0, gap: spacing.xs }}>
        <Typography variant="caption">{label}</Typography>
        <Typography variant="bodyBold" numberOfLines={2}>
          {value}
        </Typography>
      </View>
      <AppIcon name="pencil-outline" size={18} color={theme.colors.textSecondary} />
    </Pressable>
  );
}

type DiscountType = "fixed" | "percentage";
type DiscountChoice = "none" | DiscountType;

const DISCOUNT_OPTIONS: readonly ChoiceOption<DiscountChoice>[] = [
  { value: "none", label: "Nenhum" },
  { value: "fixed", label: "Em reais" },
  { value: "percentage", label: "Em %" },
];

/** Erro sempre visível (não depende de tentar salvar) e sem alvo de foco. */
const noFocusTarget = () => () => undefined;

/**
 * Desconto e observações da venda: os mesmos campos no computador e no
 * celular (o `FormGrid` decide as colunas pela largura).
 */
function SaleAdjustmentsFields({
  discountType,
  discountInput,
  notes,
  discountTooHigh,
  onDiscountTypeChange,
  onDiscountInputChange,
  onNotesChange,
}: Readonly<{
  discountType: DiscountType | null;
  discountInput: string;
  notes: string;
  discountTooHigh: boolean;
  onDiscountTypeChange: (value: DiscountType | null) => void;
  onDiscountInputChange: (value: string) => void;
  onNotesChange: (value: string) => void;
}>) {
  return (
    <FormGrid>
      <FormField label="Desconto" span="full">
        <ChoiceField
          accessibilityLabel="Tipo de desconto"
          value={discountType ?? "none"}
          options={DISCOUNT_OPTIONS}
          onChange={(value) => {
            onDiscountTypeChange(value === "none" ? null : value);
            if (value === "none") onDiscountInputChange("");
          }}
        />
      </FormField>
      {discountType ? (
        <FormField
          label="Valor do desconto"
          validation={{
            error: discountTooHigh
              ? "O desconto deve ser menor que o subtotal."
              : undefined,
            registerFocus: noFocusTarget,
          }}
        >
          <TextField
            accessibilityLabel={
              discountType === "percentage"
                ? "Desconto, em porcentagem"
                : "Desconto, em reais"
            }
            prefix={discountType === "fixed" ? "R$" : undefined}
            suffix={discountType === "percentage" ? "%" : undefined}
            value={discountInput}
            onChangeText={onDiscountInputChange}
            keyboardType="decimal-pad"
            numericMode="decimal"
            placeholder={discountType === "percentage" ? "Ex: 10" : "Ex: 5,00"}
          />
        </FormField>
      ) : null}
      <FormField label="Observações do pedido" optional span="full">
        <TextField
          value={notes}
          onChangeText={onNotesChange}
          placeholder="Ex: separar em duas embalagens"
          maxLength={500}
          multiline
        />
      </FormField>
    </FormGrid>
  );
}

export default function NewSaleScreen() {
  const guidanceUserId = useAuth((state) => state.userId);
  const { theme } = useTheme();
  const pal = useBrandScreenPalette();
  const actionFill =
    theme.mode === "light" ? pal.wineFill : theme.colors.primaryInteractive;
  const { copy } = useBrand();
  const variationsEnabled = useFeature("catalogoCores");
  const isDesktop = useDesktopLayout();
  const router = useRouter();
  const { from } = useLocalSearchParams<{ from?: string }>();
  const guidedFirstSale = from === "getting-started";
  const insets = useSafeAreaInsets();
  const navigationBottomPadding = floatingTabBarContentPadding(insets.bottom);
  const { checkAndBlock: checkSalesLimit } = useLimitCheck("sales");
  const showPaywall = usePaywall((s) => s.show);
  const [step, setStep] = useState<Step>(FIRST_SALE_STEP);

  // Voltar do Android volta uma etapa da venda em vez de sair do fluxo.
  useFocusEffect(
    useCallback(() => {
      const previous = previousSaleStep(step);
      if (!previous) return undefined;
      const listener = BackHandler.addEventListener("hardwareBackPress", () => {
        setStep(previous);
        return true;
      });
      return () => listener.remove();
    }, [step]),
  );
  const [mainWidth, setMainWidth] = useState(720);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedClient, setSelectedClient] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentOption["value"] | null>(null);
  const [discountType, setDiscountType] = useState<"fixed" | "percentage" | null>(null);
  const [discountInput, setDiscountInput] = useState("");
  const [notes, setNotes] = useState("");
  const [clientSearch, setClientSearch] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [showCreateProduct, setShowCreateProduct] = useState(false);
  const [createProductInitial, setCreateProductInitial] =
    useState<CreateProductInitialValues>();
  const [showBarcodeSearch, setShowBarcodeSearch] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [showClientFilter, setShowClientFilter] = useState(false);
  const [clientFilter, setClientFilter] = useState<ClientFilter>("all");
  const [barcodeInput, setBarcodeInput] = useState("");
  // Produto por peso (kg) em edicao de quantidade + peso digitado (em kg).
  const [weightProduct, setWeightProduct] = useState<Product | null>(null);
  const [weightVariation, setWeightVariation] = useState<ProductVariation | null>(null);
  const [weightInput, setWeightInput] = useState("");
  const [variationProduct, setVariationProduct] = useState<Product | null>(null);

  const productsQuery = useAllProducts();
  const { data: products = [], isLoading: loadingProducts } = productsQuery;
  const productCodeLookup = useProductCodeLookup();
  const clientsQuery = useClients({
    search: clientSearch || undefined,
  });
  const { data: clientsData, isLoading: loadingClients } = clientsQuery;
  // Mesma query (sem filtros) usada na home: reaproveita o cache pra saber o
  // total de vendas sem chamada extra, usado no gatilho de avaliacao na loja.
  const { data: salesData } = useSales();
  const createSale = useCreateSale();

  const weightValue = parseFloat(weightInput.replace(",", "."));
  const weightValidation = useFormValidation(
    {
      weight:
        (isNaN(weightValue) || weightValue <= 0) &&
        "Digite um peso maior que zero (em kg).",
    },
    weightProduct?.id,
  );
  const barcodeValidation = useFormValidation(
    { code: !barcodeInput.trim() && "Digite ou cole um código para buscar." },
    showBarcodeSearch,
  );

  const cartTotal = computeCartTotal(cart);
  const parsedDiscount = Number.parseFloat(discountInput.replace(",", ".")) || 0;
  const pricing = salePricing(cartTotal, discountType, parsedDiscount);

  function addToCart(product: Product, variation?: ProductVariation) {
    const allowedVariation = variationsEnabled ? variation : undefined;
    if (variationsEnabled && (product.variations?.length ?? 0) > 0 && !allowedVariation) {
      setVariationProduct(product);
      return;
    }
    // Produtos por peso (kg) abrem um campo pra digitar o peso em kg.
    if (product.saleUnit === "kg") {
      const existing = cart.find(
        (i) => i.productId === product.id && i.variationId === allowedVariation?.id,
      );
      setWeightProduct(product);
      setWeightVariation(allowedVariation ?? null);
      setWeightInput(existing ? String(existing.quantity).replace(".", ",") : "");
      return;
    }
    setCart((prev) => {
      const existing = prev.find(
        (i) => i.productId === product.id && i.variationId === allowedVariation?.id,
      );
      if (existing) {
        return prev.map((i) =>
          i.productId === product.id && i.variationId === allowedVariation?.id
            ? { ...i, photoUrl: product.photoUrl, quantity: i.quantity + 1 }
            : i,
        );
      }
      return [
        ...prev,
        {
          productId: product.id,
          productName: product.name,
          photoUrl: product.photoUrl,
          unitPrice: product.salePrice,
          quantity: 1,
          saleUnit: "unit",
          variationId: allowedVariation?.id,
          variationName: allowedVariation?.name,
        },
      ];
    });
  }

  function confirmWeight() {
    if (!weightProduct) return;
    if (!weightValidation.validate()) return;
    const weight = parseFloat(weightInput.replace(",", "."));
    const product = weightProduct;
    setCart((prev) => {
      const others = prev.filter(
        (i) => i.productId !== product.id || i.variationId !== weightVariation?.id,
      );
      return [
        ...others,
        {
          productId: product.id,
          productName: product.name,
          photoUrl: product.photoUrl,
          unitPrice: product.salePrice,
          quantity: weight,
          saleUnit: "kg",
          variationId: weightVariation?.id,
          variationName: weightVariation?.name,
        },
      ];
    });
    setWeightProduct(null);
    setWeightVariation(null);
    setWeightInput("");
  }

  function removeFromCart(productId: string) {
    setCart((prev) => {
      const existing = prev.find((i) => i.productId === productId);
      if (!existing) return prev;
      // Por peso (kg): remove a linha inteira.
      if (existing.saleUnit === "kg" || existing.quantity <= 1) {
        return prev.filter((i) => i.productId !== productId);
      }
      return prev.map((i) =>
        i.productId === productId ? { ...i, quantity: i.quantity - 1 } : i,
      );
    });
  }

  function getCartQuantity(productId: string): number {
    return cart
      .filter((item) => item.productId === productId)
      .reduce((total, item) => total + item.quantity, 0);
  }

  function getCartItem(productId: string): CartItem | undefined {
    return cart.find((i) => i.productId === productId);
  }

  function getCartItemPhotoUrl(item: CartItem): string | null {
    return (
      item.photoUrl ??
      products.find((product) => product.id === item.productId)?.photoUrl ??
      null
    );
  }

  function resetForm() {
    setStep(FIRST_SALE_STEP);
    setCart([]);
    setSelectedClient(null);
    setPaymentMethod(null);
    setDiscountType(null);
    setDiscountInput("");
    setNotes("");
    setClientSearch("");
    setProductSearch("");
    setBarcodeInput("");
    setShowBarcodeSearch(false);
    setShowClientFilter(false);
    setClientFilter("all");
    setWeightProduct(null);
    setWeightVariation(null);
    setVariationProduct(null);
    setWeightInput("");
  }

  async function handleProductCode(rawCode: string) {
    const code = rawCode.trim();
    if (!code) {
      alertValidation("Digite ou cole um código para buscar.");
      return;
    }

    try {
      const result = await productCodeLookup.mutateAsync(code);
      setShowBarcodeSearch(false);
      setBarcodeInput("");
      if (result.status === "found") {
        setProductSearch("");
        addToCart(result.product);
        return;
      }

      if (result.status === "suggestion") {
        setCreateProductInitial({
          name: result.suggestion.name,
          category: result.suggestion.category ?? undefined,
          code: result.suggestion.code,
          photoUrl: result.suggestion.photoUrl ?? undefined,
        });
        setShowCreateProduct(true);
        return;
      }

      setCreateProductInitial({ code });
      showAlert({
        title: "Produto não cadastrado",
        message: "Quer cadastrar este código agora? Ele já ficará preenchido no produto.",
        buttons: [
          { text: "Agora não", style: "cancel" },
          { text: "Cadastrar produto", onPress: () => setShowCreateProduct(true) },
        ],
      });
    } catch (error) {
      alertError(error);
    }
  }

  function handleBarcodeSearch() {
    if (!barcodeValidation.validate()) return;
    void handleProductCode(barcodeInput.trim());
  }

  async function handleSubmit(paymentOverride?: PaymentOption["value"]) {
    const effectivePayment = paymentOverride ?? paymentMethod;
    if (cart.length === 0 || !effectivePayment) {
      formValidation.validate(() => setStep(cart.length === 0 ? 2 : 3));
      return;
    }
    if (pricing.total <= 0) {
      alertValidation("O desconto precisa deixar um total maior que zero.");
      return;
    }
    if (checkSalesLimit()) return;

    const payload = {
      clientId: selectedClient?.id,
      paymentMethod: effectivePayment,
      ...(discountType && parsedDiscount > 0
        ? { discountType, discountValue: parsedDiscount }
        : {}),
      ...(notes.trim() ? { notes: notes.trim() } : {}),
      items: cart.map((i) => ({
        productId: i.productId,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        ...saleVariationFields(variationsEnabled, i),
      })),
    };

    try {
      const result = await createSale.mutateAsync(payload);
      const receiptButton = {
        text: "Ver e compartilhar recibo",
        onPress: () => {
          resetForm();
          router.push({
            pathname: "/tabs/sales" as const,
            params: { saleId: result.id },
          });
        },
      };
      showAlert({
        title: "Venda registrada!",
        variant: "sale-success",
        message: `Total: ${formatCurrency(result.total)}`,
        buttons: guidedFirstSale
          ? [
              {
                text: "Continuar",
                onPress: () => {
                  resetForm();
                  router.replace("/tabs");
                },
              },
              receiptButton,
            ]
          : [{ text: "Nova venda", onPress: resetForm }, receiptButton],
      });
      // Depois da primeira venda os lembretes fazem sentido: libera o pedido
      // de permissao de notificacao.
      useNotificationAsk.getState().markReady();
      // Sem anuncio em tela cheia aqui: interromper o momento da venda
      // irrita e derruba a nota na loja. O banner continua nas outras telas.
      // Dispara em segundo plano (nao bloqueia o feedback de sucesso). O
      // total ainda nao reflete a venda recem-criada (cache pre-invalidacao),
      // entao soma 1 pra contar a venda atual.
      void maybeAskForReview((salesData?.total ?? 0) + 1);
    } catch (e: unknown) {
      // Limite do plano gratuito esgotado: abre o paywall em vez de erro generico.
      // (Fallback do gate client-side, que pode estar com a contagem defasada.)
      if (e instanceof ApiError && e.code === "LIMIT_EXCEEDED") {
        showPaywall("sales");
        return;
      }
      // Tempo esgotado: o servidor pode ter gravado a venda. Nao enfileira
      // para nao duplicar; pede para conferir antes de tentar de novo.
      if (e instanceof ApiError && e.code === "TIMEOUT") {
        showAlert({
          title: "A conexão está lenta",
          message:
            "Não deu para confirmar se a venda foi registrada. Confira na lista de vendas antes de tentar de novo.",
        });
        return;
      }
      // Falha de rede (sem resposta HTTP): salva a venda na fila offline.
      // setupAutoSync envia automaticamente quando a conexao voltar.
      if (!(e instanceof ApiError) || e.code === "NETWORK_ERROR") {
        useOfflineQueue.getState().enqueue({
          method: "POST",
          endpoint: "/api/v1/sales",
          payload,
        });
        showAlert({
          title: "Venda salva no aparelho",
          message: `Total: ${formatCurrency(pricing.total)}. Você está sem internet. A venda será enviada automaticamente quando a conexão voltar.`,
        });
        resetForm();
        return;
      }
      const message =
        e instanceof Error
          ? e.message
          : "Não foi possível registrar a venda. Tente novamente.";
      alertError(message);
    }
  }

  const formValidation = useFormValidation({
    cart: cart.length === 0 && "Adicione pelo menos um produto à venda.",
    paymentMethod: step >= 3 && !paymentMethod && "Escolha uma forma de pagamento.",
  });

  function canAdvance(): boolean {
    if (!formValidation.validate()) return false;
    if (step === 1) return true;
    if (step === 2) return cart.length > 0;
    if (step === 3) return paymentMethod !== null;
    return true;
  }

  const filteredProducts = products.filter((product) =>
    productMatchesSearch(product, productSearch),
  );
  const clientItems = clientsData?.items ?? [];
  let filteredClients = clientItems;
  if (clientFilter === "withPhone") {
    filteredClients = clientItems.filter((client) => Boolean(client.phone));
  }
  if (clientFilter === "withoutPhone") {
    filteredClients = clientItems.filter((client) => !client.phone);
  }

  const split = desktopSplitLayout(isDesktop);
  const productColumns = isDesktop
    ? Math.max(1, Math.min(3, Math.floor((mainWidth + spacing.md) / (200 + spacing.md))))
    : 1;
  const productCardWidth =
    (mainWidth - spacing.md * (productColumns - 1)) / productColumns;
  const paymentColumns = mainWidth >= 572 ? 2 : 1;
  const paymentCardWidth =
    (mainWidth - spacing.md * (paymentColumns - 1)) / paymentColumns;
  const pageZone = desktopStretch(isDesktop, desktopWidths.data);
  const searchFieldStyle = isDesktop
    ? { maxWidth: 480, width: "100%" as const }
    : undefined;
  const paymentMethodLabel =
    PAYMENT_OPTIONS.find((option) => option.value === paymentMethod)?.label ?? "—";
  const summaryTotal = step >= 3 ? pricing.total : cartTotal;
  let cartItemSummary = "Nenhum item";
  if (cart.length > 0) {
    const itemLabel = cart.length === 1 ? "item" : "itens";
    cartItemSummary = `${cart.length} ${itemLabel}`;
  }

  let nextActionLabel = "Continuar";
  if (step === 1) nextActionLabel = "Pagamento";
  if (step === 3) nextActionLabel = "Revisar venda";
  if (step === 4) nextActionLabel = copy.saleLabel;

  // Desktop (web >= 1024px): página rolável, etapas no topo da coluna principal
  // e resumo fixo à direita. Mesmo estado e mesmas ações do celular.
  const desktopStepTitle = STEP_TITLES[step];
  const desktopSummaryItems: DesktopSummaryItem[] = cart.map((item) => ({
    key: `${item.productId}:${item.variationId ?? "default"}`,
    name: [displayProductName(item.productName), item.variationName]
      .filter(Boolean)
      .join(" · "),
    detail: `${cartQuantityLabel(item)} × ${formatCurrency(item.unitPrice)}${
      item.saleUnit === "kg" ? "/kg" : ""
    }`,
    subtotal: item.unitPrice * item.quantity,
  }));
  const desktopPaymentLabel =
    PAYMENT_OPTIONS.find((option) => option.value === paymentMethod)?.label ??
    "A escolher";
  const desktopProductsCount =
    products.length === 1 ? "1 produto" : `${products.length} produtos`;
  const paymentSubtitles: Record<PaymentMethod, string> = {
    pix: "Pagamento instantâneo",
    cash: "Pagamento em espécie",
    card: "Débito ou crédito",
    credit: "Pagamento para depois",
    transfer: "Transferência bancária",
  };

  const desktopAside = (
    <DesktopSaleSummary
      items={desktopSummaryItems}
      itemCountLabel={cartItemSummary}
      clientName={selectedClient?.name ?? "Venda avulsa"}
      paymentLabel={desktopPaymentLabel}
      discount={step >= 3 ? pricing.discount : 0}
      total={summaryTotal}
    >
      {step < 4 ? (
        <Button
          title={nextActionLabel}
          size="lg"
          disabled={step === 2 && cart.length === 0}
          onPress={() => {
            if (!canAdvance()) return;
            setStep(nextSaleStep(step));
          }}
          icon={
            <AppIcon name="arrow-forward" size={18} color={theme.colors.textOnPrimary} />
          }
          style={{ borderRadius: radii.md, width: "100%", backgroundColor: actionFill }}
        />
      ) : (
        <Button
          title={copy.saleLabel}
          size="lg"
          loading={createSale.isPending}
          onPress={() => {
            void handleSubmit();
          }}
          icon={
            <AppIcon
              name="checkmark-circle"
              size={18}
              color={theme.colors.textOnPrimary}
            />
          }
          style={{ borderRadius: radii.md, width: "100%", backgroundColor: actionFill }}
        />
      )}
      {step === 2 ? (
        <QuickSaleButton
          itemCount={cart.length}
          hasClient={Boolean(selectedClient)}
          pending={createSale.isPending}
          onConfirm={(payment) => {
            void handleSubmit(payment);
          }}
        />
      ) : null}
      {previousSaleStep(step) ? (
        <Button
          title="Voltar"
          variant="ghost"
          size="lg"
          onPress={() => setStep((current) => previousSaleStep(current) ?? current)}
          icon={
            <AppIcon name="chevron-back" size={18} color={theme.colors.textSecondary} />
          }
          style={{ borderRadius: radii.md, width: "100%" }}
        />
      ) : null}
    </DesktopSaleSummary>
  );

  const desktopProductsStep = (
    <>
      <ValidationField {...formValidation.field("cart")}>
        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            alignItems: "stretch",
            gap: spacing.md,
          }}
        >
          <View style={{ flexGrow: 1, flexBasis: 320, minWidth: 0 }}>
            <SearchBox
              placeholder="Buscar produto ou código"
              value={productSearch}
              onChangeText={setProductSearch}
              onTrailingPress={() => setShowScanner(true)}
            />
          </View>
          <DesktopToolbarButton
            icon="add-circle-outline"
            label="Novo produto"
            onPress={() => {
              setCreateProductInitial(undefined);
              setShowCreateProduct(true);
            }}
          />
          <DesktopToolbarButton
            icon="barcode-outline"
            label="Usar código"
            onPress={() => setShowScanner(true)}
          />
        </View>
      </ValidationField>
      <DesktopListHeading
        title="Seus produtos"
        count={loadingProducts ? undefined : desktopProductsCount}
        linkLabel="Ver todos"
        onLink={() => router.push("/products")}
      />
      {productsQuery.error ? (
        <DesktopCard>
          <Typography variant="desktopCardTitle">
            Não foi possível carregar os produtos
          </Typography>
          <Typography variant="desktopBody">
            Verifique sua conexão e tente novamente.
          </Typography>
          <View style={{ alignItems: "flex-start" }}>
            <Button
              title="Tentar novamente"
              variant="secondary"
              onPress={() => void productsQuery.refetch()}
            />
          </View>
        </DesktopCard>
      ) : null}
      {loadingProducts ? <SkeletonList rows={6} variant="product" /> : null}
      {!loadingProducts && !productsQuery.error && filteredProducts.length > 0 ? (
        <DesktopGrid minColumnWidth={180} maxColumns={4}>
          {filteredProducts.map((item) => {
            const qty = getCartQuantity(item.id);
            const cartItem = getCartItem(item.id);
            return (
              <DesktopProductCard
                key={item.id}
                product={item}
                quantity={qty}
                quantityLabel={
                  cartItem?.saleUnit === "kg" ? formatWeight(qty) : String(qty)
                }
                stockLabel={productStockLabel(item)}
                onAdd={() => addToCart(item)}
                onRemove={() => removeFromCart(item.id)}
              />
            );
          })}
        </DesktopGrid>
      ) : null}
      {!loadingProducts && !productsQuery.error && filteredProducts.length === 0 ? (
        <DesktopCard style={{ borderStyle: "dashed", alignItems: "flex-start" }}>
          <Typography variant="desktopCardTitle">
            {productSearch
              ? "Nenhum produto encontrado"
              : "Cadastre seu primeiro produto"}
          </Typography>
          <Typography variant="desktopBody">
            {productSearch
              ? "Tente outro nome ou use o código do produto."
              : "Use Novo produto para cadastrar e já colocar na venda."}
          </Typography>
        </DesktopCard>
      ) : null}
    </>
  );

  const desktopClientStep = (
    <>
      <DesktopChoiceCard
        title="Venda avulsa"
        description="Continuar sem cliente"
        leading={<DesktopChoiceIcon icon="person-outline" />}
        onPress={() => {
          setSelectedClient(null);
          setStep(nextSaleStep(1));
        }}
      />
      <SearchBox
        placeholder="Buscar cliente"
        value={clientSearch}
        onChangeText={setClientSearch}
        trailingIcon="filter-outline"
        trailingLabel="Filtrar clientes"
        onTrailingPress={() => setShowClientFilter(true)}
      />
      <DesktopListHeading
        title="Seus clientes"
        linkLabel="Ver todos"
        onLink={() => router.push("/tabs/clients")}
      />
      {clientsQuery.error ? (
        <DesktopCard>
          <Typography variant="desktopCardTitle">
            Não foi possível carregar os clientes
          </Typography>
          <Typography variant="desktopBody">
            Você ainda pode continuar como venda avulsa ou tentar novamente.
          </Typography>
          <View style={{ alignItems: "flex-start" }}>
            <Button
              title="Tentar novamente"
              variant="secondary"
              onPress={() => void clientsQuery.refetch()}
            />
          </View>
        </DesktopCard>
      ) : null}
      {!clientsQuery.error && loadingClients ? (
        <SkeletonList rows={4} variant="client" />
      ) : null}
      {!clientsQuery.error && !loadingClients && filteredClients.length > 0 ? (
        <DesktopGrid minColumnWidth={260} maxColumns={3} gap={spacing.md}>
          {filteredClients.map((client) => (
            <DesktopChoiceCard
              key={client.id}
              title={client.name}
              description={client.phone}
              accessibilityLabel={`Selecionar ${client.name}`}
              selected={selectedClient?.id === client.id}
              leading={
                <DesktopChoiceIcon
                  initial={(client.name.trim().charAt(0) || "?").toUpperCase()}
                />
              }
              onPress={() => {
                setSelectedClient({ id: client.id, name: client.name });
                setStep(nextSaleStep(1));
              }}
            />
          ))}
        </DesktopGrid>
      ) : null}
      {!clientsQuery.error && !loadingClients && filteredClients.length === 0 ? (
        <Typography variant="desktopBody">
          {clientSearch ? "Nenhum cliente encontrado" : "Nenhum cliente para este filtro"}
        </Typography>
      ) : null}
    </>
  );

  const desktopPaymentStep = (
    <>
      <ValidationField {...formValidation.field("paymentMethod")}>
        <View accessibilityRole="radiogroup" accessibilityLabel="Forma de pagamento">
          <DesktopGrid minColumnWidth={300} maxColumns={3} gap={spacing.md}>
            {PAYMENT_OPTIONS.map((option) => {
              const isSelected = paymentMethod === option.value;
              return (
                <DesktopChoiceCard
                  key={option.value}
                  accessibilityRole="radio"
                  title={option.label}
                  description={paymentSubtitles[option.value]}
                  selected={isSelected}
                  onPress={() => setPaymentMethod(option.value)}
                  leading={
                    <DesktopChoiceIcon
                      icon={option.icon as AppIconName}
                      active={isSelected}
                    />
                  }
                  trailing={
                    <AppIcon
                      name={isSelected ? "checkmark-circle" : "ellipse-outline"}
                      size={24}
                      color={isSelected ? pal.wine : theme.colors.textSecondary}
                    />
                  }
                />
              );
            })}
          </DesktopGrid>
        </View>
      </ValidationField>
      <DesktopSection
        card
        title="Ajustes da venda"
        description="Desconto e observações são opcionais. Na próxima etapa você confere tudo."
      >
        <SaleAdjustmentsFields
          discountType={discountType}
          discountInput={discountInput}
          notes={notes}
          discountTooHigh={pricing.total <= 0}
          onDiscountTypeChange={setDiscountType}
          onDiscountInputChange={setDiscountInput}
          onNotesChange={setNotes}
        />
      </DesktopSection>
    </>
  );

  const desktopReviewStep = (
    <>
      <DesktopSection
        card
        title="Itens da venda"
        action={{
          label: "Editar itens",
          accessibilityLabel: "Editar itens da venda",
          onPress: () => setStep(2),
        }}
      >
        <View>
          {cart.map((item, index) => (
            <DesktopReviewItem
              key={`${item.productId}:${item.variationId ?? "default"}`}
              first={index === 0}
              photoUrl={getCartItemPhotoUrl(item)}
              name={item.productName}
              variation={item.variationName}
              detail={`${cartQuantityLabel(item)} × ${formatCurrency(item.unitPrice)}${
                item.saleUnit === "kg" ? "/kg" : ""
              }`}
              subtotal={item.unitPrice * item.quantity}
            />
          ))}
        </View>
      </DesktopSection>
      <DesktopGrid minColumnWidth={280} maxColumns={2}>
        <DesktopCard style={{ height: "100%", gap: spacing.xs }}>
          <Typography variant="desktopCardTitle">Dados da venda</Typography>
          <ReviewDetail
            label="Cliente"
            value={selectedClient?.name ?? "Venda avulsa"}
            onEdit={() => setStep(1)}
          />
          <View style={{ height: 1, backgroundColor: theme.colors.border }} />
          <ReviewDetail
            label="Pagamento"
            value={desktopPaymentLabel}
            onEdit={() => setStep(3)}
          />
        </DesktopCard>
        <DesktopCard style={{ height: "100%", gap: spacing.md }}>
          <Typography variant="desktopCardTitle">Valores</Typography>
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <Typography variant="desktopBody">Subtotal</Typography>
            <Typography variant="desktopBodyStrong">
              {formatCurrency(pricing.subtotal)}
            </Typography>
          </View>
          {pricing.discount > 0 ? (
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <Typography variant="desktopBody">Desconto</Typography>
              <Typography variant="desktopBodyStrong">
                − {formatCurrency(pricing.discount)}
              </Typography>
            </View>
          ) : null}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "baseline",
              borderTopWidth: 1,
              borderTopColor: theme.colors.border,
              paddingTop: spacing.md,
            }}
          >
            <Typography variant="desktopBodyStrong">Total da venda</Typography>
            <Typography variant="desktopMetric">
              {formatCurrency(pricing.total)}
            </Typography>
          </View>
          {notes.trim() ? (
            <View style={{ gap: spacing.xs }}>
              <Typography variant="desktopMeta">Observações</Typography>
              <Typography variant="desktopBody">{notes.trim()}</Typography>
            </View>
          ) : null}
        </DesktopCard>
      </DesktopGrid>
    </>
  );

  const desktopView = isDesktop ? (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={[desktopPageContent(true), { gap: 0 }]}
      keyboardShouldPersistTaps="handled"
    >
      <View>
        <ScreenGuidance
          renderHeader={(helpButton) => (
            <ScreenHeader
              help={helpButton}
              title="Nova venda"
              subtitle="Escolha os produtos, o cliente e a forma de pagamento."
              hideBack
            />
          )}
          area="new_sale"
          onStart={() => {
            if (products.length === 0) setShowCreateProduct(true);
            else setStep(2);
          }}
          actionLabel={
            products.length === 0 ? "Cadastrar produto e continuar" : "Escolher produtos"
          }
          hasRecords={
            (salesData?.total ?? 0) > 0 || step !== FIRST_SALE_STEP || cart.length > 0
          }
          loading={loadingProducts || productsQuery.isError}
          suspended={
            showCreateProduct || showScanner || showBarcodeSearch || guidedFirstSale
          }
        />
      </View>
      <DesktopSplit aside={desktopAside}>
        <DesktopStepper
          current={saleStepPosition(step)}
          steps={SALE_STEP_ORDER.map((saleStep) => ({
            label: STEP_LABELS[saleStep - 1],
            title: STEP_TITLES[saleStep],
          }))}
          onStepPress={(target) => setStep(SALE_STEP_ORDER[target - 1] ?? step)}
        />
        <DesktopSaleStepHeading
          title={desktopStepTitle}
          description={STEP_SUBTITLES[step]}
        />
        {step === 2 ? desktopProductsStep : null}
        {step === 1 ? desktopClientStep : null}
        {step === 3 ? desktopPaymentStep : null}
        {step === 4 ? desktopReviewStep : null}
      </DesktopSplit>
    </ScrollView>
  ) : null;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      {desktopView ?? (
        <>
          <View
            style={{
              flex: 1,
              ...pageGutter(isDesktop),
              ...pageZone,
            }}
          >
            <ScreenGuidance
              renderHeader={(helpButton) =>
                isDesktop ? (
                  <ScreenHeader
                    help={helpButton}
                    title="Nova venda"
                    subtitle="Escolha o cliente, os itens e a forma de pagamento."
                    hideBack
                  />
                ) : (
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      paddingTop: spacing.sm,
                      justifyContent: "space-between",
                    }}
                  >
                    <View
                      style={{
                        flex: 1,
                        flexDirection: "row",
                        alignItems: "center",
                        gap: spacing.md,
                      }}
                    >
                      {!isDesktop ? (
                        <Pressable
                          onPress={() => {
                            const previous = previousSaleStep(step);
                            if (previous) setStep(previous);
                            else router.push("/tabs/sales");
                          }}
                          accessibilityRole="button"
                          accessibilityLabel="Voltar"
                          style={{
                            width: 48,
                            height: 48,
                            borderRadius: radii.full,
                            backgroundColor: theme.colors.surface,
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <AppIcon
                            name="chevron-back"
                            size={25}
                            color={theme.colors.textSecondary}
                          />
                        </Pressable>
                      ) : null}
                      <Typography variant="screenTitle">Nova venda</Typography>
                    </View>
                    {helpButton}
                  </View>
                )
              }
              area="new_sale"
              onStart={() => {
                if (products.length === 0) setShowCreateProduct(true);
                else setStep(2);
              }}
              actionLabel={
                products.length === 0
                  ? "Cadastrar produto e continuar"
                  : "Escolher produtos"
              }
              hasRecords={
                (salesData?.total ?? 0) > 0 || step !== FIRST_SALE_STEP || cart.length > 0
              }
              loading={loadingProducts || productsQuery.isError}
              suspended={
                showCreateProduct || showScanner || showBarcodeSearch || guidedFirstSale
              }
            />
            <View
              style={{
                maxWidth: isDesktop ? 520 : undefined,
                paddingTop: spacing.sm,
                paddingBottom: spacing.lg,
              }}
            >
              <FormStepProgress
                current={saleStepPosition(step)}
                steps={SALE_STEP_ORDER.map((saleStep) => ({
                  label: STEP_LABELS[saleStep - 1],
                  title: STEP_TITLES[saleStep],
                }))}
                onStepPress={(target) => setStep(SALE_STEP_ORDER[target - 1] ?? step)}
              />
            </View>

            <View style={{ paddingBottom: spacing.lg }}>
              <Typography variant="h3">{STEP_TITLES[step]}</Typography>
              <Typography variant="body" style={{ marginTop: spacing.sm }}>
                {STEP_SUBTITLES[step]}
              </Typography>
            </View>

            <View style={[{ flex: 1, minHeight: 0 }, isDesktop ? split.row : undefined]}>
              <View
                onLayout={(event) => setMainWidth(event.nativeEvent.layout.width)}
                style={[
                  { flex: 1, minWidth: 0, minHeight: 0 },
                  isDesktop ? split.main : undefined,
                ]}
              >
                {/* Step 2: Select Products */}
                {step === 2 && (
                  <ScrollView
                    style={{ flex: 1 }}
                    contentContainerStyle={{ paddingBottom: spacing.lg }}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                  >
                    <View
                      style={{
                        gap: spacing.lg,
                        paddingBottom: spacing.lg,
                      }}
                    >
                      <ValidationField {...formValidation.field("cart")}>
                        <View style={searchFieldStyle}>
                          <SearchBox
                            placeholder="Buscar produto..."
                            value={productSearch}
                            onChangeText={setProductSearch}
                            onTrailingPress={() => setShowScanner(true)}
                          />
                        </View>
                      </ValidationField>
                    </View>

                    <View
                      style={{
                        gap: spacing.lg,
                        paddingBottom: spacing.lg,
                      }}
                    >
                      <View
                        style={{
                          flexDirection: "row",
                          flexWrap: "wrap",
                          gap: spacing.md,
                        }}
                      >
                        <QuickActionCard
                          icon="add-circle-outline"
                          title="Novo produto"
                          onPress={() => {
                            setCreateProductInitial(undefined);
                            setShowCreateProduct(true);
                          }}
                        />
                        <QuickActionCard
                          icon="barcode-outline"
                          title="Usar código"
                          onPress={() => setShowScanner(true)}
                        />
                      </View>
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          justifyContent: "space-between",
                        }}
                      >
                        <View
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            gap: spacing.sm,
                          }}
                        >
                          <Typography variant="bodyBold">Seus produtos</Typography>
                        </View>
                        <Pressable
                          onPress={() => router.push("/products")}
                          accessibilityRole="button"
                          hitSlop={10}
                        >
                          <Typography
                            variant="caption"
                            color={theme.colors.textSecondary}
                          >
                            Ver todos
                          </Typography>
                        </Pressable>
                      </View>
                    </View>

                    {productsQuery.error ? (
                      <View style={{ paddingVertical: spacing.xl, gap: spacing.md }}>
                        <Typography variant="h3">
                          Não foi possível carregar os produtos
                        </Typography>
                        <Typography variant="body" color={theme.colors.textSecondary}>
                          Verifique sua conexão e tente novamente.
                        </Typography>
                        <Button
                          title="Tentar novamente"
                          variant="secondary"
                          onPress={() => void productsQuery.refetch()}
                        />
                      </View>
                    ) : null}
                    {loadingProducts && (
                      <View style={{ flex: 1 }}>
                        <SkeletonList rows={5} variant="picker" />
                      </View>
                    )}
                    {!loadingProducts &&
                      !productsQuery.error &&
                      !!filteredProducts?.length && (
                        <View>
                          <View
                            style={{
                              flexDirection: "row",
                              flexWrap: "wrap",
                              justifyContent: "flex-start",
                              gap: spacing.md,
                            }}
                          >
                            {filteredProducts.map((item) => {
                              const qty = getCartQuantity(item.id);
                              const cartItem = getCartItem(item.id);
                              const stockLabel = productStockLabel(item);
                              const selected = qty > 0;
                              return (
                                <Pressable
                                  key={item.id}
                                  onPress={() => addToCart(item)}
                                  onLongPress={() => removeFromCart(item.id)}
                                  accessibilityRole="button"
                                  accessibilityLabel={`Produto ${displayProductName(item.name)}`}
                                  accessibilityHint="Toque para adicionar à venda"
                                  accessibilityState={{ selected }}
                                  style={({ pressed }) => ({
                                    width: productCardWidth,
                                    borderRadius: radii.lg,
                                    padding: spacing.sm,
                                    gap: spacing.xs,
                                    ...getSurfaceStyle(theme),
                                    borderColor: selected
                                      ? pal.wine
                                      : theme.colors.border,
                                    backgroundColor: selected
                                      ? theme.colors.surface
                                      : theme.colors.surfaceElevated,
                                    opacity: pressed ? 0.86 : 1,
                                  })}
                                >
                                  <View
                                    style={{
                                      flexDirection: "row",
                                      justifyContent: "space-between",
                                      alignItems: "center",
                                    }}
                                  >
                                    <View
                                      style={{
                                        width: 40,
                                        height: 40,
                                        borderRadius: radii.md,
                                        overflow: "hidden",
                                        backgroundColor: theme.colors.surface,
                                        alignItems: "center",
                                        justifyContent: "center",
                                      }}
                                    >
                                      {item.photoUrl ? (
                                        <Image
                                          source={{ uri: item.photoUrl }}
                                          style={{ width: "100%", height: "100%" }}
                                          resizeMode="cover"
                                        />
                                      ) : (
                                        <Typography
                                          variant="bodyBold"
                                          color={theme.colors.textSecondary}
                                        >
                                          {productInitial(item.name)}
                                        </Typography>
                                      )}
                                    </View>
                                    {selected ? (
                                      <AppIcon
                                        name="checkmark-circle"
                                        size={18}
                                        color={pal.wine}
                                      />
                                    ) : null}
                                  </View>
                                  <Typography
                                    variant="bodyBold"
                                    numberOfLines={2}
                                    style={{ marginTop: spacing.sm, minHeight: 40 }}
                                  >
                                    {displayProductName(item.name)}
                                  </Typography>
                                  <Typography variant="bodyBold">
                                    {formatCurrency(item.salePrice)}
                                    {item.saleUnit === "kg" ? "/kg" : ""}
                                  </Typography>
                                  {stockLabel &&
                                  stockLabel !== "Sem controle de estoque" ? (
                                    <Typography
                                      variant="caption"
                                      color={
                                        stockLabel.includes("baixo") ||
                                        stockLabel === "Sem estoque"
                                          ? theme.colors.alert
                                          : theme.colors.textSecondary
                                      }
                                      numberOfLines={2}
                                    >
                                      {stockLabel}
                                    </Typography>
                                  ) : null}
                                  <View style={{ flex: 1 }} />
                                  <View
                                    style={{
                                      flexDirection: "row",
                                      alignItems: "center",
                                      marginTop: spacing.sm,
                                      borderTopWidth: 1,
                                      borderTopColor: theme.colors.border,
                                      paddingTop: spacing.xs,
                                    }}
                                  >
                                    {selected ? (
                                      <>
                                        <Pressable
                                          onPress={(event) => {
                                            event.stopPropagation();
                                            removeFromCart(item.id);
                                          }}
                                          accessibilityRole="button"
                                          accessibilityLabel={`Diminuir quantidade de ${displayProductName(item.name)}`}
                                          style={{
                                            width: 44,
                                            height: 44,
                                            alignItems: "center",
                                            justifyContent: "center",
                                          }}
                                        >
                                          <AppIcon
                                            name="remove"
                                            size={18}
                                            color={theme.colors.text}
                                          />
                                        </Pressable>
                                        <QuantityPulse
                                          value={qty}
                                          style={{
                                            flex: 1,
                                            minWidth: 0,
                                            alignItems: "center",
                                          }}
                                        >
                                          <Typography
                                            variant="caption"
                                            color={pal.wine}
                                            numberOfLines={1}
                                            adjustsFontSizeToFit
                                            minimumFontScale={0.75}
                                          >
                                            {cartItem?.saleUnit === "kg"
                                              ? formatWeight(qty)
                                              : qty}
                                          </Typography>
                                        </QuantityPulse>
                                      </>
                                    ) : (
                                      <Typography
                                        variant="caption"
                                        color={theme.colors.textSecondary}
                                        style={{ flex: 1 }}
                                      >
                                        Adicionar
                                      </Typography>
                                    )}
                                    <Pressable
                                      onPress={(event) => {
                                        event.stopPropagation();
                                        addToCart(item);
                                      }}
                                      accessibilityRole="button"
                                      accessibilityLabel={`Adicionar ${displayProductName(item.name)}`}
                                      style={{
                                        width: 44,
                                        height: 44,
                                        alignItems: "center",
                                        justifyContent: "center",
                                        borderRadius: radii.md,
                                        backgroundColor: theme.colors.surface,
                                      }}
                                    >
                                      <AppIcon name="add" size={20} color={pal.wine} />
                                    </Pressable>
                                  </View>
                                </Pressable>
                              );
                            })}
                          </View>
                        </View>
                      )}
                    {!loadingProducts &&
                    !productsQuery.error &&
                    filteredProducts.length === 0 ? (
                      <View style={{ paddingVertical: spacing.xl, gap: spacing.sm }}>
                        <Typography variant="bodyBold">
                          {productSearch
                            ? "Nenhum produto encontrado"
                            : "Cadastre seu primeiro produto"}
                        </Typography>
                        <Typography variant="body">
                          {productSearch
                            ? "Tente outro nome ou use o código do produto."
                            : "Toque em Novo produto para começar esta venda."}
                        </Typography>
                      </View>
                    ) : null}
                  </ScrollView>
                )}

                {/* Step 1: Select Client */}
                {step === 1 && (
                  <View
                    style={{
                      flex: 1,
                      gap: spacing.md,
                      paddingBottom: isDesktop ? 0 : navigationBottomPadding,
                    }}
                  >
                    <Pressable
                      onPress={() => {
                        setSelectedClient(null);
                        setStep(nextSaleStep(1));
                      }}
                      accessibilityRole="button"
                      accessibilityLabel="Venda avulsa"
                      style={({ pressed }) => ({
                        minHeight: 72,
                        borderRadius: radii.lg,
                        paddingHorizontal: spacing.lg,
                        paddingVertical: spacing.md,
                        flexDirection: "row",
                        alignItems: "center",
                        gap: spacing.md,
                        opacity: pressed ? 0.86 : 1,
                        width: isDesktop ? "100%" : undefined,
                        ...getSurfaceStyle(theme),
                      })}
                    >
                      <View
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: radii.full,
                          backgroundColor: theme.colors.surface,
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <AppIcon
                          name="person-outline"
                          size={iconSizes.md}
                          color={theme.colors.textSecondary}
                        />
                      </View>
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <Typography
                          variant="bodyBold"
                          color={theme.colors.text}
                          numberOfLines={1}
                        >
                          Venda avulsa
                        </Typography>
                        <Typography
                          variant="caption"
                          color={theme.colors.textSecondary}
                          numberOfLines={1}
                        >
                          Continuar sem cliente
                        </Typography>
                      </View>
                      <AppIcon
                        name="chevron-forward"
                        size={24}
                        color={theme.colors.textSecondary}
                      />
                    </Pressable>

                    <View style={searchFieldStyle}>
                      <SearchBox
                        placeholder="Buscar cliente"
                        value={clientSearch}
                        onChangeText={setClientSearch}
                        trailingIcon="filter-outline"
                        trailingLabel="Filtrar clientes"
                        onTrailingPress={() => setShowClientFilter(true)}
                      />
                    </View>
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: spacing.sm,
                        }}
                      >
                        <Typography variant="bodyBold">Seus clientes</Typography>
                      </View>
                      <Pressable
                        onPress={() => router.push("/tabs/clients")}
                        accessibilityRole="button"
                        hitSlop={10}
                      >
                        <Typography variant="caption" color={theme.colors.textSecondary}>
                          Ver todos
                        </Typography>
                      </Pressable>
                    </View>

                    {clientsQuery.error ? (
                      <View style={{ gap: spacing.md }}>
                        <Typography variant="h3">
                          Não foi possível carregar os clientes
                        </Typography>
                        <Typography variant="body" color={theme.colors.textSecondary}>
                          Você ainda pode continuar como venda avulsa ou tentar novamente.
                        </Typography>
                        <Button
                          title="Tentar novamente"
                          variant="secondary"
                          onPress={() => void clientsQuery.refetch()}
                        />
                      </View>
                    ) : null}
                    {!clientsQuery.error && loadingClients ? (
                      <SkeletonList rows={4} variant="client" />
                    ) : null}
                    {!clientsQuery.error && !loadingClients ? (
                      <FlatList
                        key={isDesktop ? "clients-desktop" : "clients-mobile"}
                        data={filteredClients}
                        keyExtractor={(item) => item.id}
                        numColumns={isDesktop ? 2 : 1}
                        keyboardShouldPersistTaps="handled"
                        showsVerticalScrollIndicator={false}
                        style={{ flex: 1, minHeight: 0 }}
                        columnWrapperStyle={isDesktop ? { gap: spacing.md } : undefined}
                        contentContainerStyle={{
                          gap: isDesktop ? spacing.sm : 0,
                          paddingBottom: spacing.lg,
                        }}
                        renderItem={({ item }: { item: Client }) => (
                          <Pressable
                            accessibilityRole="button"
                            accessibilityLabel={`Selecionar ${item.name}`}
                            onPress={() => {
                              setSelectedClient({ id: item.id, name: item.name });
                              setStep(nextSaleStep(1));
                            }}
                            style={({ pressed }) => [
                              {
                                minHeight: 72,
                                borderRadius: isDesktop ? radii.lg : 0,
                                paddingVertical: spacing.md,
                                paddingHorizontal: isDesktop ? spacing.lg : spacing.xs,
                                flexDirection: "row",
                                alignItems: "center",
                                gap: spacing.md,
                                borderBottomWidth: 1,
                                borderColor: theme.colors.border,
                                backgroundColor: pressed
                                  ? theme.colors.surface
                                  : theme.colors.background,
                                opacity: pressed ? 0.86 : 1,
                                flex: isDesktop ? 1 : undefined,
                                marginBottom: isDesktop ? spacing.sm : 0,
                              },
                            ]}
                          >
                            <ClientPickerAvatar name={item.name} />
                            <View style={{ flex: 1, minWidth: 0 }}>
                              <Typography variant="bodyBold" numberOfLines={1}>
                                {item.name}
                              </Typography>
                              {item.phone && (
                                <Typography variant="caption">{item.phone}</Typography>
                              )}
                            </View>
                            <AppIcon
                              name="chevron-forward"
                              size={18}
                              color={theme.colors.textSecondary}
                            />
                          </Pressable>
                        )}
                        ListEmptyComponent={
                          clientSearch ? (
                            <Typography
                              variant="caption"
                              color={theme.colors.textSecondary}
                            >
                              Nenhum cliente encontrado
                            </Typography>
                          ) : (
                            <Typography
                              variant="caption"
                              color={theme.colors.textSecondary}
                            >
                              Nenhum cliente para este filtro
                            </Typography>
                          )
                        }
                      />
                    ) : null}
                  </View>
                )}

                {/* Step 3: Payment Method */}
                {step === 3 && (
                  <ScrollView
                    style={{ flex: 1 }}
                    contentContainerStyle={{
                      gap: spacing.md,
                      paddingBottom: spacing.lg,
                    }}
                  >
                    <ValidationField {...formValidation.field("paymentMethod")}>
                      <View
                        accessibilityRole="radiogroup"
                        accessibilityLabel="Forma de pagamento"
                        style={{
                          flexDirection: isDesktop ? "row" : "column",
                          flexWrap: "wrap",
                          gap: spacing.sm,
                        }}
                      >
                        {PAYMENT_OPTIONS.map((option) => {
                          const isSelected = paymentMethod === option.value;
                          // Fundo opaco mantém a seleção consistente no Android.
                          const cardBackgroundColor = isSelected
                            ? theme.colors.surface
                            : theme.colors.surfaceElevated;
                          const subtitles: Record<PaymentMethod, string> = {
                            pix: "Pagamento instantâneo",
                            cash: "Pagamento em espécie",
                            card: "Débito ou crédito",
                            credit: "Pagamento para depois",
                            transfer: "Transferência bancária",
                          };
                          return (
                            <Pressable
                              key={option.value}
                              onPress={() => setPaymentMethod(option.value)}
                              accessibilityRole="radio"
                              accessibilityLabel={option.label}
                              accessibilityState={{ checked: isSelected }}
                              style={{
                                flexDirection: "row",
                                alignItems: "center",
                                gap: spacing.md,
                                minHeight: 68,
                                paddingVertical: spacing.md,
                                paddingHorizontal: spacing.lg,
                                borderRadius: radii.xl,
                                ...getSurfaceStyle(theme),
                                borderWidth: 1,
                                borderColor: isSelected ? pal.wine : theme.colors.border,
                                backgroundColor: cardBackgroundColor,
                                width: isDesktop ? paymentCardWidth : "100%",
                              }}
                            >
                              <View
                                style={{
                                  width: 36,
                                  height: 36,
                                  borderRadius: radii.md,
                                  backgroundColor: theme.colors.surface,
                                  alignItems: "center",
                                  justifyContent: "center",
                                }}
                              >
                                <AppIcon
                                  name={option.icon as AppIconName}
                                  size={24}
                                  color={
                                    isSelected ? pal.wine : theme.colors.textSecondary
                                  }
                                />
                              </View>
                              <View style={{ flex: 1 }}>
                                <Typography variant="bodyBold">{option.label}</Typography>
                                <Typography variant="caption">
                                  {subtitles[option.value]}
                                </Typography>
                              </View>
                              <AppIcon
                                name={isSelected ? "checkmark-circle" : "ellipse-outline"}
                                size={24}
                                color={isSelected ? pal.wine : theme.colors.textSecondary}
                              />
                            </Pressable>
                          );
                        })}
                      </View>
                    </ValidationField>
                    <Card
                      style={{
                        ...getSurfaceStyle(theme),
                        ...(isDesktop ? { width: "100%" } : null),
                      }}
                    >
                      <FormSection
                        collapsible={false}
                        title="Ajustes da venda"
                        subtitle="Desconto e observações são opcionais."
                      >
                        <SaleAdjustmentsFields
                          discountType={discountType}
                          discountInput={discountInput}
                          notes={notes}
                          discountTooHigh={pricing.total <= 0}
                          onDiscountTypeChange={setDiscountType}
                          onDiscountInputChange={setDiscountInput}
                          onNotesChange={setNotes}
                        />
                      </FormSection>
                    </Card>
                    <Typography variant="caption" color={theme.colors.textSecondary}>
                      Na próxima etapa, você confere tudo antes de registrar.
                    </Typography>
                  </ScrollView>
                )}

                {/* Step 4: Review & Confirm */}
                {step === 4 && (
                  <ScrollView
                    style={{ flex: 1 }}
                    contentContainerStyle={{ gap: spacing.md, paddingBottom: spacing.lg }}
                    showsVerticalScrollIndicator={false}
                  >
                    <Card style={{ ...getSurfaceStyle(theme), borderRadius: radii.lg }}>
                      <View
                        style={{
                          flexDirection: "row",
                          flexWrap: "wrap",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: spacing.sm,
                        }}
                      >
                        <Typography variant="bodyBold">Itens da venda</Typography>
                        <Pressable
                          onPress={() => setStep(2)}
                          accessibilityRole="button"
                          accessibilityLabel="Editar itens da venda"
                          style={{
                            minHeight: 44,
                            flexDirection: "row",
                            alignItems: "center",
                            gap: spacing.xs,
                          }}
                        >
                          <AppIcon
                            name="pencil-outline"
                            size={16}
                            color={theme.colors.textSecondary}
                          />
                          <Typography variant="caption">Editar itens</Typography>
                        </Pressable>
                      </View>
                      {cart.map((item) => {
                        const photoUrl = getCartItemPhotoUrl(item);
                        return (
                          <View
                            key={`${item.productId}:${item.variationId ?? "default"}`}
                            style={{
                              flexDirection: "row",
                              alignItems: "flex-start",
                              gap: spacing.md,
                              paddingVertical: spacing.md,
                              borderBottomWidth: 1,
                              borderBottomColor: theme.colors.border,
                            }}
                          >
                            <View
                              style={{
                                width: 40,
                                height: 40,
                                borderRadius: radii.md,
                                overflow: "hidden",
                                backgroundColor: theme.colors.surface,
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              {photoUrl ? (
                                <Image
                                  source={{ uri: photoUrl }}
                                  style={{ width: "100%", height: "100%" }}
                                  resizeMode="cover"
                                />
                              ) : (
                                <Typography
                                  variant="bodyBold"
                                  color={theme.colors.textSecondary}
                                >
                                  {productInitial(item.productName)}
                                </Typography>
                              )}
                            </View>
                            <View style={{ flex: 1, minWidth: 0, gap: spacing.xs }}>
                              <Typography variant="bodyBold" numberOfLines={2}>
                                {displayProductName(item.productName)}
                              </Typography>
                              {item.variationName ? (
                                <Typography variant="caption">
                                  {item.variationName}
                                </Typography>
                              ) : null}
                              <Typography variant="caption">
                                {cartQuantityLabel(item)} ×{" "}
                                {formatCurrency(item.unitPrice)}
                                {item.saleUnit === "kg" ? "/kg" : ""}
                              </Typography>
                              <Typography variant="bodyBold">
                                {formatCurrency(item.unitPrice * item.quantity)}
                              </Typography>
                            </View>
                          </View>
                        );
                      })}
                      <Typography variant="caption" style={{ marginTop: spacing.md }}>
                        {cartItemSummary}
                      </Typography>
                    </Card>

                    <Card
                      style={{
                        ...getSurfaceStyle(theme),
                        borderRadius: radii.lg,
                        gap: spacing.xs,
                      }}
                    >
                      <Typography variant="bodyBold">Dados da venda</Typography>
                      <ReviewDetail
                        label="Cliente"
                        value={selectedClient?.name ?? "Venda avulsa"}
                        onEdit={() => setStep(1)}
                      />
                      <View style={{ height: 1, backgroundColor: theme.colors.border }} />
                      <ReviewDetail
                        label="Pagamento"
                        value={paymentMethodLabel}
                        onEdit={() => setStep(3)}
                      />
                    </Card>

                    <Card
                      style={{
                        ...getSurfaceStyle(theme),
                        borderRadius: radii.lg,
                        gap: spacing.md,
                      }}
                    >
                      <View
                        style={{
                          flexDirection: "row",
                          justifyContent: "space-between",
                          gap: spacing.md,
                        }}
                      >
                        <Typography variant="body">Subtotal</Typography>
                        <Typography variant="bodyBold">
                          {formatCurrency(pricing.subtotal)}
                        </Typography>
                      </View>
                      {pricing.discount > 0 ? (
                        <View
                          style={{
                            flexDirection: "row",
                            justifyContent: "space-between",
                            gap: spacing.md,
                          }}
                        >
                          <Typography variant="body">Desconto</Typography>
                          <Typography variant="bodyBold">
                            − {formatCurrency(pricing.discount)}
                          </Typography>
                        </View>
                      ) : null}
                      <View
                        style={{
                          borderTopWidth: 1,
                          borderTopColor: theme.colors.border,
                          paddingTop: spacing.md,
                          gap: spacing.xs,
                        }}
                      >
                        <Typography variant="caption">Total da venda</Typography>
                        <Typography
                          variant="moneyLg"
                          color={theme.colors.text}
                          numberOfLines={1}
                          adjustsFontSizeToFit
                        >
                          {formatCurrency(pricing.total)}
                        </Typography>
                      </View>
                      {notes.trim() ? (
                        <View style={{ gap: spacing.xs }}>
                          <Typography variant="caption">Observações</Typography>
                          <Typography variant="body">{notes.trim()}</Typography>
                        </View>
                      ) : null}
                    </Card>
                  </ScrollView>
                )}
              </View>
            </View>
          </View>

          {!isDesktop && step !== 1 && (
            <View
              style={{
                paddingHorizontal: spacing.xl,
                paddingTop: spacing.md,
                paddingBottom: navigationBottomPadding,
                gap: spacing.xs,
                borderTopWidth: 1,
                borderTopColor: theme.colors.border,
                backgroundColor: theme.colors.background,
              }}
            >
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}
              >
                <View style={{ flex: 1, minWidth: 0, gap: spacing.xs }}>
                  <Typography variant="caption" numberOfLines={1}>
                    {step === 2 ? cartItemSummary : "Total da venda"}
                  </Typography>
                  <Typography
                    variant="moneyLg"
                    color={theme.colors.text}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.65}
                  >
                    {formatCurrency(summaryTotal)}
                  </Typography>
                </View>
                <Button
                  title={nextActionLabel}
                  accessibilityLabel={saleNextStepAccessibilityLabel(step)}
                  loading={createSale.isPending}
                  disabled={step === 2 && cart.length === 0}
                  size="lg"
                  style={{
                    flex: 1,
                    minWidth: 0,
                    borderRadius: radii.md,
                    backgroundColor: actionFill,
                  }}
                  onPress={() => {
                    if (step === 4) {
                      void handleSubmit();
                      return;
                    }
                    if (canAdvance()) setStep((current) => nextSaleStep(current));
                  }}
                  icon={
                    <AppIcon
                      name={step === 4 ? "checkmark" : "arrow-forward"}
                      size={18}
                      color={theme.colors.textOnPrimary}
                    />
                  }
                />
              </View>
              {step === 2 ? (
                <QuickSaleButton
                  itemCount={cart.length}
                  hasClient={Boolean(selectedClient)}
                  pending={createSale.isPending}
                  onConfirm={(payment) => {
                    void handleSubmit(payment);
                  }}
                />
              ) : null}
            </View>
          )}
        </>
      )}
      <BarcodeScanner
        visible={showScanner}
        onClose={() => setShowScanner(false)}
        onScanned={(scanned) => {
          setShowScanner(false);
          void handleProductCode(scanned);
        }}
        onManual={() => {
          setShowScanner(false);
          setShowBarcodeSearch(true);
        }}
      />
      <StandardModal
        visible={showBarcodeSearch}
        onClose={() => setShowBarcodeSearch(false)}
        title="Buscar por código"
        subtitle="Digite ou cole o código do produto para filtrar a lista."
        footer={
          <FormActions>
            <Button
              title="Cancelar"
              variant="outline"
              onPress={() => setShowBarcodeSearch(false)}
            />
            <Button
              title="Buscar produto"
              onPress={handleBarcodeSearch}
              loading={productCodeLookup.isPending}
            />
          </FormActions>
        }
      >
        <FormField label="Código" validation={barcodeValidation.field("code")}>
          <TextField
            icon="barcode-outline"
            placeholder="Ex: 789... ou LC-ABC123"
            accessibilityLabel="Código do produto"
            value={barcodeInput}
            onChangeText={setBarcodeInput}
            autoCapitalize="characters"
            returnKeyType="search"
            onSubmitEditing={handleBarcodeSearch}
            autoFocus
          />
        </FormField>
      </StandardModal>
      {showCreateProduct ? (
        <CreateProductForm
          key={createProductInitial?.code ?? "manual"}
          initialValues={createProductInitial}
          modal={{
            visible: true,
            title: "Novo produto",
            onClose: () => setShowCreateProduct(false),
          }}
          onSuccess={(product) => {
            setShowCreateProduct(false);
            setCreateProductInitial(undefined);
            addToCart(product);
            setStep(2);
            if (guidanceUserId)
              guidanceEvent("new_sale", "prerequisite_resumed", guidanceUserId);
          }}
        />
      ) : null}
      <ResponsiveOverlayModal
        visible={showClientFilter}
        animationType="slide"
        transparent
        onRequestClose={() => setShowClientFilter(false)}
      >
        <Pressable
          onPress={() => setShowClientFilter(false)}
          style={{
            flex: 1,
            backgroundColor: theme.colors.overlay,
            justifyContent: isDesktop ? "center" : "flex-end",
            padding: isDesktop ? spacing.xl : 0,
          }}
        >
          <Pressable
            onPress={(event) => event.stopPropagation()}
            style={[
              {
                backgroundColor: theme.colors.surface,
                borderTopLeftRadius: radii["2xl"],
                borderTopRightRadius: radii["2xl"],
                padding: spacing.xl,
                paddingBottom: isDesktop
                  ? spacing.xl
                  : Math.max(insets.bottom + spacing["3xl"], spacing["5xl"]),
                gap: spacing.md,
              },
              desktopModalSurface(isDesktop, 640),
            ]}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Typography variant="h3">Filtrar clientes</Typography>
              <Pressable
                onPress={() => setShowClientFilter(false)}
                accessibilityLabel="Fechar"
                hitSlop={12}
              >
                <AppIcon
                  name="close-outline"
                  size={26}
                  color={theme.colors.textSecondary}
                />
              </Pressable>
            </View>

            {[
              ["all", "Todos", "Mostrar todos os clientes"],
              ["withPhone", "Com telefone", "Mostrar clientes com telefone cadastrado"],
              ["withoutPhone", "Sem telefone", "Mostrar clientes sem telefone"],
            ].map(([value, label, description]) => {
              const selected = clientFilter === value;
              return (
                <Pressable
                  key={value}
                  onPress={() => {
                    setClientFilter(value as ClientFilter);
                    setShowClientFilter(false);
                  }}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  style={{
                    minHeight: 64,
                    borderRadius: radii.xl,
                    padding: spacing.lg,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: spacing.md,
                    borderWidth: selected ? 2 : 1,
                    borderColor: selected ? theme.colors.primary : theme.colors.surface,
                    ...getSurfaceStyle(theme),
                  }}
                >
                  <AppIcon
                    name={selected ? "radio-button-on" : "radio-button-off"}
                    size={22}
                    color={
                      selected ? theme.colors.primaryStrong : theme.colors.textSecondary
                    }
                  />
                  <View style={{ flex: 1 }}>
                    <Typography variant="bodyBold">{label}</Typography>
                    <Typography variant="caption">{description}</Typography>
                  </View>
                </Pressable>
              );
            })}

            <Button
              title="Limpar filtros"
              variant="secondary"
              style={{ borderRadius: radii.md }}
              onPress={() => {
                setClientFilter("all");
                setClientSearch("");
                setShowClientFilter(false);
              }}
            />
          </Pressable>
        </Pressable>
      </ResponsiveOverlayModal>

      <ResponsiveOverlayModal
        visible={variationsEnabled && variationProduct !== null}
        animationType="fade"
        transparent
        onRequestClose={() => setVariationProduct(null)}
      >
        <Pressable
          onPress={() => setVariationProduct(null)}
          style={{
            flex: 1,
            backgroundColor: theme.colors.overlay,
            justifyContent: "center",
            padding: spacing.xl,
          }}
        >
          <Pressable
            onPress={(event) => event.stopPropagation()}
            style={[
              {
                backgroundColor: theme.colors.background,
                borderRadius: radii.xl,
                padding: spacing.xl,
                gap: spacing.md,
              },
              desktopModalSurface(isDesktop, 480),
            ]}
          >
            <Typography variant="h3">Escolha a variacao</Typography>
            <Typography variant="caption" color={theme.colors.textSecondary}>
              {variationProduct?.name}
            </Typography>
            {variationProduct?.variations?.map((variation) => (
              <Button
                key={variation.id}
                title={variation.name}
                variant="secondary"
                onPress={() => {
                  const product = variationProduct;
                  setVariationProduct(null);
                  addToCart(product, variation);
                }}
              />
            ))}
          </Pressable>
        </Pressable>
      </ResponsiveOverlayModal>

      {/* Peso (kg) para produtos vendidos por quilo */}
      <StandardModal
        visible={weightProduct !== null}
        onClose={() => setWeightProduct(null)}
        title={weightProduct?.name ?? "Peso"}
        subtitle={
          weightProduct ? `${formatCurrency(weightProduct.salePrice)}/kg` : undefined
        }
        footer={
          <FormActions>
            <Button
              title="Cancelar"
              variant="outline"
              onPress={() => setWeightProduct(null)}
            />
            <Button title="Adicionar à venda" onPress={confirmWeight} />
          </FormActions>
        }
      >
        <FormField label="Peso" validation={weightValidation.field("weight")}>
          <TextField
            icon="scale-outline"
            placeholder="Ex: 1,5"
            accessibilityLabel="Peso, em quilos"
            suffix="kg"
            value={weightInput}
            onChangeText={setWeightInput}
            keyboardType="decimal-pad"
            numericMode="decimal"
            returnKeyType="done"
            onSubmitEditing={confirmWeight}
            autoFocus
          />
        </FormField>
        {weightProduct && !isNaN(parseFloat(weightInput.replace(",", "."))) && (
          <Typography variant="bodyBold" color={theme.colors.text}>
            Subtotal:{" "}
            {formatCurrency(
              parseFloat(weightInput.replace(",", ".")) * weightProduct.salePrice,
            )}
          </Typography>
        )}
      </StandardModal>
    </SafeAreaView>
  );
}
