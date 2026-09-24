import { ValidationField } from "@lucro-caseiro/ui";
import { useFormValidation } from "../shared/hooks/use-form-validation";
import type {
  PaymentMethod,
  Product,
  ProductVariation,
  RetailDocument,
  RetailDocumentKind,
} from "@lucro-caseiro/contracts";
import {
  Button,
  Card,
  Input,
  Typography,
  radii,
  spacing,
  useTheme,
} from "@lucro-caseiro/ui";
import { Stack } from "expo-router";
import React, { useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useClients } from "../features/clients/hooks";
import { CreateProductForm } from "../features/products/components/create-product-form";
import { useAllProducts, useProductCodeLookup } from "../features/products/hooks";
import {
  useBatchLabels,
  useBusinessAccounts,
  useBulkPriceUpdate,
  useCashMovement,
  useCashSession,
  useCloseCashSession,
  useCreateBusinessAccount,
  useCreatePromotion,
  useCreatePurchaseOrder,
  useCreateRetailDocument,
  useFinalizeInventory,
  useOpenCashSession,
  usePromotions,
  useReplenishment,
  useRetailCheckout,
  useRetailCheckoutQuote,
  useRetailDocuments,
  useUpdateRetailDocument,
} from "../features/retail/hooks";
import { FeatureRouteGuard } from "../shared/components/feature-route-guard";
import { ScreenHeader } from "../shared/components/screen-header";
import { StandardModal } from "../shared/components/standard-modal";
import {
  ChoiceField,
  FormField,
  TextField,
  fieldMetrics,
  useFieldPalette,
  type ChoiceOption,
} from "../shared/components/form-field";
import { FormActions, FormBody, FormGrid } from "../shared/components/form-layout";
import { FormSection } from "../shared/components/form-section";
import { showAlert } from "../shared/components/alert-store";
import { showToast } from "../shared/components/toast";
import { alertError, alertValidation } from "../shared/utils/alerts";
import { exportHtmlPdf } from "../shared/utils/export-html";
import { BarcodeScanner } from "../shared/components/barcode-scanner";
import {
  desktopStretch,
  desktopWidths,
  pageGutter,
} from "../shared/layout/desktop-density";
import { AppIcon, type AppIconName } from "../shared/components/app-icon";
import {
  DesktopGrid,
  DesktopSplit,
  desktopPageContent,
} from "../shared/layout/desktop-page";
import { useDesktopLayout } from "../shared/layout/use-desktop-layout";

type OperationMode =
  | "checkout"
  | "school_list"
  | "inventory_count"
  | "service_order"
  | "promotion"
  | "prices"
  | "labels"
  | "business_account";

const DOCUMENT_KINDS: Array<{ kind: RetailDocumentKind; label: string }> = [
  { kind: "school_list", label: "Listas escolares" },
  { kind: "inventory_count", label: "Inventários" },
  { kind: "purchase_order", label: "Pedidos de compra" },
  { kind: "service_order", label: "Ordens de serviço" },
  { kind: "catalog_order", label: "Pedidos do catálogo" },
  { kind: "fiscal_document", label: "Documentos fiscais" },
];

const MODE_TITLE: Record<OperationMode, string> = {
  checkout: "Venda no PDV",
  school_list: "Nova lista escolar",
  inventory_count: "Nova contagem",
  service_order: "Nova ordem de serviço",
  promotion: "Nova promoção",
  prices: "Reajustar preços",
  labels: "Etiquetas em lote",
  business_account: "Novo convênio",
};

/** Ícone de cada atalho na grade do desktop (sempre ao lado do texto). */
const MODE_ICON: Record<OperationMode, AppIconName> = {
  checkout: "cart-outline",
  school_list: "reader-outline",
  inventory_count: "clipboard-outline",
  service_order: "create-outline",
  promotion: "gift-outline",
  prices: "trending-up-outline",
  labels: "pricetags-outline",
  business_account: "business-outline",
};

/** Ação principal do rodapé de cada operação (verbo + objeto). */
const MODE_SUBMIT: Record<OperationMode, string> = {
  checkout: "Registrar venda",
  school_list: "Criar lista",
  inventory_count: "Salvar contagem",
  service_order: "Criar ordem",
  promotion: "Ativar promoção",
  prices: "Reajustar preços",
  labels: "Gerar etiquetas",
  business_account: "Criar convênio",
};

const MODES_WITH_PRODUCTS: readonly OperationMode[] = [
  "checkout",
  "school_list",
  "inventory_count",
  "prices",
  "labels",
];

const LABEL_TEMPLATE_OPTIONS: readonly ChoiceOption<"product" | "shelf">[] = [
  { value: "product", label: "Produto", icon: "pricetag-outline" },
  { value: "shelf", label: "Gôndola", icon: "albums-outline" },
];

/** Opção em pílula (mesmo visual das categorias do cadastro de produto). */
function OptionChip({
  label,
  selected,
  onPress,
}: Readonly<{ label: string; selected: boolean; onPress: () => void }>) {
  const { theme } = useTheme();
  const pal = useFieldPalette();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={({ pressed }) => ({
        minHeight: 44,
        maxWidth: "100%",
        paddingHorizontal: spacing.lg,
        justifyContent: "center",
        borderRadius: radii.full,
        borderWidth: selected ? 2 : 1,
        borderColor: selected ? theme.colors.primaryStrong : pal.border,
        backgroundColor: selected ? theme.colors.primaryBg : pal.fieldBgFocus,
        opacity: pressed ? 0.85 : 1,
      })}
    >
      <Typography
        variant="body"
        color={selected ? theme.colors.primaryStrong : theme.colors.text}
      >
        {label}
      </Typography>
    </Pressable>
  );
}

