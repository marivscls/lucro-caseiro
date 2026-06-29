import { formatCurrency } from "../../shared/utils/format";
import type { Product, Client, PaymentMethod, SaleUnit } from "@lucro-caseiro/contracts";
import { useRouter } from "expo-router";
import {
  Button,
  Card,
  EmptyState,
  Input,
  ModalHeader,
  Typography,
  useTheme,
  spacing,
  radii,
} from "@lucro-caseiro/ui";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  TextInput,
  View,
  type ViewStyle,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { useClients } from "../../features/clients/hooks";
import { CreateProductForm } from "../../features/products/components/create-product-form";
import { useProducts } from "../../features/products/hooks";
import { cartTotal as computeCartTotal, formatWeight } from "../../features/sales/cart";
import { useCreateSale } from "../../features/sales/hooks";
import { PAYMENT_LABELS } from "../../features/sales/payment";
import { useInterstitial } from "../../shared/hooks/use-interstitial";
import { useLimitCheck } from "../../shared/hooks/use-limit-check";
import { useOfflineQueue } from "../../shared/hooks/use-offline-queue";
import { usePaywall } from "../../shared/hooks/use-paywall";
import { ApiError } from "../../shared/utils/api-client";
import { showAlert } from "../../shared/components/alert-store";
import { BarcodeScanner } from "../../shared/components/barcode-scanner";
import { alertValidation, alertError } from "../../shared/utils/alerts";
import productsEmpty from "../../assets/products-empty.png";

type Step = 1 | 2 | 3 | 4;

interface CartItem {
  productId: string;
  productName: string;
  photoUrl: string | null;
  unitPrice: number;
  quantity: number;
  saleUnit: SaleUnit;
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
  1: "O que você vai vender?",
  2: "Selecione o cliente",
  3: "Forma de pagamento",
  4: "Revisar e confirmar",
};

const TOTAL_STEPS = 4;
const FIXED_ACTION_BOTTOM_OFFSET = 46;
const FIXED_ACTION_SCROLL_PADDING = 190;

const STEP_SUBTITLES: Record<Step, string> = {
  1: "Escolha um produto ou adicione um novo.",
  2: "Escolha um cliente existente ou continue sem cliente.",
  3: "Escolha como o cliente irá pagar.",
  4: "Confira os itens e finalize a venda.",
};

// Predefined avatar colors from the theme palette
const AVATAR_COLORS = [
  "#C4707E", // primary
  "#6BBF96", // success
  "#89A5B5", // blue
  "#B8A9D4", // lavender
  "#D4A054", // premium
  "#E8C555", // yellow
];

function getAvatarColor(index: number): string {
  return AVATAR_COLORS[index % AVATAR_COLORS.length];
}

/** Rotulo de quantidade no carrinho: unidades (ex.: "3") ou peso (ex.: "1,5 kg"). */
function cartQuantityLabel(item: CartItem): string {
  return item.saleUnit === "kg" ? formatWeight(item.quantity) : String(item.quantity);
}

function getSurfaceStyle(theme: ReturnType<typeof useTheme>["theme"]): ViewStyle {
  return {
    backgroundColor:
      theme.mode === "dark" ? "rgba(44, 36, 32, 0.84)" : theme.colors.surfaceElevated,
    borderWidth: 1,
    borderColor:
      theme.mode === "dark" ? "rgba(245, 225, 219, 0.1)" : "rgba(74, 50, 40, 0.08)",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: theme.mode === "dark" ? 0.24 : 0.07,
    shadowRadius: 18,
    elevation: 3,
  };
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
  trailingIcon?: keyof typeof Ionicons.glyphMap;
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
      <Ionicons name="search-outline" size={24} color={theme.colors.textSecondary} />
      <TextInput
        placeholder={placeholder}
        placeholderTextColor={theme.colors.textSecondary + "90"}
        value={value}
        onChangeText={onChangeText}
        style={{
          flex: 1,
          color: theme.colors.text,
          fontSize: 18,
          fontWeight: "500",
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
        <Ionicons name={trailingIcon} size={24} color={theme.colors.primaryLight} />
      </Pressable>
    </View>
  );
}

function stepDotColor(
  reached: boolean,
  theme: ReturnType<typeof useTheme>["theme"],
): string {
  if (reached) return theme.colors.primary;
  return theme.mode === "dark" ? "rgba(245, 225, 219, 0.12)" : "rgba(74, 50, 40, 0.15)";
}

function StepIndicator({ step }: Readonly<{ step: Step }>) {
  const { theme } = useTheme();
  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        gap: spacing.sm,
        paddingVertical: spacing.lg,
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
  icon: keyof typeof Ionicons.glyphMap;
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
          minHeight: 82,
          borderRadius: radii.xl,
          padding: spacing.md,
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
          width: 44,
          height: 44,
          borderRadius: radii.full,
          backgroundColor: theme.colors.primary,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Ionicons name={icon} size={23} color={theme.colors.textOnPrimary} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Typography variant="bodyBold" color={theme.colors.text} numberOfLines={2}>
          {title}
        </Typography>
        <Typography variant="caption" numberOfLines={1}>
          {subtitle}
        </Typography>
      </View>
    </Pressable>
  );
}

