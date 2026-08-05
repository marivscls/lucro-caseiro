import { formatCurrency } from "../../shared/utils/format";
import type {
  Product,
  ProductVariation,
  Client,
  PaymentMethod,
  SaleUnit,
} from "@lucro-caseiro/contracts";
import { useRouter } from "expo-router";
import {
  Button,
  Card,
  colors,
  fonts,
  iconSizes,
  Input,
  ModalHeader,
  Typography,
  useBrand,
  useTheme,
  spacing,
  radii,
} from "@lucro-caseiro/ui";
import { AppIcon } from "../../shared/components/app-icon";
import type { AppIconName } from "../../shared/components/app-icon";
import React, { useState } from "react";
import {
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  TextInput,
  View,
  type ViewStyle,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { avatarPastel } from "../../features/clients/components/avatar-colors";
import { useClients } from "../../features/clients/hooks";
import { CreateProductForm } from "../../features/products/components/create-product-form";
import { productMatchesSearch } from "../../features/products/barcode";
import { useAllProducts, useProductCodeLookup } from "../../features/products/hooks";
import {
  cartTotal as computeCartTotal,
  formatWeight,
  salePricing,
} from "../../features/sales/cart";
import { useCreateSale, useSales } from "../../features/sales/hooks";
import { PAYMENT_LABELS } from "../../features/sales/payment";
import { useInterstitial } from "../../shared/hooks/use-interstitial";
import { useLimitCheck } from "../../shared/hooks/use-limit-check";
import { useOfflineQueue } from "../../shared/hooks/use-offline-queue";
import { usePaywall } from "../../shared/hooks/use-paywall";
import { ApiError } from "../../shared/utils/api-client";
import { maybeAskForReview } from "../../shared/utils/store-review";
import { showAlert } from "../../shared/components/alert-store";
import { BarcodeScanner } from "../../shared/components/barcode-scanner";
import { SkeletonList } from "../../shared/components/skeleton";
import {
  ResponsiveModal,
  ResponsiveOverlayModal,
} from "../../shared/components/responsive-modal-surface";
import { floatingTabBarContentPadding } from "../../shared/layout/floating-tab-bar";
import { useDesktopLayout } from "../../shared/layout/use-desktop-layout";
import {
  desktopCompactField,
  desktopModalSurface,
  desktopSplitLayout,
  desktopStretch,
  desktopWidths,
  pageGutter,
} from "../../shared/layout/desktop-density";
import { alertValidation, alertError } from "../../shared/utils/alerts";

type Step = 1 | 2 | 3 | 4;

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

const TOTAL_STEPS = 4;
const FIXED_ACTION_MIN_HEIGHT = 68;

const STEP_SUBTITLES: Record<Step, string> = {
  1: "Escolha um cliente existente ou continue sem cliente.",
  2: "Escolha um produto ou adicione um novo.",
  3: "Escolha como o cliente irá pagar.",
  4: "Confira os itens e finalize a venda.",
};

// Cores de avatar pre-definidas, referenciando a paleta do tema.
const AVATAR_COLORS = [
  colors.primary,
  colors.success,
  colors.blue,
  colors.lavender,
  colors.premium,
  colors.yellow,
];

function getAvatarColor(index: number): string {
  return AVATAR_COLORS[index % AVATAR_COLORS.length];
}

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

/** Avatar de cliente no seletor: mesma cor pastel (hash por nome) da lista de clientes. */
function ClientPickerAvatar({ name }: Readonly<{ name: string }>) {
  const { theme } = useTheme();
  const pastel = avatarPastel(name, theme.mode);
  return (
    <View
      style={{
        width: 48,
        height: 48,
        borderRadius: radii.full,
        backgroundColor: pastel.bg,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Typography variant="bodyBold" color={pastel.fg}>
        {(name.trim().charAt(0) || "?").toUpperCase()}
      </Typography>
    </View>
  );
}

function SearchBox({
  placeholder,
  value,
  onChangeText,
  trailingIcon = "scan-outline",
  onTrailingPress,
}: Readonly<{
  placeholder: string;
  value: string;
  onChangeText: (value: string) => void;
  trailingIcon?: AppIconName;
  onTrailingPress?: () => void;
}>) {
  const { theme } = useTheme();
  return (
    <View
      style={{
        height: 62,
        borderRadius: radii.xl,
        paddingHorizontal: spacing.xl,
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.md,
        ...getSurfaceStyle(theme),
      }}
    >
      <AppIcon name="search-outline" size={24} color={theme.colors.textSecondary} />
      <TextInput
        placeholder={placeholder}
        placeholderTextColor={theme.colors.textSecondary + "90"}
        value={value}
        onChangeText={onChangeText}
        style={{
          flex: 1,
          color: theme.colors.text,
          fontSize: 18,
          fontFamily: fonts.semiBold,
          padding: 0,
        }}
      />
      <Pressable
        onPress={onTrailingPress}
        disabled={!onTrailingPress}
        hitSlop={12}
        accessibilityRole="button"
        accessibilityLabel="Abrir busca por código"
        style={{
          width: 34,
          height: 34,
          alignItems: "center",
          justifyContent: "center",
          opacity: onTrailingPress ? 1 : 0.7,
        }}
      >
        <AppIcon name={trailingIcon} size={24} color={theme.colors.textSecondary} />
      </Pressable>
    </View>
  );
}

function stepDotColor(
  reached: boolean,
  theme: ReturnType<typeof useTheme>["theme"],
): string {
  if (reached) return theme.colors.primary;
  return theme.colors.border;
}

function StepIndicator({
  step,
  align = "center",
}: Readonly<{ step: Step; align?: "center" | "flex-start" }>) {
  const { theme } = useTheme();
  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: align,
        alignItems: "center",
        gap: spacing.sm,
        paddingVertical: spacing.lg,
        maxWidth: align === "flex-start" ? 420 : undefined,
      }}
    >
      {Array.from({ length: TOTAL_STEPS }, (_, i) => (
        <View
          key={i}
          style={{
            width: i + 1 === step ? 42 : 12,
            height: 12,
            borderRadius: radii.full,
            backgroundColor: stepDotColor(i + 1 <= step, theme),
          }}
        />
      ))}
    </View>
  );
}