const PAYMENT_METHODS: Array<{ id: PaymentMethod; label: string }> = [
  { id: "pix", label: "Pix" },
  { id: "cash", label: "Dinheiro" },
  { id: "card", label: "Cartão" },
  { id: "transfer", label: "Transferência" },
  { id: "credit", label: "Fiado" },
];

function numberValue(value: string): number {
  return Number(value.replace(",", "."));
}

function stockItemKey(productId: string, variationId?: string | null): string {
  return `${productId}:${variationId ?? "product"}`;
}

const NEXT_DOCUMENT_STATUS: Record<
  string,
  { label: string; status: RetailDocument["status"] }
> = {
  "catalog_order:new": { label: "Confirmar", status: "confirmed" },
  "catalog_order:confirmed": { label: "Separar", status: "separated" },
  "catalog_order:separated": { label: "Pronto", status: "ready" },
  "service_order:quoted": { label: "Produzir", status: "production" },
  "service_order:waiting_file": { label: "Produzir", status: "production" },
  "service_order:production": { label: "Pronto", status: "ready" },
  "service_order:ready": { label: "Entregar", status: "delivered" },
  "purchase_order:draft": { label: "Marcar enviado", status: "sent" },
};

export default function RetailScreen() {
  const { theme } = useTheme();
  const isDesktop = useDesktopLayout();
  const [mode, setMode] = useState<OperationMode | null>(null);
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [secondaryAmount, setSecondaryAmount] = useState("");
  const [detail, setDetail] = useState("");
  const [selectedItemKeys, setSelectedItemKeys] = useState<string[]>([]);
  const [quantities, setQuantities] = useState<Record<string, string>>({});
  const [productSearch, setProductSearch] = useState("");
  const [scannerVisible, setScannerVisible] = useState(false);
  const [createProductInitial, setCreateProductInitial] = useState<{
    name?: string;
    category?: string;
    code?: string;
    photoUrl?: string;
  }>();
  const [selectedClientId, setSelectedClientId] = useState<string>();
  const [selectedBusinessAccountId, setSelectedBusinessAccountId] = useState<string>();
  const [sourceCatalogOrderId, setSourceCatalogOrderId] = useState<string>();
  const [primaryPayment, setPrimaryPayment] = useState<PaymentMethod>("pix");
  const [secondaryPayment, setSecondaryPayment] = useState<PaymentMethod>("cash");
  const [counted, setCounted] = useState<Record<string, string>>({});

  const cash = useCashSession();
  const productsQuery = useAllProducts();
  const productCodeLookup = useProductCodeLookup();
  const clientsQuery = useClients();
  const replenishment = useReplenishment();
  const promotions = usePromotions();
  const businessAccounts = useBusinessAccounts();
  const schoolLists = useRetailDocuments("school_list");
  const inventories = useRetailDocuments("inventory_count");
  const purchaseOrders = useRetailDocuments("purchase_order");
  const serviceOrders = useRetailDocuments("service_order");
  const catalogOrders = useRetailDocuments("catalog_order");
  const fiscalDocuments = useRetailDocuments("fiscal_document");

  const openCash = useOpenCashSession();
  const closeCash = useCloseCashSession();
  const cashMovement = useCashMovement();
  const createDocument = useCreateRetailDocument();
  const updateDocument = useUpdateRetailDocument();
  const finalizeInventory = useFinalizeInventory();
  const checkout = useRetailCheckout();
  const checkoutQuote = useRetailCheckoutQuote();
  const createPurchaseOrder = useCreatePurchaseOrder();
  const createPromotion = useCreatePromotion();
  const bulkPrices = useBulkPriceUpdate();
  const batchLabels = useBatchLabels();
  const createBusinessAccount = useCreateBusinessAccount();

  const submitting =
    createDocument.isPending ||
    checkout.isPending ||
    checkoutQuote.isPending ||
    createPromotion.isPending ||
    bulkPrices.isPending ||
    batchLabels.isPending ||
    createBusinessAccount.isPending;
  const products = productsQuery.data ?? [];
  const clients = clientsQuery.data?.items ?? [];
  const stockItems = products.flatMap<{
    product: Product;
    variation?: ProductVariation;
  }>((product) => {
    if (!product.variations?.length) return [{ product, variation: undefined }];
    return product.variations.map((variation) => ({ product, variation }));
  });
  const normalizedSearch = productSearch.trim().toLocaleLowerCase("pt-BR");
  const visibleStockItems = normalizedSearch
    ? stockItems.filter(({ product, variation }) =>
        [product.name, product.code ?? "", variation?.name ?? ""].some((value) =>
          value.toLocaleLowerCase("pt-BR").includes(normalizedSearch),
        ),
      )
    : stockItems;
  const selectedStockItems = stockItems.filter(({ product, variation }) =>
    selectedItemKeys.includes(stockItemKey(product.id, variation?.id)),
  );
  const selectedProductIds = [
    ...new Set(selectedStockItems.map(({ product }) => product.id)),
  ];
  const selectedProducts = products.filter((product) =>
    selectedProductIds.includes(product.id),
  );
  const selectedTotal = selectedStockItems.reduce(
    (sum, { product, variation }) =>
      sum +
      product.salePrice *
        (Number(quantities[stockItemKey(product.id, variation?.id)]) || 1),
    0,
  );
  const documentGroups = [
    schoolLists.data ?? [],
    inventories.data ?? [],
    purchaseOrders.data ?? [],
    serviceOrders.data ?? [],
    catalogOrders.data ?? [],
    fiscalDocuments.data ?? [],
  ];

  function resetForm() {
    setMode(null);
    setTitle("");
    setAmount("");
    setSecondaryAmount("");
    setDetail("");
    setSelectedItemKeys([]);
    setQuantities({});
    setProductSearch("");
    setSelectedClientId(undefined);
    setSelectedBusinessAccountId(undefined);
    setSourceCatalogOrderId(undefined);
    setCounted({});
  }

  function toggleStockItem(key: string) {
    setSelectedItemKeys((current) => {
      const selected = current.includes(key);
      setQuantities((values) => ({ ...values, [key]: selected ? "" : "1" }));
      return selected ? current.filter((item) => item !== key) : [...current, key];
    });
  }

  function addScannedProduct(product: Product) {
    const variations = product.variations ?? [];
    if (variations.length > 1) {
      setProductSearch(product.code ?? product.name);
      showAlert({
        title: "Escolha a variação",
        message: `${product.name} tem mais de uma variação. Selecione a desejada na lista.`,
      });
      return;
    }

    const key = stockItemKey(product.id, variations[0]?.id);
    setSelectedItemKeys((current) =>
      current.includes(key) ? current : [...current, key],
    );
    setQuantities((current) => ({
      ...current,
      [key]: String((Number(current[key]) || 0) + 1),
    }));
    setProductSearch("");
  }

  async function handleProductCode(rawCode: string) {
    const code = rawCode.trim();
    if (!code) return;

    try {
      const result = await productCodeLookup.mutateAsync(code);
      if (result.status === "found") {
        addScannedProduct(result.product);
        return;
      }
      if (result.status === "suggestion") {
        setCreateProductInitial({
          name: result.suggestion.name,
          category: result.suggestion.category ?? undefined,
          code: result.suggestion.code,
          photoUrl: result.suggestion.photoUrl ?? undefined,
        });
        return;
      }

      showAlert({
        title: "Produto não cadastrado",
        message: "Quer cadastrar este código e continuar a operação?",
        buttons: [
          { text: "Agora não", style: "cancel" },
          {
            text: "Cadastrar produto",
            onPress: () => setCreateProductInitial({ code }),
          },
        ],
      });
    } catch (error) {
      alertError(error);
    }
  }

  async function runAction(action: () => Promise<unknown>, success: string) {
    try {
      await action();
      showToast(success);
      resetForm();
    } catch (error) {
      alertError(
        error instanceof Error ? error.message : "Não foi possível concluir a operação.",
      );
    }
  }

  // A lista de produtos mostra o erro no campo (ver `formValidation`).
  function requireProducts(): boolean {
    return selectedStockItems.length > 0;
  }

  async function submitCheckout() {
    if (!cash.data?.session || !requireProducts()) return;
    const items = selectedStockItems.map(({ product, variation }) => ({
      productId: product.id,
      ...(variation ? { variationId: variation.id } : {}),
      quantity: Number(quantities[stockItemKey(product.id, variation?.id)]) || 1,
    }));
    if (items.some((item) => !Number.isInteger(item.quantity) || item.quantity <= 0)) {
      alertValidation("Informe quantidades inteiras e positivas.");
      return;
    }
    let quote;
    try {
      quote = await checkoutQuote.mutateAsync({
        items,
        clientId: selectedClientId,
        businessAccountId: selectedBusinessAccountId,
        catalogOrderId: sourceCatalogOrderId,
      });
    } catch (error) {
      alertError(
        error instanceof Error ? error.message : "Não foi possível calcular a venda.",
      );
      return;
    }
    const second = numberValue(secondaryAmount);
    if (second > 0 && second >= quote.total) {
      alertValidation("A segunda forma deve ser menor que o total da venda.");
      return;
    }
    const payments =
      second > 0
        ? [
            {
              method: primaryPayment,
              amount: Math.round((quote.total - second) * 100) / 100,
            },
            { method: secondaryPayment, amount: second },
          ]
        : [{ method: primaryPayment, amount: quote.total }];
    await runAction(
      () =>
        checkout.mutateAsync({
          sessionId: cash.data!.session.id,
          items,
          payments,
          clientId: selectedClientId,
          businessAccountId: selectedBusinessAccountId,
          catalogOrderId: sourceCatalogOrderId,
          requestFiscalDocument: detail === "fiscal",
        }),
      `Venda de R$ ${quote.total.toFixed(2).replace(".", ",")} registrada e estoque atualizado.`,
    );
  }

  async function submitSchoolList() {
    if (!requireProducts() || !title.trim()) return;
    await runAction(
      () =>
        createDocument.mutateAsync({
          kind: "school_list",
          title: title.trim(),
          payload: { school: detail.trim(), year: new Date().getFullYear() },
          items: selectedStockItems.map(({ product, variation }) => ({
            productId: product.id,
            ...(variation ? { variationId: variation.id } : {}),
            name: product.name,
            ...(variation ? { variationName: variation.name } : {}),
            quantity: Number(quantities[stockItemKey(product.id, variation?.id)]) || 1,
            unitPrice: product.salePrice,
            metadata: { required: true, allowSubstitution: true },
          })),
        }),
      "Lista escolar criada.",
    );
  }

  async function submitInventory() {
    if (!requireProducts()) return;
    const invalid = selectedStockItems.some(({ product, variation }) => {
      const value = counted[stockItemKey(product.id, variation?.id)];
      return value === "" || !Number.isInteger(Number(value)) || Number(value) < 0;
    });
    if (invalid) {
      alertValidation("Informe a quantidade contada de todos os produtos.");
      return;
    }
    await runAction(
      () =>
        createDocument.mutateAsync({
          kind: "inventory_count",
          title: title.trim() || `Contagem ${new Date().toLocaleDateString("pt-BR")}`,
          payload: { scope: detail.trim() || "geral" },
          items: selectedStockItems.map(({ product, variation }) => ({
            productId: product.id,
            ...(variation ? { variationId: variation.id } : {}),
            name: product.name,
            ...(variation ? { variationName: variation.name } : {}),
            quantity: 1,
            unitPrice: 0,
            metadata: {
              counted: Number(counted[stockItemKey(product.id, variation?.id)]),
              reason: "Contagem física",
            },
          })),
        }),
      "Contagem salva. Revise e finalize no card do inventário.",
    );
  }

  async function submitServiceOrder() {
    const total = numberValue(amount);
    if (!title.trim() || !Number.isFinite(total) || total <= 0) {
      alertValidation("Informe serviço e valor.");
      return;
    }
    await runAction(
      () =>
        createDocument.mutateAsync({
          kind: "service_order",
          title: title.trim(),
          partyId: selectedClientId,
          amount: total,
          deposit: 0,
          dueAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          payload: { serviceType: detail.trim() || "printing" },
          items: [],
        }),
      "Ordem de serviço criada.",
    );
  }

  async function submitPromotion() {
    const value = numberValue(amount);
    if (selectedProducts.length !== 1 || !title.trim() || value <= 0 || value > 100) {
      alertValidation("Selecione um produto e informe nome e percentual entre 0 e 100.");
      return;
    }
    await runAction(
      () =>
        createPromotion.mutateAsync({
          name: title.trim(),
          type: "percentage",
          value,
          productId: selectedProducts[0].id,
          startsAt: new Date().toISOString(),
          endsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          active: true,
        }),
      "Promoção ativada.",
    );
  }

  async function submitPrices() {
    const percentage = numberValue(amount);
    if (!requireProducts() || !Number.isFinite(percentage)) return;
    await runAction(
      () => bulkPrices.mutateAsync({ productIds: selectedProductIds, percentage }),
      "Preços atualizados com auditoria.",
    );
  }

  async function submitLabels() {
    if (!requireProducts()) return;
    try {
      const result = await batchLabels.mutateAsync({
        productIds: selectedProductIds,
        template: detail === "shelf" ? "shelf" : "product",
      });
      await exportHtmlPdf(result.html, { dialogTitle: "Imprimir etiquetas" });
      resetForm();
    } catch (error) {
      alertError(
        error instanceof Error ? error.message : "Não foi possível gerar etiquetas.",
      );
    }
  }

  async function submitBusinessAccount() {
    const creditLimit = numberValue(amount);
    const client = clients.find((item) => item.id === selectedClientId);
    if (!client || !Number.isFinite(creditLimit) || creditLimit < 0) {
      alertValidation("Selecione um cliente e informe o limite.");
      return;
    }
    await runAction(
      () =>
        createBusinessAccount.mutateAsync({
          clientId: client.id,
          kind: "company",
          legalName: title.trim() || client.name,
          creditLimit,
          dueDays: 30,
          discountPercent: numberValue(detail) || 0,
        }),
      "Convênio criado.",
    );
  }

  const formValidation = useFormValidation(
    {
      title:
        (mode === "school_list" || mode === "service_order" || mode === "promotion") &&
        !title.trim() &&
        "Informe um nome para este cadastro.",
      amount:
        (mode === "service_order" ||
          mode === "promotion" ||
          mode === "prices" ||
          mode === "business_account") &&
        !amount.trim() &&
        "Informe o valor antes de continuar.",
      products:
        !!mode &&
        MODES_WITH_PRODUCTS.includes(mode) &&
        !selectedStockItems.length &&
        "Selecione ao menos um produto.",
    },
    mode,
  );

  function submitMode() {
    if (!formValidation.validate()) return;
    const actions: Record<OperationMode, () => Promise<void>> = {
      checkout: submitCheckout,
      school_list: submitSchoolList,
      inventory_count: submitInventory,
      service_order: submitServiceOrder,
      promotion: submitPromotion,
      prices: submitPrices,
      labels: submitLabels,
      business_account: submitBusinessAccount,
    };
    if (mode) void actions[mode]();
  }

  function loadDocumentIntoCheckout(document: RetailDocument, catalogOrder: boolean) {
    const keys = document.items.flatMap((item) =>
      item.productId ? [stockItemKey(item.productId, item.variationId)] : [],
    );
    setSelectedItemKeys(keys);
    setQuantities(
      Object.fromEntries(
        document.items.flatMap((item) =>
          item.productId
            ? [[stockItemKey(item.productId, item.variationId), String(item.quantity)]]
            : [],
        ),
      ),
    );
    setSourceCatalogOrderId(catalogOrder ? document.id : undefined);
    setMode("checkout");
  }

  function renderDocumentAction(document: RetailDocument) {
    if (document.kind === "inventory_count" && document.status === "counting") {
      return (
        <Button
          size="sm"
          title="Finalizar"
          variant="outline"
          onPress={() =>
            void runAction(
              () => finalizeInventory.mutateAsync(document.id),
              "Inventário finalizado.",
            )
          }
        />
      );
    }
    if (document.kind === "school_list" && document.status === "active") {
      return (
        <Button
          size="sm"
          title="Vender kit"
          variant="outline"
          onPress={() => loadDocumentIntoCheckout(document, false)}
        />
      );
    }
    if (document.kind === "catalog_order" && document.status === "ready") {
      return (
        <Button
          size="sm"
          title="Receber"
          variant="outline"
          onPress={() => loadDocumentIntoCheckout(document, true)}
        />
      );
    }
    const action = NEXT_DOCUMENT_STATUS[`${document.kind}:${document.status}`];
    if (!action) return null;
    return (
      <Button
        size="sm"
        title={action.label}
        variant="outline"
        onPress={() =>
          void runAction(
            () =>
              updateDocument.mutateAsync({
                id: document.id,
                data: { status: action.status },
              }),
            "Status atualizado.",
          )
        }
      />
    );
  }

  function renderProductPicker() {
    return (
      <FormSection collapsible={false} title="Produtos">
        <FormField label="Buscar por nome ou código">
          <TextField
            icon="search-outline"
            placeholder="Ex: Caderno 10 matérias"
            accessibilityLabel="Buscar produto por nome ou código"
            value={productSearch}
            onChangeText={setProductSearch}
            right={
              <Pressable
                onPress={() => setScannerVisible(true)}
                accessibilityRole="button"
                accessibilityLabel="Escanear código de barras"
                hitSlop={6}
                style={({ pressed }) => ({
                  width: 40,
                  height: 40,
                  marginRight: -spacing.sm,
                  borderRadius: radii.sm,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: pressed ? theme.colors.primaryBg : "transparent",
                })}
              >
                <AppIcon
                  name="scan-outline"
                  size={fieldMetrics.iconSize}
                  color={theme.colors.primaryStrong}
                />
              </Pressable>
            }
          />
        </FormField>
        <ValidationField {...formValidation.field("products")}>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
            {visibleStockItems.map(({ product, variation }) => {
              const key = stockItemKey(product.id, variation?.id);
              return (
                <OptionChip
                  key={key}
                  label={variation ? `${product.name} — ${variation.name}` : product.name}
                  selected={selectedItemKeys.includes(key)}
                  onPress={() => toggleStockItem(key)}
                />
              );
            })}
          </View>
        </ValidationField>
      </FormSection>
    );
  }

  function renderClientPicker(extra?: React.ReactNode) {
    return (
      <FormSection collapsible={false} title="Cliente">
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
          {clients.map((client) => (
            <OptionChip
              key={client.id}
              label={client.name}
              selected={selectedClientId === client.id}
              onPress={() => {
                setSelectedClientId(client.id);
                setSelectedBusinessAccountId(undefined);
              }}
            />
          ))}
        </View>
        {extra}
      </FormSection>
    );
  }

  function renderQuantityInputs() {
    if (!selectedStockItems.length) return null;
    return (
      <FormSection collapsible={false} title="Quantidades">
        <FormGrid>
          {selectedStockItems.map(({ product, variation }) => {
            const key = stockItemKey(product.id, variation?.id);
            const name = variation ? `${product.name} — ${variation.name}` : product.name;
            return (
              <FormField key={key} label={name}>
                <TextField
                  accessibilityLabel={`Quantidade — ${name}`}
                  value={quantities[key] ?? "1"}
                  onChangeText={(value) => setQuantities({ ...quantities, [key]: value })}
                  keyboardType="number-pad"
                  numericMode="integer"
                />
              </FormField>
            );
          })}
        </FormGrid>
      </FormSection>
    );
  }

  function renderBusinessAccountPicker() {
    const accounts = (businessAccounts.data ?? []).filter(
      (account) => account.clientId === selectedClientId && account.active,
    );
    if (!accounts.length) return null;
    return (
      <FormField label="Convênio" optional>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
          {accounts.map((account) => (
            <OptionChip
              key={account.id}
              label={`${account.legalName} · ${account.discountPercent}%`}
              selected={selectedBusinessAccountId === account.id}
              onPress={() =>
                setSelectedBusinessAccountId(
                  selectedBusinessAccountId === account.id ? undefined : account.id,
                )
              }
            />
          ))}
        </View>
      </FormField>
    );
  }

  function renderPaymentChips(
    value: PaymentMethod,
    onChange: (method: PaymentMethod) => void,
  ) {
    return (
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
        {PAYMENT_METHODS.map((method) => (
          <OptionChip
            key={method.id}
            label={method.label}
            selected={value === method.id}
            onPress={() => onChange(method.id)}
          />
        ))}
      </View>
    );
  }

  function renderModeForm() {
    if (!mode) return null;
    if (mode === "checkout") {
      return (
        <FormBody>
          {renderProductPicker()}
          {renderQuantityInputs()}
          {renderClientPicker(renderBusinessAccountPicker())}
          <FormSection
            collapsible={false}
            title="Pagamento"
            subtitle="Promoções e desconto do convênio são calculados antes de registrar o pagamento."
          >
            <Typography variant="h3">
              Subtotal: R$ {selectedTotal.toFixed(2).replace(".", ",")}
            </Typography>
            <FormField label="Forma de pagamento">
              {renderPaymentChips(primaryPayment, setPrimaryPayment)}
            </FormField>
            <FormGrid>
              <FormField label="Valor na segunda forma" optional>
                <TextField
                  prefix="R$"
                  placeholder="0,00"
                  accessibilityLabel="Valor na segunda forma de pagamento"
                  value={secondaryAmount}
                  onChangeText={setSecondaryAmount}
                  keyboardType="numeric"
                  numericMode="decimal"
                />
              </FormField>
            </FormGrid>
            {secondaryAmount ? (
              <FormField label="Segunda forma">
                {renderPaymentChips(secondaryPayment, setSecondaryPayment)}
              </FormField>
            ) : null}
            <FormField label="Nota fiscal" optional>
              <View style={{ flexDirection: "row" }}>
                <OptionChip
                  label="Solicitar NFC-e"
                  selected={detail === "fiscal"}
                  onPress={() => setDetail(detail === "fiscal" ? "" : "fiscal")}
                />
              </View>
            </FormField>
          </FormSection>
        </FormBody>
      );
    }
    if (mode === "inventory_count") {
      return (
        <FormBody>
          <FormGrid>
            <FormField label="Nome da contagem" optional span="full">
              <TextField
                placeholder={`Contagem ${new Date().toLocaleDateString("pt-BR")}`}
                accessibilityLabel="Nome da contagem"
                value={title}
                onChangeText={setTitle}
              />
            </FormField>
          </FormGrid>
          {renderProductPicker()}
          {selectedStockItems.length ? (
            <FormSection collapsible={false} title="Quantidade contada">
              <FormGrid>
                {selectedStockItems.map(({ product, variation }) => {
                  const key = stockItemKey(product.id, variation?.id);
                  const name = variation
                    ? `${product.name} — ${variation.name}`
                    : product.name;
                  return (
                    <FormField key={key} label={name}>
                      <TextField
                        placeholder="Ex: 12"
                        accessibilityLabel={`Contado — ${name}`}
                        value={counted[key] ?? ""}
                        onChangeText={(value) => setCounted({ ...counted, [key]: value })}
                        keyboardType="number-pad"
                        numericMode="integer"
                      />
                    </FormField>
                  );
                })}
              </FormGrid>
            </FormSection>
          ) : null}
        </FormBody>
      );
    }
    if (mode === "school_list") {
      return (
        <FormBody>
          <FormGrid>
            <FormField label="Nome da lista" validation={formValidation.field("title")}>
              <TextField
                placeholder="Ex: Lista 5º ano"
                accessibilityLabel="Nome da lista"
                value={title}
                onChangeText={setTitle}
              />
            </FormField>
            <FormField label="Escola e série" optional>
              <TextField
                placeholder="Ex: Escola Central, 5º ano"
                accessibilityLabel="Escola e série"
                value={detail}
                onChangeText={setDetail}
              />
            </FormField>
          </FormGrid>
          {renderProductPicker()}
          {renderQuantityInputs()}
        </FormBody>
      );
    }
    if (mode === "service_order") {
      return (
        <FormBody>
          <FormGrid>
            <FormField label="Serviço" validation={formValidation.field("title")}>
              <TextField
                placeholder="Ex: Impressão de banner"
                accessibilityLabel="Serviço"
                value={title}
                onChangeText={setTitle}
              />
            </FormField>
            <FormField label="Valor" validation={formValidation.field("amount")}>
              <TextField
                prefix="R$"
                placeholder="0,00"
                accessibilityLabel="Valor, em reais"
                value={amount}
                onChangeText={setAmount}
                keyboardType="numeric"
                numericMode="decimal"
              />
            </FormField>
            <FormField label="Especificações" optional span="full">
              <TextField
                placeholder="Ex: 1 x 0,5 m, lona fosca"
                accessibilityLabel="Especificações"
                value={detail}
                onChangeText={setDetail}
              />
            </FormField>
          </FormGrid>
          {renderClientPicker()}
        </FormBody>
      );
    }
    if (mode === "promotion") {
      return (
        <FormBody>
          <FormGrid>
            <FormField
              label="Nome da promoção"
              validation={formValidation.field("title")}
            >
              <TextField
                placeholder="Ex: Volta às aulas"
                accessibilityLabel="Nome da promoção"
                value={title}
                onChangeText={setTitle}
              />
            </FormField>
            <FormField label="Desconto" validation={formValidation.field("amount")}>
              <TextField
                suffix="%"
                placeholder="10"
                accessibilityLabel="Desconto, em porcentagem"
                value={amount}
                onChangeText={setAmount}
                keyboardType="numeric"
                numericMode="decimal"
              />
            </FormField>
          </FormGrid>
          {renderProductPicker()}
        </FormBody>
      );
    }
    if (mode === "prices") {
      return (
        <FormBody>
          <FormGrid>
            <FormField
              label="Reajuste"
              hint="Use um número negativo para baixar os preços."
              validation={formValidation.field("amount")}
            >
              <TextField
                suffix="%"
                placeholder="5"
                accessibilityLabel="Reajuste, em porcentagem"
                value={amount}
                onChangeText={setAmount}
                keyboardType="numeric"
                numericMode="signed-decimal"
              />
            </FormField>
          </FormGrid>
          {renderProductPicker()}
        </FormBody>
      );
    }
    if (mode === "labels") {
      return (
        <FormBody>
          {renderProductPicker()}
          <FormField label="Tipo de etiqueta">
            <ChoiceField
              accessibilityLabel="Tipo de etiqueta"
              value={detail === "shelf" ? "shelf" : "product"}
              options={LABEL_TEMPLATE_OPTIONS}
              onChange={setDetail}
            />
          </FormField>
        </FormBody>
      );
    }
    return (
      <FormBody>
        <FormGrid>
          <FormField
            label="Razão social"
            optional
            span="full"
            hint="Sem razão social, usa o nome do cliente."
          >
            <TextField
              placeholder="Ex: Escola Central Ltda."
              accessibilityLabel="Razão social"
              value={title}
              onChangeText={setTitle}
            />
          </FormField>
          <FormField
            label="Limite de crédito"
            validation={formValidation.field("amount")}
          >
            <TextField
              prefix="R$"
              placeholder="0,00"
              accessibilityLabel="Limite de crédito, em reais"
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
              numericMode="decimal"
            />
          </FormField>
          <FormField label="Desconto padrão" optional>
            <TextField
              suffix="%"
              placeholder="0"
              accessibilityLabel="Desconto padrão, em porcentagem"
              value={detail}
              onChangeText={setDetail}
              keyboardType="numeric"
              numericMode="decimal"
            />
          </FormField>
        </FormGrid>
        {renderClientPicker()}
      </FormBody>
    );
  }

  const desktopCardPadding = isDesktop ? { padding: spacing["2xl"] } : null;
  const moneyPrefix = (
    <Typography variant="bodyBold" color={theme.colors.textSecondary}>
      R$
    </Typography>
  );

  const cashCard = (
    <Card variant="elevated" style={{ gap: spacing.md, ...desktopCardPadding }}>
      <Typography variant={isDesktop ? "desktopCardTitle" : "h3"}>Caixa</Typography>
      {cash.data ? (
        <>
          <Typography>
            Esperado em dinheiro: R$ {cash.data.expectedCash.toFixed(2).replace(".", ",")}
          </Typography>
          <Input
            label="Valor"
            placeholder="0,00"
            icon={moneyPrefix}
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
            numericMode="decimal"
          />
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
            <Button
              title="Suprimento"
              variant="outline"
              onPress={() =>
                void runAction(
                  () =>
                    cashMovement.mutateAsync({
                      type: "supply",
                      paymentMethod: "cash",
                      amount: numberValue(amount),
                    }),
                  "Suprimento registrado.",
                )
              }
            />
            <Button
              title="Sangria"
              variant="outline"
              onPress={() =>
                void runAction(
                  () =>
                    cashMovement.mutateAsync({
                      type: "withdrawal",
                      paymentMethod: "cash",
                      amount: numberValue(amount),
                    }),
                  "Sangria registrada.",
                )
              }
            />
            <Button
              title="Fechar caixa"
              onPress={() =>
                void runAction(
                  () => closeCash.mutateAsync(numberValue(amount)),
                  "Caixa fechado.",
                )
              }
            />
          </View>
        </>
      ) : (
        <>
          <Input
            label="Fundo inicial"
            placeholder="0,00"
            icon={moneyPrefix}
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
            numericMode="decimal"
          />
          <Button
            title="Abrir caixa"
            style={{ alignSelf: isDesktop ? "flex-start" : "stretch" }}
            onPress={() =>
              void runAction(
                () => openCash.mutateAsync(numberValue(amount)),
                "Caixa aberto.",
              )
            }
          />
        </>
      )}
    </Card>
  );

  const modeList: OperationMode[] = [
    "checkout",
    "school_list",
    "inventory_count",
    "service_order",
    "promotion",
    "prices",
    "labels",
    "business_account",
  ];
  const desktopModeButtons = (
    <DesktopGrid minColumnWidth={180} maxColumns={3} gap={spacing.md}>
      {modeList.map((item) => (
        <Pressable
          key={item}
          onPress={() => setMode(item)}
          accessibilityRole="button"
          style={({ pressed, hovered }: { pressed: boolean; hovered?: boolean }) => ({
            minHeight: 64,
            paddingHorizontal: spacing.lg,
            paddingVertical: spacing.md,
            borderRadius: radii.lg,
            borderWidth: 1,
            borderColor: hovered ? theme.colors.textSecondary : theme.colors.border,
            backgroundColor: theme.colors.surfaceElevated,
            flexDirection: "row",
            alignItems: "center",
            gap: spacing.md,
            opacity: pressed ? 0.8 : 1,
          })}
        >
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: radii.md,
              backgroundColor: theme.colors.primaryBg,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <AppIcon
              name={MODE_ICON[item]}
              size={22}
              color={theme.colors.primaryStrong}
            />
          </View>
          <Typography variant="desktopBodyStrong" style={{ flex: 1, minWidth: 0 }}>
            {MODE_TITLE[item]}
          </Typography>
        </Pressable>
      ))}
    </DesktopGrid>
  );

  const modeButtons = (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
      {(
        [
          "checkout",
          "school_list",
          "inventory_count",
          "service_order",
          "promotion",
          "prices",
          "labels",
          "business_account",
        ] as OperationMode[]
      ).map((item) => (
        <Pressable
          key={item}
          onPress={() => setMode(item)}
          style={({ pressed }) => ({
            minWidth: 150,
            flexGrow: 1,
            padding: spacing.md,
            borderRadius: radii.lg,
            borderWidth: 1,
            borderColor: theme.colors.border,
            backgroundColor: theme.colors.surface,
            opacity: pressed ? 0.75 : 1,
          })}
        >
          <Typography variant="bodyBold">{MODE_TITLE[item]}</Typography>
        </Pressable>
      ))}
    </View>
  );

  const replenishmentCard = (
    <Card variant="elevated" style={{ gap: spacing.md, ...desktopCardPadding }}>
      <Typography variant={isDesktop ? "desktopCardTitle" : "h3"}>
        Reposição inteligente
      </Typography>
      <Typography>
        {replenishment.data?.length ?? 0} itens precisam de reposição.
      </Typography>
      {(replenishment.data ?? []).slice(0, 5).map((item) => (
        <Typography
          key={`${item.productId}-${item.variationId ?? "product"}`}
          variant={isDesktop ? "desktopMeta" : "caption"}
        >
          {item.productName}
          {item.variationName ? ` — ${item.variationName}` : ""}: comprar{" "}
          {item.suggestedQuantity}
        </Typography>
      ))}
      <Button
        title="Criar pedido de compra"
        variant="outline"
        disabled={!replenishment.data?.length}
        onPress={() =>
          void runAction(
            () => createPurchaseOrder.mutateAsync(undefined),
            "Pedido de compra criado.",
          )
        }
      />
    </Card>
  );

  const panelCard = (
    <Card variant="elevated" style={{ gap: spacing.md, ...desktopCardPadding }}>
      <Typography variant={isDesktop ? "desktopCardTitle" : "h3"}>
        Painel operacional
      </Typography>
      <DesktopGrid minColumnWidth={240} maxColumns={3} gap={spacing.xl}>
        {DOCUMENT_KINDS.map((group, index) => (
          <View key={group.kind} style={{ gap: spacing.xs }}>
            <Typography variant={isDesktop ? "desktopBodyStrong" : "bodyBold"}>
              {group.label} ({documentGroups[index]?.length ?? 0})
            </Typography>
            {(documentGroups[index] ?? []).slice(0, 3).map((document) => (
              <View
                key={document.id}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: spacing.sm,
                }}
              >
                <Typography style={{ flex: 1 }}>
                  {document.title} · {document.status}
                </Typography>
                {renderDocumentAction(document)}
              </View>
            ))}
          </View>
        ))}
      </DesktopGrid>
      <Typography variant={isDesktop ? "desktopMeta" : "caption"}>
        Promoções: {promotions.data?.length ?? 0} · Convênios:{" "}
        {businessAccounts.data?.length ?? 0}
      </Typography>
    </Card>
  );

  return (
    <FeatureRouteGuard feature="varejoPapelaria">
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
        <Stack.Screen options={{ headerShown: false }} />
        <ScreenHeader title="Operação da Papelaria" />
        <ScrollView
          contentContainerStyle={
            isDesktop
              ? desktopPageContent(true)
              : {
                  ...pageGutter(isDesktop, spacing.lg),
                  ...desktopStretch(isDesktop, desktopWidths.data),
                  paddingVertical: spacing.lg,
                  gap: spacing.lg,
                }
          }
        >
          {isDesktop ? (
            <DesktopSplit
              aside={
                <>
                  {cashCard}
                  {replenishmentCard}
                </>
              }
            >
              <View style={{ gap: spacing.lg }}>
                <Typography variant="desktopSection" accessibilityRole="header">
                  O que você quer fazer?
                </Typography>
                {desktopModeButtons}
              </View>
              {panelCard}
            </DesktopSplit>
          ) : (
            <>
              {cashCard}
              {modeButtons}
              {replenishmentCard}
              {panelCard}
            </>
          )}
        </ScrollView>

        <StandardModal
          visible={mode !== null}
          onClose={resetForm}
          title={mode ? MODE_TITLE[mode] : "Operação"}
          size="form"
          footer={
            <FormActions>
              <Button
                title="Cancelar"
                variant="outline"
                disabled={submitting}
                onPress={resetForm}
              />
              <Button
                title={mode ? MODE_SUBMIT[mode] : "Salvar"}
                onPress={submitMode}
                loading={submitting}
              />
            </FormActions>
          }
        >
          {renderModeForm()}
        </StandardModal>
        <BarcodeScanner
          visible={scannerVisible}
          onClose={() => setScannerVisible(false)}
          onManual={() => setScannerVisible(false)}
          onScanned={(code) => {
            setScannerVisible(false);
            void handleProductCode(code);
          }}
        />
        {createProductInitial ? (
          <CreateProductForm
            key={createProductInitial.code ?? "barcode-product"}
            initialValues={createProductInitial}
            modal={{
              visible: true,
              title: "Cadastrar produto",
              onClose: () => setCreateProductInitial(undefined),
            }}
            onSuccess={(product) => {
              setCreateProductInitial(undefined);
              void productsQuery.refetch().then(() => addScannedProduct(product));
            }}
          />
        ) : null}
      </SafeAreaView>
    </FeatureRouteGuard>
  );
}