export default function NewSaleScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
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
  const [clientSearch, setClientSearch] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [showCreateProduct, setShowCreateProduct] = useState(false);
  const [showBarcodeSearch, setShowBarcodeSearch] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [showClientFilter, setShowClientFilter] = useState(false);
  const [clientFilter, setClientFilter] = useState<ClientFilter>("all");
  const [barcodeInput, setBarcodeInput] = useState("");
  // Produto por peso (kg) em edicao de quantidade + peso digitado (em kg).
  const [weightProduct, setWeightProduct] = useState<Product | null>(null);
  const [weightInput, setWeightInput] = useState("");

  const { data: productsData, isLoading: loadingProducts } = useProducts();
  const { data: clientsData, isLoading: loadingClients } = useClients({
    search: clientSearch || undefined,
  });
  const createSale = useCreateSale();

  const cartTotal = computeCartTotal(cart);

  function addToCart(product: Product) {
    // Produtos por peso (kg) abrem um campo pra digitar o peso em kg.
    if (product.saleUnit === "kg") {
      const existing = cart.find((i) => i.productId === product.id);
      setWeightProduct(product);
      setWeightInput(existing ? String(existing.quantity).replace(".", ",") : "");
      return;
    }
    setCart((prev) => {
      const existing = prev.find((i) => i.productId === product.id);
      if (existing) {
        return prev.map((i) =>
          i.productId === product.id
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
      const others = prev.filter((i) => i.productId !== product.id);
      return [
        ...others,
        {
          productId: product.id,
          productName: product.name,
          photoUrl: product.photoUrl,
          unitPrice: product.salePrice,
          quantity: weight,
          saleUnit: "kg",
        },
      ];
    });
    setWeightProduct(null);
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
    return cart.find((i) => i.productId === productId)?.quantity ?? 0;
  }

  function getCartItem(productId: string): CartItem | undefined {
    return cart.find((i) => i.productId === productId);
  }

  function getCartItemPhotoUrl(item: CartItem): string | null {
    return (
      item.photoUrl ??
      productsData?.items.find((product) => product.id === item.productId)?.photoUrl ??
      null
    );
  }

  function resetForm() {
    setStep(1);
    setCart([]);
    setSelectedClient(null);
    setPaymentMethod(null);
    setClientSearch("");
    setProductSearch("");
    setBarcodeInput("");
    setShowBarcodeSearch(false);
    setShowClientFilter(false);
    setClientFilter("all");
    setWeightProduct(null);
    setWeightInput("");
  }

  function handleBarcodeSearch() {
    const query = barcodeInput.trim();
    if (!query) {
      alertValidation("Digite ou cole um código para buscar.");
      return;
    }
    setProductSearch(query);
    setShowBarcodeSearch(false);
  }

  async function handleSubmit() {
    if (!paymentMethod || cart.length === 0) return;
    if (checkSalesLimit()) return;

    const payload = {
      clientId: selectedClient?.id,
      paymentMethod,
      items: cart.map((i) => ({
        productId: i.productId,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
      })),
    };

    try {
      const result = await createSale.mutateAsync(payload);
      showAlert({
        title: "Venda registrada!",
        message: `Total: ${formatCurrency(result.total)}`,
      });
      showInterstitial();
      resetForm();
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
          message: `Total: ${formatCurrency(cartTotal)}. Você está sem internet — a venda será enviada automaticamente quando a conexão voltar.`,
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
    if (step === 1) return cart.length > 0;
    if (step === 2) return true;
    if (step === 3) return paymentMethod !== null;
    return true;
  }

  function handleHelpPress() {
    const messages: Record<Step, string> = {
      1: "Toque no + do produto para adicionar. Use o - para diminuir. O total fica sempre no rodape.",
      2: "Escolha um cliente da lista ou continue como cliente avulso.",
      3: "Selecione a forma de pagamento combinada com o cliente.",
      4: "Revise os itens, cliente, pagamento e total antes de registrar a venda.",
    };

    showAlert({ title: "Ajuda", message: messages[step] });
  }

  const filteredProducts = productsData?.items.filter(
    (p) => !productSearch || p.name.toLowerCase().includes(productSearch.toLowerCase()),
  );
  const productGridItems: Array<Product | null> = filteredProducts
    ? [...filteredProducts]
    : [];
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

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: spacing.xl,
          paddingTop: spacing.lg,
          justifyContent: "space-between",
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}>
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
              backgroundColor:
                theme.mode === "dark"
                  ? "rgba(255, 255, 255, 0.05)"
                  : theme.colors.surface,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name="arrow-back" size={25} color={theme.colors.textSecondary} />
          </Pressable>
          <Typography variant="h2">Nova Venda</Typography>
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
          <Ionicons
            name="help-circle-outline"
            size={24}
            color={theme.colors.textSecondary}
          />
          <Typography variant="caption" color={theme.colors.textSecondary}>
            Ajuda
          </Typography>
        </Pressable>
      </View>

      <StepIndicator step={step} />

      <View style={{ paddingHorizontal: spacing.xl, paddingBottom: spacing.lg }}>
        <Typography variant="h1" serif>
          {STEP_TITLES[step]}
        </Typography>
        <Typography variant="body" style={{ marginTop: spacing.sm }}>
          {STEP_SUBTITLES[step]}
        </Typography>
      </View>

      {/* Step 1: Select Products */}
      {step === 1 && (
        <View style={{ flex: 1 }}>
          <View
            style={{
              paddingHorizontal: spacing.xl,
              gap: spacing.lg,
              paddingBottom: spacing.lg,
            }}
          >
            <SearchBox
              placeholder="Buscar produto..."
              value={productSearch}
              onChangeText={setProductSearch}
              onTrailingPress={() => setShowScanner(true)}
            />
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
              paddingHorizontal: spacing.xl,
              gap: spacing.lg,
              paddingBottom: spacing.lg,
            }}
          >
            <View style={{ flexDirection: "row", gap: spacing.md }}>
              <QuickActionCard
                icon="add-circle-outline"
                title="Adicionar produto"
                subtitle="Criar novo item"
                onPress={() => setShowCreateProduct(true)}
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
                style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}
              >
                <Ionicons
                  name="pricetag-outline"
                  size={22}
                  color={theme.colors.primaryLight}
                />
                <Typography variant="bodyBold">Produtos frequentes</Typography>
              </View>
              <Pressable
                onPress={() => router.push("/products")}
                accessibilityRole="button"
                hitSlop={10}
              >
                <Typography variant="bodyBold" color={theme.colors.primaryLight}>
                  Ver todos
                </Typography>
              </Pressable>
            </View>
          </View>

          {loadingProducts && (
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
          )}
          {!loadingProducts && !filteredProducts?.length && (
            <View
              style={{
                flex: 1,
                justifyContent: "center",
                alignItems: "center",
                gap: spacing.lg,
              }}
            >
              <EmptyState
                icon={
                  <Image
                    source={productsEmpty}
                    resizeMode="contain"
                    style={{ width: 118, height: 118 }}
                  />
                }
                title="Nenhum produto cadastrado"
                description="Cadastre produtos antes de registrar uma venda"
                style={{ flex: 0, padding: spacing.md, marginTop: spacing.md }}
              />
              <Button
                title="Cadastrar produto"
                onPress={() => setShowCreateProduct(true)}
                icon={
                  <Ionicons
                    name="add-circle"
                    size={18}
                    color={theme.colors.textOnPrimary}
                  />
                }
              />
            </View>
          )}
          {!loadingProducts && !!filteredProducts?.length && (
            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={{
                paddingHorizontal: spacing.xl,
                paddingBottom: cart.length > 0 ? FIXED_ACTION_SCROLL_PADDING : spacing.lg,
              }}
              showsVerticalScrollIndicator={false}
            >
              <View
                style={{
                  flexDirection: "row",
                  flexWrap: "wrap",
                  justifyContent: "space-between",
                  rowGap: spacing.md,
                }}
              >
                {productGridItems.map((item, index) => {
                  if (!item) {
                    return (
                      <View key={`product-spacer-${index}`} style={{ width: "48%" }} />
                    );
                  }
                  const qty = getCartQuantity(item.id);
                  const cartItem = getCartItem(item.id);
                  return (
                    <Pressable
                      key={item.id}
                      onPress={() => addToCart(item)}
                      onLongPress={() => removeFromCart(item.id)}
                      style={{
                        width: "48%",
                        maxWidth: "48%",
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
                          <Typography variant="h3" color={theme.colors.textOnPrimary}>
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
                          backgroundColor: theme.colors.primary,
                          borderRadius: radii.full,
                          width: 28,
                          height: 28,
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Ionicons
                          name="add"
                          size={18}
                          color={theme.colors.textOnPrimary}
                        />
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
                      {qty > 0 && (
                        <View
                          style={{
                            position: "absolute",
                            top: spacing.sm,
                            right: 44,
                            backgroundColor: theme.colors.primary,
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
                            color={theme.colors.textOnPrimary}
                            style={{ fontWeight: "700" }}
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
                          <Ionicons name="remove" size={16} color={theme.colors.text} />
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
                  backgroundColor: "rgba(196, 112, 126, 0.16)",
                  borderWidth: 1,
                  borderColor: "rgba(196, 112, 126, 0.35)",
                }}
              >
                <View
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: radii.full,
                    backgroundColor: "rgba(196, 112, 126, 0.2)",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Ionicons
                    name="sparkles-outline"
                    size={20}
                    color={theme.colors.primaryLight}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Typography variant="bodyBold">Dica rápida</Typography>
                  <Typography variant="caption">
                    Toque em um produto para adicioná-lo à venda ou use o buscador para
                    encontrar mais rápido.
                  </Typography>
                </View>
              </View>
            </ScrollView>
          )}
        </View>
      )}

      {/* Step 2: Select Client */}
      {step === 2 && (
        <View style={{ flex: 1, paddingHorizontal: spacing.xl, gap: spacing.lg }}>
          <Pressable
            onPress={() => {
              setSelectedClient(null);
              setStep(3);
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
              backgroundColor: theme.colors.primary,
              opacity: pressed ? 0.86 : 1,
              shadowColor: theme.colors.primary,
              shadowOffset: { width: 0, height: 10 },
              shadowOpacity: 0.22,
              shadowRadius: 18,
              elevation: 4,
            })}
          >
            <Ionicons
              name="person-outline"
              size={32}
              color={theme.colors.textOnPrimary}
            />
            <View style={{ flex: 1, minWidth: 0 }}>
              <Typography
                variant="bodyBold"
                color={theme.colors.textOnPrimary}
                numberOfLines={1}
              >
                Sem cliente (avulso)
              </Typography>
              <Typography
                variant="body"
                color={theme.colors.textOnPrimary}
                style={{ opacity: 0.72 }}
                numberOfLines={1}
              >
                Continuar sem selecionar um cliente
              </Typography>
            </View>
            <Ionicons
              name="chevron-forward"
              size={24}
              color={theme.colors.textOnPrimary}
            />
          </Pressable>

          <SearchBox
            placeholder="Buscar cliente..."
            value={clientSearch}
            onChangeText={setClientSearch}
            trailingIcon="filter-outline"
            onTrailingPress={() => setShowClientFilter(true)}
          />
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
              <Ionicons
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
              <Typography variant="bodyBold" color={theme.colors.primaryLight}>
                Ver todos
              </Typography>
            </Pressable>
          </View>

          {loadingClients ? (
            <ActivityIndicator size="small" color={theme.colors.primary} />
          ) : (
            <FlatList
              data={filteredClients}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{
                gap: spacing.sm,
                paddingBottom: FIXED_ACTION_SCROLL_PADDING,
              }}
              renderItem={({ item }: { item: Client }) => (
                <Pressable
                  onPress={() => {
                    setSelectedClient({ id: item.id, name: item.name });
                    setStep(3);
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
                      ...getSurfaceStyle(theme),
                    },
                  ]}
                >
                  <View
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: radii.full,
                      backgroundColor: theme.colors.primary,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Typography variant="bodyBold" color={theme.colors.textOnPrimary}>
                      {item.name.charAt(0).toUpperCase()}
                    </Typography>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Typography variant="bodyBold">{item.name}</Typography>
                    {item.phone && (
                      <Typography variant="caption">{item.phone}</Typography>
                    )}
                  </View>
                  <Ionicons
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
          )}
        </View>
      )}

      {/* Step 3: Payment Method */}
      {step === 3 && (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            paddingHorizontal: spacing.xl,
            gap: spacing.sm,
            paddingBottom: FIXED_ACTION_SCROLL_PADDING,
          }}
        >
          {PAYMENT_OPTIONS.map((option) => {
            const isSelected = paymentMethod === option.value;
            let cardBackgroundColor = theme.colors.surfaceElevated;
            if (theme.mode === "dark") {
              cardBackgroundColor = "rgba(44, 36, 32, 0.84)";
            }
            if (isSelected) {
              cardBackgroundColor = "rgba(196, 112, 126, 0.18)";
            }
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
                  borderWidth: isSelected ? 2 : 1,
                  borderColor: isSelected ? theme.colors.primary : theme.colors.surface,
                  ...getSurfaceStyle(theme),
                  backgroundColor: cardBackgroundColor,
                }}
              >
                <View
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: radii.lg,
                    backgroundColor: isSelected
                      ? theme.colors.primary
                      : "rgba(196, 112, 126, 0.28)",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Ionicons
                    name={option.icon as keyof typeof Ionicons.glyphMap}
                    size={24}
                    color={theme.colors.textOnPrimary}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Typography variant="bodyBold">{option.label}</Typography>
                  <Typography variant="caption">{subtitles[option.value]}</Typography>
                </View>
                <Ionicons
                  name={isSelected ? "checkmark-circle" : "chevron-forward"}
                  size={24}
                  color={theme.colors.primaryLight}
                />
              </Pressable>
            );
          })}
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
                backgroundColor: "rgba(196, 112, 126, 0.18)",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons
                name="information-circle-outline"
                size={22}
                color={theme.colors.primaryLight}
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
            paddingHorizontal: spacing.xl,
            gap: spacing.lg,
            paddingBottom: FIXED_ACTION_SCROLL_PADDING,
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
                style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}
              >
                <View
                  style={{
                    width: 46,
                    height: 46,
                    borderRadius: radii.full,
                    backgroundColor: "rgba(196, 112, 126, 0.18)",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Ionicons
                    name="bag-check-outline"
                    size={24}
                    color={theme.colors.primaryLight}
                  />
                </View>
                <Typography variant="h3">Itens da venda</Typography>
              </View>
              <Pressable
                onPress={() => setStep(1)}
                accessibilityRole="button"
                style={{
                  minHeight: 34,
                  borderRadius: radii.full,
                  paddingHorizontal: spacing.md,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: spacing.xs,
                  backgroundColor: "rgba(196, 112, 126, 0.12)",
                  borderWidth: 1,
                  borderColor: "rgba(196, 112, 126, 0.28)",
                }}
              >
                <Ionicons
                  name="pencil-outline"
                  size={15}
                  color={theme.colors.primaryLight}
                />
                <Typography variant="caption" color={theme.colors.primaryLight}>
                  Editar itens
                </Typography>
              </Pressable>
            </View>
            {cart.map((item) => {
              const photoUrl = getCartItemPhotoUrl(item);
              return (
                <View
                  key={item.productId}
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    paddingVertical: spacing.md,
                    borderBottomWidth: 1,
                    borderBottomColor:
                      theme.mode === "dark"
                        ? "rgba(245, 225, 219, 0.08)"
                        : theme.colors.surface,
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
                        backgroundColor: "rgba(196, 112, 126, 0.18)",
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
                        <Typography variant="h3" color={theme.colors.primaryLight}>
                          {item.productName.charAt(0).toUpperCase()}
                        </Typography>
                      )}
                    </View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="bodyBold" numberOfLines={2}>
                        {item.productName}
                      </Typography>
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
              <View
                style={{ flexDirection: "row", gap: spacing.md, alignItems: "center" }}
              >
                <Typography variant="body">Subtotal</Typography>
                <Typography variant="moneyLg">{formatCurrency(cartTotal)}</Typography>
              </View>
            </View>
          </Card>

          <Card style={getSurfaceStyle(theme)}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}>
              <View
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: radii.full,
                  backgroundColor: "rgba(196, 112, 126, 0.18)",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons
                  name="person-outline"
                  size={27}
                  color={theme.colors.primaryLight}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Typography variant="body">Cliente</Typography>
                <Typography variant="body">Pagamento</Typography>
              </View>
              <View style={{ alignItems: "flex-end" }}>
                <Typography variant="bodyBold">
                  {selectedClient?.name ?? "Cliente avulso"}
                </Typography>
                <Typography variant="bodyBold">
                  {PAYMENT_OPTIONS.find((o) => o.value === paymentMethod)?.label ?? "-"}
                </Typography>
              </View>
              <Ionicons
                name="chevron-forward"
                size={24}
                color={theme.colors.primaryLight}
              />
            </View>
          </Card>

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
                style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}
              >
                <View
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: radii.full,
                    backgroundColor: "rgba(196, 112, 126, 0.18)",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Ionicons
                    name="pricetag-outline"
                    size={27}
                    color={theme.colors.primaryLight}
                  />
                </View>
                <Typography variant="h3">Total da venda</Typography>
              </View>
              <Typography variant="moneyLg" style={{ flexShrink: 0 }}>
                {formatCurrency(cartTotal)}
              </Typography>
            </View>
          </Card>

          <Button
            title="Registrar venda"
            size="lg"
            style={{ borderRadius: radii.xl }}
            onPress={() => {
              void handleSubmit();
            }}
            loading={createSale.isPending}
            icon={
              <Ionicons
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
            <Ionicons
              name="lock-closed-outline"
              size={18}
              color={theme.colors.textSecondary}
            />
            <Typography variant="body">Venda segura e protegida</Typography>
          </View>
        </ScrollView>
      )}

      {step === 1 && cart.length > 0 && (
        <View
          style={{
            position: "absolute",
            left: spacing.xl,
            right: spacing.xl,
            bottom: FIXED_ACTION_BOTTOM_OFFSET,
            minHeight: 78,
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
            onPress={() => setStep(2)}
            style={{ borderRadius: radii.xl, minWidth: 138 }}
            icon={
              <Ionicons
                name="arrow-forward"
                size={16}
                color={theme.colors.textOnPrimary}
              />
            }
          />
        </View>
      )}

      {/* Navigation Buttons (steps 2 & 3) */}
      {step > 1 && step < 4 && (
        <View
          style={{
            position: "absolute",
            left: spacing.xl,
            right: spacing.xl,
            bottom: FIXED_ACTION_BOTTOM_OFFSET,
            minHeight: 78,
            flexDirection: "row",
            alignItems: "center",
            padding: spacing.md,
            borderRadius: radii.xl,
            gap: spacing.md,
            ...getSurfaceStyle(theme),
          }}
        >
          <Button
            title="Voltar"
            variant="secondary"
            style={{ flex: 1, borderRadius: radii.xl }}
            onPress={() => setStep((s) => (s - 1) as Step)}
            icon={<Ionicons name="arrow-back" size={16} color={theme.colors.text} />}
          />
          <Button
            title="Próximo"
            style={{ flex: 1, borderRadius: radii.xl }}
            disabled={!canAdvance()}
            onPress={() => setStep((s) => (s + 1) as Step)}
            icon={
              <Ionicons
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
          setProductSearch(scanned);
        }}
        onManual={() => {
          setShowScanner(false);
          setShowBarcodeSearch(true);
        }}
      />
      <Modal
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
              backgroundColor: "rgba(0, 0, 0, 0.45)",
              justifyContent: "flex-end",
            }}
          >
            <Pressable
              onPress={(event) => event.stopPropagation()}
              style={{
                backgroundColor: theme.colors.surface,
                borderTopLeftRadius: radii["2xl"],
                borderTopRightRadius: radii["2xl"],
                padding: spacing.xl,
                paddingBottom: Math.max(insets.bottom + spacing["3xl"], spacing["5xl"]),
                gap: spacing.lg,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Typography variant="h2">Buscar por código</Typography>
                <Pressable onPress={() => setShowBarcodeSearch(false)} hitSlop={12}>
                  <Ionicons
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
                placeholder="Ex: 789..."
                value={barcodeInput}
                onChangeText={setBarcodeInput}
                keyboardType="number-pad"
                autoFocus
              />
              <Button
                title="Buscar produto"
                size="lg"
                style={{ borderRadius: radii.xl }}
                icon={
                  <Ionicons
                    name="search-outline"
                    size={18}
                    color={theme.colors.textOnPrimary}
                  />
                }
                onPress={handleBarcodeSearch}
              />
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>
      <Modal
        visible={showCreateProduct}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowCreateProduct(false)}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
          <ModalHeader title="Novo produto" onClose={() => setShowCreateProduct(false)} />
          <CreateProductForm onSuccess={() => setShowCreateProduct(false)} />
        </SafeAreaView>
      </Modal>
      <Modal
        visible={showClientFilter}
        animationType="slide"
        transparent
        onRequestClose={() => setShowClientFilter(false)}
      >
        <Pressable
          onPress={() => setShowClientFilter(false)}
          style={{
            flex: 1,
            backgroundColor: "rgba(0, 0, 0, 0.45)",
            justifyContent: "flex-end",
          }}
        >
          <Pressable
            onPress={(event) => event.stopPropagation()}
            style={{
              backgroundColor: theme.colors.surface,
              borderTopLeftRadius: radii["2xl"],
              borderTopRightRadius: radii["2xl"],
              padding: spacing.xl,
              paddingBottom: Math.max(insets.bottom + spacing["3xl"], spacing["5xl"]),
              gap: spacing.md,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Typography variant="h2">Filtrar clientes</Typography>
              <Pressable onPress={() => setShowClientFilter(false)} hitSlop={12}>
                <Ionicons
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
                  <Ionicons
                    name={selected ? "radio-button-on" : "radio-button-off"}
                    size={22}
                    color={
                      selected ? theme.colors.primaryLight : theme.colors.textSecondary
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
              style={{ borderRadius: radii.xl }}
              onPress={() => {
                setClientFilter("all");
                setClientSearch("");
                setShowClientFilter(false);
              }}
            />
          </Pressable>
        </Pressable>
      </Modal>

      {/* Peso (kg) para produtos vendidos por quilo */}
      <Modal
        visible={weightProduct !== null}
        animationType="fade"
        transparent
        onRequestClose={() => setWeightProduct(null)}
      >
        <Pressable
          onPress={() => setWeightProduct(null)}
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.4)",
            justifyContent: "center",
            padding: spacing.xl,
          }}
        >
          <Pressable
            onPress={(e) => e.stopPropagation()}
            style={{
              backgroundColor: theme.colors.background,
              borderRadius: radii.xl,
              padding: spacing.xl,
              gap: spacing.lg,
            }}
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
      </Modal>
    </SafeAreaView>
  );
}
