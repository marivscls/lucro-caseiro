import { formatCurrency } from "../../shared/utils/format";
import type { Product, Client, PaymentMethod } from "@lucro-caseiro/contracts";
import {
  Button,
  Card,
  EmptyState,
  Input,
  Typography,
  useTheme,
  spacing,
  radii,
} from "@lucro-caseiro/ui";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useClients } from "../../features/clients/hooks";
import { CreateProductForm } from "../../features/products/components/create-product-form";
import { useProducts } from "../../features/products/hooks";
import { useCreateSale } from "../../features/sales/hooks";
import { PAYMENT_LABELS } from "../../features/sales/payment";
import { useInterstitial } from "../../shared/hooks/use-interstitial";
import { useLimitCheck } from "../../shared/hooks/use-limit-check";

type Step = 1 | 2 | 3 | 4;

interface CartItem {
  productId: string;
  productName: string;
  unitPrice: number;
  quantity: number;
}

type PaymentOption = {
  value: PaymentMethod;
  label: string;
  icon: string;
};

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

export default function NewSaleScreen() {
  const { theme } = useTheme();
  const { show: showInterstitial } = useInterstitial();
  const { checkAndBlock: checkSalesLimit } = useLimitCheck("sales");
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

  const { data: productsData, isLoading: loadingProducts } = useProducts();
  const { data: clientsData, isLoading: loadingClients } = useClients({
    search: clientSearch || undefined,
  });
  const createSale = useCreateSale();

  const cartTotal = cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);

  function addToCart(product: Product) {
    setCart((prev) => {
      const existing = prev.find((i) => i.productId === product.id);
      if (existing) {
        return prev.map((i) =>
          i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i,
        );
      }
      return [
        ...prev,
        {
          productId: product.id,
          productName: product.name,
          unitPrice: product.salePrice,
          quantity: 1,
        },
      ];
    });
  }

  function removeFromCart(productId: string) {
    setCart((prev) => {
      const existing = prev.find((i) => i.productId === productId);
      if (!existing) return prev;
      if (existing.quantity <= 1) {
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

  function resetForm() {
    setStep(1);
    setCart([]);
    setSelectedClient(null);
    setPaymentMethod(null);
    setClientSearch("");
    setProductSearch("");
  }

  async function handleSubmit() {
    if (!paymentMethod || cart.length === 0) return;
    if (checkSalesLimit()) return;

    try {
      const result = await createSale.mutateAsync({
        clientId: selectedClient?.id,
        paymentMethod,
        items: cart.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
        })),
      });
      Alert.alert("Venda registrada!", `Total: ${formatCurrency(result.total)}`);
      showInterstitial();
      resetForm();
    } catch {
      Alert.alert("Erro", "Não foi possível registrar a venda. Tente novamente.");
    }
  }

  function canAdvance(): boolean {
    if (step === 1) return cart.length > 0;
    if (step === 2) return true;
    if (step === 3) return paymentMethod !== null;
    return true;
  }

  const filteredProducts = productsData?.items.filter(
    (p) => !productSearch || p.name.toLowerCase().includes(productSearch.toLowerCase()),
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      {/* Header with back arrow and title */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: spacing.xl,
          paddingTop: spacing.lg,
          gap: spacing.md,
        }}
      >
        {step > 1 && (
          <Pressable onPress={() => setStep((s) => (s - 1) as Step)}>
            <Typography variant="h3" color={theme.colors.text}>
              {"<"}
            </Typography>
          </Pressable>
        )}
        <Typography variant="h3">Nova Venda</Typography>
      </View>

      {/* Progress dots */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "center",
          gap: spacing.sm,
          paddingVertical: spacing.lg,
        }}
      >
        {Array.from({ length: TOTAL_STEPS }, (_, i) => (
          <View
            key={i}
            style={{
              width: i + 1 === step ? 24 : 8,
              height: 8,
              borderRadius: radii.full,
              backgroundColor:
                i + 1 <= step ? theme.colors.primary : theme.colors.surface,
            }}
          />
        ))}
      </View>

      {/* Step title */}
      <View style={{ paddingHorizontal: spacing.xl, paddingBottom: spacing.lg }}>
        <Typography variant="h1">{STEP_TITLES[step]}</Typography>
      </View>

      {/* Step 1: Select Products */}
      {step === 1 && (
        <View style={{ flex: 1 }}>
          <View style={{ paddingHorizontal: spacing.xl, paddingBottom: spacing.md }}>
            <Input
              placeholder="Buscar produto..."
              value={productSearch}
              onChangeText={setProductSearch}
              icon={
                <Ionicons
                  name="search-outline"
                  size={18}
                  color={theme.colors.textSecondary}
                />
              }
            />
            <Typography
              variant="caption"
              color={theme.colors.textSecondary}
              style={{ marginTop: spacing.sm }}
            >
              Toque pra adicionar. Use o − pra tirar uma unidade.
            </Typography>
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
                title="Nenhum produto cadastrado"
                description="Cadastre produtos antes de registrar uma venda"
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
            <FlatList
              data={filteredProducts}
              keyExtractor={(item) => item.id}
              numColumns={2}
              style={{ flex: 1 }}
              contentContainerStyle={{
                paddingHorizontal: spacing.xl,
                paddingBottom: spacing.md,
                gap: spacing.md,
              }}
              columnWrapperStyle={{ gap: spacing.md }}
              renderItem={({ item, index }) => {
                const qty = getCartQuantity(item.id);
                return (
                  <Pressable
                    onPress={() => addToCart(item)}
                    onLongPress={() => removeFromCart(item.id)}
                    style={{
                      flex: 1,
                      backgroundColor: theme.colors.surface,
                      borderRadius: radii.xl,
                      padding: spacing.lg,
                      alignItems: "center",
                      gap: spacing.sm,
                      borderWidth: qty > 0 ? 2 : 0,
                      borderColor: qty > 0 ? theme.colors.primary : theme.colors.surface,
                    }}
                  >
                    {/* Product initial circle */}
                    <View
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: radii.full,
                        backgroundColor: getAvatarColor(index),
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Typography variant="h3" color={theme.colors.textOnPrimary}>
                        {item.name.charAt(0).toUpperCase()}
                      </Typography>
                    </View>
                    <Typography
                      variant="caption"
                      color={theme.colors.text}
                      style={{ textAlign: "center" }}
                      numberOfLines={1}
                    >
                      {item.name}
                    </Typography>
                    <Typography variant="caption" color={theme.colors.success}>
                      {formatCurrency(item.salePrice)}
                    </Typography>
                    {qty > 0 && (
                      <View
                        style={{
                          position: "absolute",
                          top: spacing.sm,
                          right: spacing.sm,
                          backgroundColor: theme.colors.primary,
                          borderRadius: radii.full,
                          width: 24,
                          height: 24,
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Typography
                          variant="caption"
                          color={theme.colors.textOnPrimary}
                          style={{ fontWeight: "700" }}
                        >
                          {qty}
                        </Typography>
                      </View>
                    )}
                    {qty > 0 && (
                      <Pressable
                        onPress={() => removeFromCart(item.id)}
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
              }}
            />
          )}

          {/* Total bar at bottom */}
          {cart.length > 0 && (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                paddingHorizontal: spacing.xl,
                paddingVertical: spacing.lg,
                backgroundColor: theme.colors.surface,
              }}
            >
              <View>
                <Typography variant="label">TOTAL SELECIONADO</Typography>
                <Typography variant="moneyLg">{formatCurrency(cartTotal)}</Typography>
              </View>
              <Button
                title="Próximo"
                onPress={() => setStep(2)}
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
        </View>
      )}

      {/* Step 2: Select Client */}
      {step === 2 && (
        <View style={{ flex: 1, paddingHorizontal: spacing.xl, gap: spacing.md }}>
          <Button
            title="Sem cliente (avulso)"
            variant={selectedClient === null ? "primary" : "secondary"}
            onPress={() => setSelectedClient(null)}
          />

          <Input
            placeholder="Buscar cliente..."
            value={clientSearch}
            onChangeText={setClientSearch}
          />

          {loadingClients ? (
            <ActivityIndicator size="small" color={theme.colors.primary} />
          ) : (
            <FlatList
              data={clientsData?.items ?? []}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ gap: spacing.sm }}
              renderItem={({ item }: { item: Client }) => (
                <Card
                  onPress={() => setSelectedClient({ id: item.id, name: item.name })}
                  style={{
                    borderWidth: selectedClient?.id === item.id ? 2 : 0,
                    borderColor: theme.colors.primary,
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
                        width: 40,
                        height: 40,
                        borderRadius: radii.full,
                        backgroundColor: theme.colors.primaryLight,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Typography variant="bodyBold" color={theme.colors.textOnPrimary}>
                        {item.name.charAt(0).toUpperCase()}
                      </Typography>
                    </View>
                    <View>
                      <Typography variant="bodyBold">{item.name}</Typography>
                      {item.phone && (
                        <Typography variant="caption">{item.phone}</Typography>
                      )}
                    </View>
                  </View>
                </Card>
              )}
              ListEmptyComponent={
                clientSearch ? (
                  <Typography variant="caption" color={theme.colors.textSecondary}>
                    Nenhum cliente encontrado
                  </Typography>
                ) : null
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
            gap: spacing.md,
            paddingBottom: spacing.lg,
          }}
        >
          {PAYMENT_OPTIONS.map((option) => {
            const isSelected = paymentMethod === option.value;
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
                  paddingVertical: spacing.md,
                  paddingHorizontal: spacing.lg,
                  backgroundColor: theme.colors.surface,
                  borderRadius: radii.xl,
                  borderWidth: 2,
                  borderColor: isSelected ? theme.colors.primary : "transparent",
                }}
              >
                <View
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: radii.full,
                    backgroundColor: isSelected
                      ? theme.colors.primary
                      : theme.colors.background,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Ionicons
                    name={option.icon as keyof typeof Ionicons.glyphMap}
                    size={20}
                    color={isSelected ? theme.colors.textOnPrimary : theme.colors.primary}
                  />
                </View>
                <Typography variant="bodyBold" style={{ flex: 1 }}>
                  {option.label}
                </Typography>
                {isSelected && (
                  <Ionicons
                    name="checkmark-circle"
                    size={22}
                    color={theme.colors.primary}
                  />
                )}
              </Pressable>
            );
          })}
        </ScrollView>
      )}

      {/* Step 4: Review & Confirm */}
      {step === 4 && (
        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: spacing.xl,
            gap: spacing.lg,
            paddingBottom: spacing["3xl"],
          }}
        >
          <Card>
            <Typography variant="h3" style={{ marginBottom: spacing.md }}>
              Itens
            </Typography>
            {cart.map((item) => (
              <View
                key={item.productId}
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  paddingVertical: spacing.sm,
                }}
              >
                <View style={{ flex: 1 }}>
                  <Typography variant="bodyBold">{item.productName}</Typography>
                  <Typography variant="caption">
                    {item.quantity}x {formatCurrency(item.unitPrice)}
                  </Typography>
                </View>
                <Typography variant="bodyBold" color={theme.colors.success}>
                  {formatCurrency(item.unitPrice * item.quantity)}
                </Typography>
              </View>
            ))}
          </Card>

          <Card>
            <View style={{ gap: spacing.sm }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <Typography variant="caption">Cliente</Typography>
                <Typography variant="bodyBold">
                  {selectedClient?.name ?? "Cliente avulso"}
                </Typography>
              </View>
              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <Typography variant="caption">Pagamento</Typography>
                <Typography variant="bodyBold">
                  {PAYMENT_OPTIONS.find((o) => o.value === paymentMethod)?.label ?? "-"}
                </Typography>
              </View>
            </View>
          </Card>

          <Card variant="elevated">
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Typography variant="h3">Total</Typography>
              <Typography variant="moneyLg">{formatCurrency(cartTotal)}</Typography>
            </View>
          </Card>

          <Button
            title="Registrar venda"
            size="lg"
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
        </ScrollView>
      )}

      {/* Navigation Buttons (steps 2 & 3) */}
      {step > 1 && step < 4 && (
        <View
          style={{
            flexDirection: "row",
            padding: spacing.xl,
            gap: spacing.md,
            backgroundColor: theme.colors.surface,
          }}
        >
          <Button
            title="Voltar"
            variant="secondary"
            style={{ flex: 1 }}
            onPress={() => setStep((s) => (s - 1) as Step)}
            icon={<Ionicons name="arrow-back" size={16} color={theme.colors.text} />}
          />
          <Button
            title="Próximo"
            style={{ flex: 1 }}
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
      <Modal
        visible={showCreateProduct}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowCreateProduct(false)}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "flex-end",
              padding: spacing.lg,
            }}
          >
            <Pressable onPress={() => setShowCreateProduct(false)}>
              <Typography variant="bodyBold" color={theme.colors.primary}>
                Fechar
              </Typography>
            </Pressable>
          </View>
          <CreateProductForm onSuccess={() => setShowCreateProduct(false)} />
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}