function QuickActionCard({
  icon,
  title,
  subtitle,
  onPress,
}: Readonly<{
  icon: AppIconName;
  title: string;
  subtitle: string;
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
          minHeight: 90,
          borderRadius: radii.xl,
          padding: spacing.sm,
          flexDirection: "row",
          alignItems: "center",
          gap: spacing.sm,
          opacity: pressed ? 0.86 : 1,
          ...getSurfaceStyle(theme),
        },
      ]}
    >
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: radii.full,
          backgroundColor: theme.colors.surface,
          borderWidth: 1,
          borderColor: theme.colors.border,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <AppIcon name={icon} size={22} color={theme.colors.textSecondary} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Typography variant="bodyBold" color={theme.colors.text} numberOfLines={2}>
          {title}
        </Typography>
        <Typography variant="caption" numberOfLines={2}>
          {subtitle}
        </Typography>
      </View>
    </Pressable>
  );
}

export default function NewSaleScreen() {
  const { theme } = useTheme();
  const { copy } = useBrand();
  const isDesktop = useDesktopLayout();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const fixedActionBottomOffset = floatingTabBarContentPadding(insets.bottom);
  const fixedActionScrollPadding =
    fixedActionBottomOffset + FIXED_ACTION_MIN_HEIGHT + spacing["2xl"];
  const { show: showInterstitial } = useInterstitial();
  const { checkAndBlock: checkSalesLimit } = useLimitCheck("sales");
  const showPaywall = usePaywall((s) => s.show);
  const [step, setStep] = useState<Step>(1);
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

  const cartTotal = computeCartTotal(cart);
  const parsedDiscount = Number.parseFloat(discountInput.replace(",", ".")) || 0;
  const pricing = salePricing(cartTotal, discountType, parsedDiscount);

  function addToCart(product: Product, variation?: ProductVariation) {
    if ((product.variations?.length ?? 0) > 0 && !variation) {
      setVariationProduct(product);
      return;
    }
    // Produtos por peso (kg) abrem um campo pra digitar o peso em kg.
    if (product.saleUnit === "kg") {
      const existing = cart.find(
        (i) => i.productId === product.id && i.variationId === variation?.id,
      );
      setWeightProduct(product);
      setWeightVariation(variation ?? null);
      setWeightInput(existing ? String(existing.quantity).replace(".", ",") : "");
      return;
    }
    setCart((prev) => {
      const existing = prev.find(
        (i) => i.productId === product.id && i.variationId === variation?.id,
      );
      if (existing) {
        return prev.map((i) =>
          i.productId === product.id && i.variationId === variation?.id
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
          variationId: variation?.id,
          variationName: variation?.name,
        },
      ];
    });
  }

  function confirmWeight() {
    if (!weightProduct) return;
    const weight = parseFloat(weightInput.replace(",", "."));
    if (isNaN(weight) || weight <= 0) {
      alertValidation("Digite um peso maior que zero (em kg)");
      return;
    }
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
    setStep(1);
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
    const query = barcodeInput.trim();
    if (!query) {
      alertValidation("Digite ou cole um código para buscar.");
      return;
    }
    void handleProductCode(query);
  }

  async function handleSubmit() {
    if (!paymentMethod || cart.length === 0) return;
    if (pricing.total <= 0) {
      alertValidation("O desconto precisa deixar um total maior que zero.");
      return;
    }
    if (checkSalesLimit()) return;

    const payload = {
      clientId: selectedClient?.id,
      paymentMethod,
      ...(discountType && parsedDiscount > 0
        ? { discountType, discountValue: parsedDiscount }
        : {}),
      ...(notes.trim() ? { notes: notes.trim() } : {}),
      items: cart.map((i) => ({
        productId: i.productId,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        variationId: i.variationId,
        variationName: i.variationName,
      })),
    };

    try {
      const result = await createSale.mutateAsync(payload);
      showAlert({
        title: "Venda registrada!",
        message: `Total: ${formatCurrency(result.total)}`,
        buttons: [
          { text: "Nova venda", onPress: resetForm },
          {
            text: "Ver e compartilhar recibo",
            onPress: () => {
              resetForm();
              router.push({
                pathname: "/tabs/sales",
                params: { saleId: result.id },
              });
            },
          },
        ],
      });
      showInterstitial();
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
      // Falha de rede (sem resposta HTTP): salva a venda na fila offline.
      // setupAutoSync envia automaticamente quando a conexao voltar.
      if (!(e instanceof ApiError)) {
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

  function canAdvance(): boolean {
    if (step === 1) return true;
    if (step === 2) return cart.length > 0;
    if (step === 3) return paymentMethod !== null;
    return true;
  }

  function handleHelpPress() {
    const messages: Record<Step, string> = {
      1: "Escolha um cliente da lista ou continue como cliente avulso.",
      2: "Toque no + do produto para adicionar. Use o - para diminuir. O total fica sempre no rodape.",
      3: "Selecione a forma de pagamento combinada com o cliente.",
      4: "Revise os itens, cliente, pagamento e total antes de registrar a venda.",
    };

    showAlert({ title: "Ajuda", message: messages[step] });
  }

  const filteredProducts = products.filter((product) =>
    productMatchesSearch(product, productSearch),
  );
  const productGridItems: Array<Product | null> = [...filteredProducts];
  if (productGridItems.length % 2 === 1) {
    productGridItems.push(null);
  }
  const clientItems = clientsData?.items ?? [];
  let filteredClients = clientItems;
  if (clientFilter === "withPhone") {
    filteredClients = clientItems.filter((client) => Boolean(client.phone));
  }
  if (clientFilter === "withoutPhone") {
    filteredClients = clientItems.filter((client) => !client.phone);
  }

  const split = desktopSplitLayout(isDesktop);
  const pageZone = desktopStretch(isDesktop, desktopWidths.data);
  const searchFieldStyle = isDesktop
    ? { maxWidth: 480, width: "100%" as const }
    : undefined;
  const paymentMethodLabel =
    PAYMENT_OPTIONS.find((option) => option.value === paymentMethod)?.label ?? "—";
  const summaryTotal = step >= 3 ? pricing.total : cartTotal;
  let cartItemSummary = "Nenhum item ainda";
  if (cart.length > 0) {
    const itemLabel = cart.length === 1 ? "item" : "itens";
    cartItemSummary = `${cart.length} ${itemLabel}`;
  }

  const desktopSummaryAside = isDesktop ? (
    <View style={split.aside}>
      <View
        style={{
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          borderRadius: radii.xl,
          borderWidth: 1,
          overflow: "hidden",
        }}
      >
        <View style={{ gap: spacing.xs, padding: spacing.xl }}>
          <Typography variant="label">RESUMO DA VENDA</Typography>
          <Typography
            variant="moneyHero"
            color={
              summaryTotal > 0 ? theme.colors.primaryStrong : theme.colors.textSecondary
            }
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.55}
          >
            {formatCurrency(summaryTotal)}
          </Typography>
        </View>
        <View
          style={{
            borderTopColor: theme.colors.border,
            borderTopWidth: 1,
            gap: spacing.md,
            padding: spacing.lg,
          }}
        >
          <View style={{ gap: 2 }}>
            <Typography variant="caption" color={theme.colors.textSecondary}>
              Cliente
            </Typography>
            <Typography variant="bodyBold" numberOfLines={2}>
              {selectedClient?.name ?? "Cliente avulso"}
            </Typography>
          </View>
          <View style={{ gap: 2 }}>
            <Typography variant="caption" color={theme.colors.textSecondary}>
              Itens
            </Typography>
            <Typography variant="bodyBold">{cartItemSummary}</Typography>
          </View>
          <View style={{ gap: 2 }}>
            <Typography variant="caption" color={theme.colors.textSecondary}>
              Pagamento
            </Typography>
            <Typography variant="bodyBold">{paymentMethodLabel}</Typography>
          </View>
          {pricing.discount > 0 ? (
            <View style={{ gap: 2 }}>
              <Typography variant="caption" color={theme.colors.textSecondary}>
                Desconto
              </Typography>
              <Typography variant="bodyBold" color={theme.colors.success}>
                − {formatCurrency(pricing.discount)}
              </Typography>
            </View>
          ) : null}
        </View>
      </View>

      <View style={{ gap: spacing.sm }}>
        {step > 1 ? (
          <Button
            title="Voltar"
            variant="secondary"
            onPress={() => setStep((current) => (current - 1) as Step)}
            icon={<AppIcon name="chevron-back" size={16} color={theme.colors.text} />}
            style={{ borderRadius: radii.md, width: "100%" }}
          />
        ) : null}
        {step < 4 ? (
          <Button
            title="Próximo"
            disabled={!canAdvance()}
            onPress={() => {
              if (step === 1) {
                setStep(2);
                return;
              }
              if (step === 2) {
                setStep(3);
                return;
              }
              setStep(4);
            }}
            icon={
              <AppIcon
                name="arrow-forward"
                size={16}
                color={theme.colors.textOnPrimary}
              />
            }
            style={{ borderRadius: radii.md, width: "100%" }}
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
            style={{ borderRadius: radii.md, width: "100%" }}
          />
        )}
      </View>
    </View>
  ) : null;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <View
        style={{
          flex: 1,
          ...pageGutter(isDesktop),
          ...pageZone,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingTop: spacing.lg,
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
                onPress={() =>
                  step > 1 ? setStep((s) => (s - 1) as Step) : router.push("/tabs/sales")
                }
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
            <Typography variant="screenTitle">Nova Venda</Typography>
          </View>
          <Pressable
            onPress={handleHelpPress}
            accessibilityRole="button"
            accessibilityLabel="Ajuda"
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 4,
              minHeight: 48,
              paddingHorizontal: spacing.sm,
            }}
          >
            <AppIcon
              name="help-circle-outline"
              size={24}
              color={theme.colors.textSecondary}
            />
            <Typography variant="caption" color={theme.colors.textSecondary}>
              Ajuda
            </Typography>
          </Pressable>
        </View>

        <StepIndicator step={step} align={isDesktop ? "flex-start" : "center"} />

        <View style={{ paddingBottom: spacing.xl }}>
          <Typography variant="h1">{STEP_TITLES[step]}</Typography>
          <Typography variant="body" style={{ marginTop: spacing.sm }}>
            {STEP_SUBTITLES[step]}
          </Typography>
        </View>

        <View style={[{ flex: 1 }, isDesktop ? split.row : undefined]}>
          <View style={[{ flex: 1, minWidth: 0 }, isDesktop ? split.main : undefined]}>
            {/* Step 2: Select Products */}
            {step === 2 && (
              <View style={{ flex: 1 }}>
                <View
                  style={{
                    gap: spacing.lg,
                    paddingBottom: spacing.lg,
                  }}
                >
                  <View style={searchFieldStyle}>
                    <SearchBox
                      placeholder="Buscar produto..."
                      value={productSearch}
                      onChangeText={setProductSearch}
                      onTrailingPress={() => setShowScanner(true)}
                    />
                  </View>
                  <Typography
                    variant="caption"
                    color={theme.colors.textSecondary}
                    style={{ height: 0, overflow: "hidden" }}
                  >
                    Toque pra adicionar. Use o - pra tirar uma unidade.
                  </Typography>
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
                      maxWidth: isDesktop ? 720 : undefined,
                    }}
                  >
                    <QuickActionCard
                      icon="add-circle-outline"
                      title="Adicionar produto"
                      subtitle="Criar novo item"
                      onPress={() => {
                        setCreateProductInitial(undefined);
                        setShowCreateProduct(true);
                      }}
                    />
                    <QuickActionCard
                      icon="barcode-outline"
                      title="Usar código"
                      subtitle="Escanear produto"
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
                      <AppIcon
                        name="pricetag-outline"
                        size={22}
                        color={theme.colors.textSecondary}
                      />
                      <Typography variant="bodyBold">Produtos frequentes</Typography>
                    </View>
                    <Pressable
                      onPress={() => router.push("/products")}
                      accessibilityRole="button"
                      hitSlop={10}
                    >
                      <Typography variant="bodyBold" color={theme.colors.primaryStrong}>
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
                    <ScrollView
                      style={{ flex: 1 }}
                      contentContainerStyle={{
                        paddingBottom:
                          cart.length > 0 && !isDesktop
                            ? fixedActionScrollPadding
                            : spacing.lg,
                      }}
                      showsVerticalScrollIndicator={false}
                    >
                      <View
                        style={{
                          flexDirection: "row",
                          flexWrap: "wrap",
                          justifyContent: "flex-start",
                          gap: spacing.md,
                        }}
                      >
                        {productGridItems.map((item, index) => {
                          if (!item) {
                            return (
                              <View
                                key={`product-spacer-${index}`}
                                style={{ width: isDesktop ? "31%" : "48%" }}
                              />
                            );
                          }
                          const qty = getCartQuantity(item.id);
                          const cartItem = getCartItem(item.id);
                          const stockLabel = productStockLabel(item);
                          return (
                            <Pressable
                              key={item.id}
                              onPress={() => addToCart(item)}
                              onLongPress={() => removeFromCart(item.id)}
                              style={{
                                width: isDesktop ? "31%" : "48%",
                                maxWidth: isDesktop ? "31%" : "48%",
                                minWidth: isDesktop ? 220 : undefined,
                                flexGrow: 0,
                                flexShrink: 0,
                                alignSelf: "flex-start",
                                borderRadius: radii.xl,
                                minHeight: 112,
                                padding: spacing.sm,
                                gap: spacing.xs,
                                borderWidth: qty > 0 ? 2 : 1,
                                borderColor:
                                  qty > 0 ? theme.colors.primary : theme.colors.surface,
                                ...getSurfaceStyle(theme),
                              }}
                            >
                              <View
                                style={{
                                  width: 42,
                                  height: 42,
                                  borderRadius: radii.full,
                                  overflow: "hidden",
                                  backgroundColor: getAvatarColor(index),
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
                                    variant="h3"
                                    color={theme.colors.textOnPrimary}
                                  >
                                    {item.name.charAt(0).toUpperCase()}
                                  </Typography>
                                )}
                              </View>
                              <Pressable
                                onPress={(event) => {
                                  event.stopPropagation();
                                  addToCart(item);
                                }}
                                hitSlop={10}
                                accessibilityRole="button"
                                accessibilityLabel={`Adicionar ${item.name}`}
                                style={{
                                  position: "absolute",
                                  top: spacing.sm,
                                  right: spacing.sm,
                                  backgroundColor: theme.colors.surface,
                                  borderWidth: 1,
                                  borderColor: theme.colors.border,
                                  borderRadius: radii.full,
                                  width: 28,
                                  height: 28,
                                  alignItems: "center",
                                  justifyContent: "center",
                                }}
                              >
                                <AppIcon name="add" size={18} color={theme.colors.text} />
                              </Pressable>
                              <Typography
                                variant="bodyBold"
                                color={theme.colors.text}
                                style={{ marginTop: spacing.md }}
                                numberOfLines={2}
                              >
                                {item.name}
                              </Typography>
                              <Typography variant="bodyBold" color={theme.colors.success}>
                                {item.saleUnit === "kg"
                                  ? `${formatCurrency(item.salePrice)}/kg`
                                  : formatCurrency(item.salePrice)}
                              </Typography>
                              {stockLabel ? (
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
                              {qty > 0 && (
                                <View
                                  style={{
                                    position: "absolute",
                                    top: spacing.sm,
                                    right: 44,
                                    backgroundColor: theme.colors.primaryBg,
                                    borderRadius: radii.full,
                                    minWidth: 24,
                                    height: 24,
                                    paddingHorizontal:
                                      cartItem?.saleUnit === "kg" ? spacing.sm : 0,
                                    alignItems: "center",
                                    justifyContent: "center",
                                  }}
                                >
                                  <Typography
                                    variant="caption"
                                    color={theme.colors.primaryStrong}
                                    style={{ fontFamily: fonts.bold }}
                                  >
                                    {cartItem ? cartQuantityLabel(cartItem) : qty}
                                  </Typography>
                                </View>
                              )}
                              {qty > 0 && (
                                <Pressable
                                  onPress={(event) => {
                                    event.stopPropagation();
                                    removeFromCart(item.id);
                                  }}
                                  hitSlop={10}
                                  accessibilityRole="button"
                                  accessibilityLabel={`Tirar uma unidade de ${item.name}`}
                                  style={{
                                    position: "absolute",
                                    top: spacing.sm,
                                    left: spacing.sm,
                                    backgroundColor: theme.colors.surfaceElevated,
                                    borderRadius: radii.full,
                                    width: 24,
                                    height: 24,
                                    alignItems: "center",
                                    justifyContent: "center",
                                  }}
                                >
                                  <AppIcon
                                    name="remove"
                                    size={16}
                                    color={theme.colors.text}
                                  />
                                </Pressable>
                              )}
                            </Pressable>
                          );
                        })}
                      </View>
                      <View
                        style={{
                          marginTop: spacing.lg,
                          borderRadius: radii.xl,
                          padding: spacing.md,
                          flexDirection: "row",
                          alignItems: "center",
                          gap: spacing.sm,
                          ...getSurfaceStyle(theme),
                        }}
                      >
                        <View
                          style={{
                            width: 38,
                            height: 38,
                            borderRadius: radii.full,
                            backgroundColor: theme.colors.surface,
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <AppIcon
                            name="sparkles-outline"
                            size={20}
                            color={theme.colors.textSecondary}
                          />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Typography variant="bodyBold">Dica rápida</Typography>
                          <Typography variant="caption">
                            Toque em um produto para adicioná-lo à venda ou use o buscador
                            para encontrar mais rápido.
                          </Typography>
                        </View>
                      </View>
                    </ScrollView>
                  )}
              </View>
            )}

            {/* Step 1: Select Client */}
            {step === 1 && (
              <View
                style={{
                  flex: 1,
                  gap: spacing.lg,
                }}
              >
                <Pressable
                  onPress={() => {
                    setSelectedClient(null);
                    setStep(2);
                  }}
                  accessibilityRole="button"
                  style={({ pressed }) => ({
                    minHeight: 74,
                    borderRadius: radii.xl,
                    paddingHorizontal: spacing.lg,
                    paddingVertical: spacing.md,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: spacing.md,
                    opacity: pressed ? 0.86 : 1,
                    maxWidth: isDesktop ? 560 : undefined,
                    width: isDesktop ? "100%" : undefined,
                    ...getSurfaceStyle(theme),
                  })}
                >
                  <View
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
                      Sem cliente (avulso)
                    </Typography>
                    <Typography
                      variant="body"
                      color={theme.colors.textSecondary}
                      numberOfLines={1}
                    >
                      Continuar sem selecionar um cliente
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
                    placeholder="Buscar cliente..."
                    value={clientSearch}
                    onChangeText={setClientSearch}
                    trailingIcon="filter-outline"
                    onTrailingPress={() => setShowClientFilter(true)}
                  />
                </View>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    maxWidth: isDesktop ? 720 : undefined,
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: spacing.sm,
                    }}
                  >
                    <AppIcon
                      name="person-outline"
                      size={22}
                      color={theme.colors.textSecondary}
                    />
                    <Typography variant="bodyBold">Clientes recentes</Typography>
                  </View>
                  <Pressable
                    onPress={() => router.push("/tabs/clients")}
                    accessibilityRole="button"
                    hitSlop={10}
                  >
                    <Typography variant="bodyBold" color={theme.colors.primaryStrong}>
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
                    columnWrapperStyle={isDesktop ? { gap: spacing.md } : undefined}
                    contentContainerStyle={{
                      gap: spacing.sm,
                      paddingBottom: isDesktop ? spacing.lg : fixedActionScrollPadding,
                    }}
                    renderItem={({ item }: { item: Client }) => (
                      <Pressable
                        onPress={() => {
                          setSelectedClient({ id: item.id, name: item.name });
                          setStep(2);
                        }}
                        style={({ pressed }) => [
                          {
                            minHeight: 82,
                            borderRadius: radii.xl,
                            padding: spacing.lg,
                            flexDirection: "row",
                            alignItems: "center",
                            gap: spacing.md,
                            borderWidth: selectedClient?.id === item.id ? 2 : 1,
                            borderColor:
                              selectedClient?.id === item.id
                                ? theme.colors.primary
                                : theme.colors.surface,
                            opacity: pressed ? 0.86 : 1,
                            flex: isDesktop ? 1 : undefined,
                            marginBottom: isDesktop ? spacing.sm : 0,
                            ...getSurfaceStyle(theme),
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
                          size={24}
                          color={theme.colors.textSecondary}
                        />
                      </Pressable>
                    )}
                    ListEmptyComponent={
                      clientSearch ? (
                        <Typography variant="caption" color={theme.colors.textSecondary}>
                          Nenhum cliente encontrado
                        </Typography>
                      ) : (
                        <Typography variant="caption" color={theme.colors.textSecondary}>
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
                  paddingBottom: isDesktop ? spacing.lg : fixedActionScrollPadding,
                }}
              >
                <View
                  style={{
                    flexDirection: isDesktop ? "row" : "column",
                    flexWrap: "wrap",
                    gap: spacing.sm,
                  }}
                >
                  {PAYMENT_OPTIONS.map((option) => {
                    const isSelected = paymentMethod === option.value;
                    // Selecionado: fundo OPACO (nunca translúcido) — bg translúcido + a
                    // elevation do surface faz o Android pintar uma "caixa branca" atrás.
                    // Selecao = fundo rosado suave (primaryBg); demais = neutro.
                    const cardBackgroundColor = isSelected
                      ? theme.colors.primaryBg
                      : theme.colors.surfaceElevated;
                    const subtitles: Record<PaymentMethod, string> = {
                      pix: "Pagamento instantâneo",
                      cash: "Pagamento em espécie",
                      card: "Débito ou crédito",
                      credit: "Pagamento para depois",
                      transfer: "TED, DOC ou outro banco",
                    };
                    return (
                      <Pressable
                        key={option.value}
                        onPress={() => setPaymentMethod(option.value)}
                        accessibilityRole="button"
                        accessibilityState={{ selected: isSelected }}
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: spacing.md,
                          minHeight: 78,
                          paddingVertical: spacing.md,
                          paddingHorizontal: spacing.lg,
                          borderRadius: radii.xl,
                          ...getSurfaceStyle(theme),
                          borderWidth: isSelected ? 2 : 1,
                          borderColor: isSelected
                            ? theme.colors.primary
                            : theme.colors.surface,
                          backgroundColor: cardBackgroundColor,
                          width: isDesktop ? "48%" : "100%",
                          maxWidth: isDesktop ? "48%" : undefined,
                          minWidth: isDesktop ? 280 : undefined,
                        }}
                      >
                        <View
                          style={{
                            width: 48,
                            height: 48,
                            borderRadius: radii.lg,
                            backgroundColor: isSelected
                              ? theme.colors.primaryBg
                              : theme.colors.surface,
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <AppIcon
                            name={option.icon as AppIconName}
                            size={24}
                            color={
                              isSelected
                                ? theme.colors.primaryStrong
                                : theme.colors.textSecondary
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
                          name={isSelected ? "checkmark-circle" : "chevron-forward"}
                          size={24}
                          color={
                            isSelected
                              ? theme.colors.primaryStrong
                              : theme.colors.textSecondary
                          }
                        />
                      </Pressable>
                    );
                  })}
                </View>
                <Card
                  style={{
                    ...getSurfaceStyle(theme),
                    ...(isDesktop ? { maxWidth: 720, width: "100%" } : null),
                  }}
                >
                  <Typography variant="h3">Ajustes da venda</Typography>
                  <Typography
                    variant="caption"
                    color={theme.colors.textSecondary}
                    style={{ marginTop: spacing.xs, marginBottom: spacing.md }}
                  >
                    Adicione desconto e observações antes da revisão.
                  </Typography>
                  <View
                    style={{
                      flexDirection: "row",
                      flexWrap: "wrap",
                      gap: spacing.sm,
                      marginBottom: spacing.md,
                    }}
                  >
                    {[
                      { value: null, label: "Sem desconto" },
                      { value: "fixed" as const, label: "Valor em R$" },
                      { value: "percentage" as const, label: "Porcentagem" },
                    ].map((option) => {
                      const selected = discountType === option.value;
                      return (
                        <Pressable
                          key={option.label}
                          onPress={() => {
                            setDiscountType(option.value);
                            if (option.value === null) setDiscountInput("");
                          }}
                          accessibilityRole="button"
                          accessibilityState={{ selected }}
                          style={{
                            minHeight: 44,
                            justifyContent: "center",
                            paddingHorizontal: spacing.md,
                            borderRadius: radii.full,
                            backgroundColor: selected
                              ? theme.colors.primaryBg
                              : theme.colors.surface,
                            borderWidth: 1,
                            borderColor: selected
                              ? theme.colors.primary
                              : theme.colors.border,
                          }}
                        >
                          <Typography
                            variant="caption"
                            color={
                              selected
                                ? theme.colors.primaryStrong
                                : theme.colors.textSecondary
                            }
                          >
                            {option.label}
                          </Typography>
                        </Pressable>
                      );
                    })}
                  </View>
                  {discountType ? (
                    <View style={desktopCompactField(isDesktop)}>
                      <Input
                        label={
                          discountType === "percentage" ? "Desconto (%)" : "Desconto (R$)"
                        }
                        value={discountInput}
                        onChangeText={setDiscountInput}
                        keyboardType="decimal-pad"
                        placeholder={
                          discountType === "percentage" ? "Ex.: 10" : "Ex.: 5,00"
                        }
                        error={
                          pricing.total <= 0
                            ? "O desconto deve ser menor que o subtotal."
                            : undefined
                        }
                        containerStyle={{ marginBottom: spacing.md }}
                      />
                    </View>
                  ) : null}
                  <Input
                    label="Observações do pedido"
                    value={notes}
                    onChangeText={setNotes}
                    placeholder="Ex.: separar em duas embalagens"
                    maxLength={500}
                    multiline
                    numberOfLines={3}
                    style={{
                      height: 80,
                      textAlignVertical: "top",
                      paddingTop: spacing.md,
                    }}
                  />
                </Card>
                <View
                  style={{
                    marginTop: spacing.sm,
                    borderRadius: radii.xl,
                    padding: spacing.lg,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: spacing.md,
                    ...getSurfaceStyle(theme),
                  }}
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
                      name="information-circle-outline"
                      size={22}
                      color={theme.colors.textSecondary}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Typography variant="bodyBold">Dica rápida</Typography>
                    <Typography variant="caption">
                      Você poderá revisar os dados da venda antes de finalizar.
                    </Typography>
                  </View>
                </View>
              </ScrollView>
            )}

            {/* Step 4: Review & Confirm */}
            {step === 4 && (
              <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={{
                  gap: spacing.lg,
                  paddingBottom: isDesktop ? spacing.lg : fixedActionScrollPadding,
                  maxWidth: isDesktop ? 720 : undefined,
                  width: "100%",
                }}
              >
                <Card style={getSurfaceStyle(theme)}>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: spacing.md,
                    }}
                  >
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: spacing.md,
                      }}
                    >
                      <View
                        style={{
                          width: 46,
                          height: 46,
                          borderRadius: radii.full,
                          backgroundColor: theme.colors.surface,
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <AppIcon
                          name="bag-check-outline"
                          size={24}
                          color={theme.colors.textSecondary}
                        />
                      </View>
                      <Typography variant="h3">Itens da venda</Typography>
                    </View>
                    <Pressable
                      onPress={() => setStep(2)}
                      accessibilityRole="button"
                      style={{
                        minHeight: 44,
                        borderRadius: radii.full,
                        paddingHorizontal: spacing.md,
                        flexDirection: "row",
                        alignItems: "center",
                        gap: spacing.xs,
                        backgroundColor: theme.colors.surface,
                        borderWidth: 1,
                        borderColor: theme.colors.border,
                      }}
                    >
                      <AppIcon
                        name="pencil-outline"
                        size={iconSizes.xs}
                        color={theme.colors.textSecondary}
                      />
                      <Typography variant="caption" color={theme.colors.textSecondary}>
                        Editar itens
                      </Typography>
                    </Pressable>
                  </View>
                  {cart.map((item) => {
                    const photoUrl = getCartItemPhotoUrl(item);
                    return (
                      <View
                        key={`${item.productId}:${item.variationId ?? "default"}`}
                        style={{
                          flexDirection: "row",
                          justifyContent: "space-between",
                          alignItems: "center",
                          paddingVertical: spacing.md,
                          borderBottomWidth: 1,
                          borderBottomColor: theme.colors.border,
                        }}
                      >
                        <View
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            gap: spacing.md,
                            flex: 1,
                            minWidth: 0,
                          }}
                        >
                          <View
                            style={{
                              width: 58,
                              height: 58,
                              borderRadius: radii.lg,
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
                              <Typography variant="h3" color={theme.colors.textSecondary}>
                                {item.productName.charAt(0).toUpperCase()}
                              </Typography>
                            )}
                          </View>
                          <View style={{ flex: 1, minWidth: 0 }}>
                            <Typography variant="bodyBold" numberOfLines={2}>
                              {item.productName}
                            </Typography>
                            {item.variationName ? (
                              <Typography variant="caption">
                                {item.variationName}
                              </Typography>
                            ) : null}
                            <Typography variant="caption">
                              {item.saleUnit === "kg"
                                ? `${formatWeight(item.quantity)} x ${formatCurrency(item.unitPrice)}/kg`
                                : `${item.quantity}x ${formatCurrency(item.unitPrice)}`}
                            </Typography>
                          </View>
                        </View>
                        <Typography
                          variant="bodyBold"
                          color={theme.colors.success}
                          style={{ marginLeft: spacing.sm }}
                        >
                          {formatCurrency(item.unitPrice * item.quantity)}
                        </Typography>
                      </View>
                    );
                  })}
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      paddingTop: spacing.md,
                    }}
                  >
                    <Typography variant="body">{cart.length} itens</Typography>
                    <Typography variant="money">
                      {formatCurrency(pricing.subtotal)}
                    </Typography>
                  </View>
                </Card>

                <Card style={getSurfaceStyle(theme)}>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: spacing.md,
                    }}
                  >
                    <View
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
                        name="person-outline"
                        size={27}
                        color={theme.colors.textSecondary}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Typography variant="caption">Cliente</Typography>
                      <Typography variant="caption">Pagamento</Typography>
                    </View>
                    <View style={{ alignItems: "flex-end", flexShrink: 1, minWidth: 0 }}>
                      <Typography
                        variant="caption"
                        numberOfLines={1}
                        style={{ fontFamily: fonts.bold }}
                      >
                        {selectedClient?.name ?? "Cliente avulso"}
                      </Typography>
                      <Typography
                        variant="caption"
                        numberOfLines={1}
                        style={{ fontFamily: fonts.bold }}
                      >
                        {PAYMENT_OPTIONS.find((o) => o.value === paymentMethod)?.label ??
                          "-"}
                      </Typography>
                    </View>
                    <AppIcon
                      name="chevron-forward"
                      size={24}
                      color={theme.colors.textSecondary}
                    />
                  </View>
                </Card>

                {(pricing.discount > 0 || Boolean(notes.trim())) && (
                  <Card style={getSurfaceStyle(theme)}>
                    {pricing.discount > 0 ? (
                      <>
                        <View
                          style={{
                            flexDirection: "row",
                            justifyContent: "space-between",
                            marginBottom: spacing.sm,
                          }}
                        >
                          <Typography variant="body">Subtotal</Typography>
                          <Typography variant="bodyBold">
                            {formatCurrency(pricing.subtotal)}
                          </Typography>
                        </View>
                        <View
                          style={{
                            flexDirection: "row",
                            justifyContent: "space-between",
                            marginBottom: notes.trim() ? spacing.lg : 0,
                          }}
                        >
                          <Typography variant="body" color={theme.colors.success}>
                            Desconto
                          </Typography>
                          <Typography variant="bodyBold" color={theme.colors.success}>
                            − {formatCurrency(pricing.discount)}
                          </Typography>
                        </View>
                      </>
                    ) : null}
                    {notes.trim() ? (
                      <View>
                        <Typography variant="caption" color={theme.colors.textSecondary}>
                          Observações
                        </Typography>
                        <Typography variant="body">{notes.trim()}</Typography>
                      </View>
                    ) : null}
                  </Card>
                )}

                <Card style={getSurfaceStyle(theme)}>
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: spacing.md,
                    }}
                  >
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: spacing.md,
                      }}
                    >
                      <View
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
                          name="pricetag-outline"
                          size={27}
                          color={theme.colors.textSecondary}
                        />
                      </View>
                      <Typography variant="h3">Total da venda</Typography>
                    </View>
                    <Typography variant="money" style={{ flexShrink: 0 }}>
                      {formatCurrency(pricing.total)}
                    </Typography>
                  </View>
                </Card>

                {!isDesktop ? (
                  <>
                    <Button
                      title={copy.saleLabel}
                      size="lg"
                      style={{ borderRadius: radii.md }}
                      onPress={() => {
                        void handleSubmit();
                      }}
                      loading={createSale.isPending}
                      icon={
                        <AppIcon
                          name="checkmark-circle"
                          size={18}
                          color={theme.colors.textOnPrimary}
                        />
                      }
                    />
                    <View
                      style={{
                        alignItems: "center",
                        flexDirection: "row",
                        justifyContent: "center",
                        gap: spacing.sm,
                      }}
                    >
                      <AppIcon
                        name="lock-closed-outline"
                        size={18}
                        color={theme.colors.textSecondary}
                      />
                      <Typography variant="body">Venda segura e protegida</Typography>
                    </View>
                  </>
                ) : null}
              </ScrollView>
            )}
          </View>
          {desktopSummaryAside}
        </View>
      </View>

      {!isDesktop && step === 2 && cart.length > 0 && (
        <View
          style={{
            position: "absolute",
            left: spacing.xl,
            right: spacing.xl,
            bottom: fixedActionBottomOffset,
            minHeight: FIXED_ACTION_MIN_HEIGHT,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            borderRadius: radii.xl,
            padding: spacing.md,
            gap: spacing.md,
            ...getSurfaceStyle(theme),
          }}
        >
          <View style={{ flex: 1, minWidth: 0 }}>
            <Typography variant="label">TOTAL SELECIONADO</Typography>
            <Typography variant="moneyLg">{formatCurrency(cartTotal)}</Typography>
          </View>
          <Button
            title="Próximo"
            onPress={() => setStep(3)}
            style={{
              borderRadius: radii.md,
              minWidth: 138,
            }}
            icon={
              <AppIcon
                name="arrow-forward"
                size={16}
                color={theme.colors.textOnPrimary}
              />
            }
          />
        </View>
      )}

      {/* Navigation Buttons (client and payment steps) — mobile only */}
      {!isDesktop && (step === 1 || step === 3) && (
        <View
          style={{
            position: "absolute",
            left: spacing.xl,
            right: spacing.xl,
            bottom: fixedActionBottomOffset,
            minHeight: FIXED_ACTION_MIN_HEIGHT,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: step === 1 ? "flex-end" : undefined,
            padding: spacing.md,
            borderRadius: radii.xl,
            gap: spacing.md,
            ...getSurfaceStyle(theme),
          }}
        >
          {step > 1 ? (
            <Button
              title="Voltar"
              variant="secondary"
              style={{
                flex: 1,
                borderRadius: radii.md,
              }}
              onPress={() => setStep((s) => (s - 1) as Step)}
              icon={<AppIcon name="chevron-back" size={16} color={theme.colors.text} />}
            />
          ) : null}
          <Button
            title="Próximo"
            style={{
              flex: step === 1 ? undefined : 1,
              borderRadius: radii.md,
              ...(step === 1 ? { minWidth: 138 } : null),
            }}
            disabled={!canAdvance()}
            onPress={() => setStep((s) => (s + 1) as Step)}
            icon={
              <AppIcon
                name="arrow-forward"
                size={16}
                color={theme.colors.textOnPrimary}
              />
            }
          />
        </View>
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
      <ResponsiveOverlayModal
        visible={showBarcodeSearch}
        animationType="slide"
        transparent
        onRequestClose={() => setShowBarcodeSearch(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <Pressable
            onPress={() => setShowBarcodeSearch(false)}
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
                  gap: spacing.lg,
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
                <Typography variant="h2">Buscar por código</Typography>
                <Pressable
                  onPress={() => setShowBarcodeSearch(false)}
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
              <Typography variant="body">
                Digite ou cole o código do produto para filtrar a lista.
              </Typography>
              <Input
                label="Código"
                placeholder="Ex: 789... ou LC-ABC123"
                value={barcodeInput}
                onChangeText={setBarcodeInput}
                autoCapitalize="characters"
                returnKeyType="search"
                onSubmitEditing={handleBarcodeSearch}
                autoFocus
              />
              <Button
                title="Buscar produto"
                size="lg"
                style={{ borderRadius: radii.md }}
                icon={
                  <AppIcon
                    name="search-outline"
                    size={18}
                    color={theme.colors.textOnPrimary}
                  />
                }
                onPress={handleBarcodeSearch}
                loading={productCodeLookup.isPending}
              />
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </ResponsiveOverlayModal>
      <ResponsiveModal
        desktopMaxWidth={1120}
        visible={showCreateProduct}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowCreateProduct(false)}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
          <ModalHeader title="Novo produto" onClose={() => setShowCreateProduct(false)} />
          <CreateProductForm
            key={createProductInitial?.code ?? "manual"}
            initialValues={createProductInitial}
            onSuccess={(product) => {
              setShowCreateProduct(false);
              setCreateProductInitial(undefined);
              addToCart(product);
            }}
          />
        </SafeAreaView>
      </ResponsiveModal>
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
              <Typography variant="h2">Filtrar clientes</Typography>
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
        visible={variationProduct !== null}
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
      <ResponsiveOverlayModal
        visible={weightProduct !== null}
        animationType="fade"
        transparent
        onRequestClose={() => setWeightProduct(null)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1, minHeight: 0 }}
        >
          <Pressable
            onPress={() => setWeightProduct(null)}
            style={{
              flex: 1,
              minHeight: 0,
              backgroundColor: theme.colors.overlay,
              justifyContent: "center",
              padding: spacing.xl,
            }}
          >
            <Pressable
              onPress={(e) => e.stopPropagation()}
              style={[
                {
                  backgroundColor: theme.colors.background,
                  borderRadius: radii.xl,
                  padding: spacing.xl,
                  gap: spacing.lg,
                },
                desktopModalSurface(isDesktop, 480),
              ]}
            >
              <Typography variant="h3">{weightProduct?.name}</Typography>
              {weightProduct && (
                <Typography variant="caption" color={theme.colors.textSecondary}>
                  {formatCurrency(weightProduct.salePrice)}/kg
                </Typography>
              )}
              <Input
                label="Peso (kg)"
                placeholder="Ex: 1,5"
                value={weightInput}
                onChangeText={setWeightInput}
                keyboardType="decimal-pad"
                autoFocus
              />
              {weightProduct && !isNaN(parseFloat(weightInput.replace(",", "."))) && (
                <Typography variant="bodyBold" color={theme.colors.success}>
                  Subtotal:{" "}
                  {formatCurrency(
                    parseFloat(weightInput.replace(",", ".")) * weightProduct.salePrice,
                  )}
                </Typography>
              )}
              <Button title="Adicionar" size="lg" onPress={confirmWeight} />
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </ResponsiveOverlayModal>
    </SafeAreaView>
  );
}
