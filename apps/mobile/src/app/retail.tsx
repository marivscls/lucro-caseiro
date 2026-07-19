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
  Chip,
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
import { useProducts } from "../features/products/hooks";
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
import { showToast } from "../shared/components/toast";
import { alertError, alertValidation } from "../shared/utils/alerts";
import { exportHtmlPdf } from "../shared/utils/export-html";
import { BarcodeScanner } from "../shared/components/barcode-scanner";

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
  const [mode, setMode] = useState<OperationMode | null>(null);
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [secondaryAmount, setSecondaryAmount] = useState("");
  const [detail, setDetail] = useState("");
  const [selectedItemKeys, setSelectedItemKeys] = useState<string[]>([]);
  const [quantities, setQuantities] = useState<Record<string, string>>({});
  const [productSearch, setProductSearch] = useState("");
  const [scannerVisible, setScannerVisible] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string>();
  const [selectedBusinessAccountId, setSelectedBusinessAccountId] = useState<string>();
  const [sourceCatalogOrderId, setSourceCatalogOrderId] = useState<string>();
  const [primaryPayment, setPrimaryPayment] = useState<PaymentMethod>("pix");
  const [secondaryPayment, setSecondaryPayment] = useState<PaymentMethod>("cash");
  const [counted, setCounted] = useState<Record<string, string>>({});

  const cash = useCashSession();
  const productsQuery = useProducts({ limit: 100 });
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

  const products = productsQuery.data?.items ?? [];
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

  function requireProducts(): boolean {
    if (selectedStockItems.length) return true;
    alertValidation("Selecione ao menos um produto.");
    return false;
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

  function submitMode() {
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
      <View style={{ gap: spacing.sm }}>
        <Typography variant="label">PRODUTOS</Typography>
        <Input
          label="Buscar por nome ou código"
          value={productSearch}
          onChangeText={setProductSearch}
        />
        <Button
          title="Escanear código de barras"
          variant="outline"
          onPress={() => setScannerVisible(true)}
        />
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
          {visibleStockItems.map(({ product, variation }) => {
            const key = stockItemKey(product.id, variation?.id);
            return (
              <Chip
                key={key}
                label={variation ? `${product.name} — ${variation.name}` : product.name}
                selected={selectedItemKeys.includes(key)}
                onPress={() => toggleStockItem(key)}
              />
            );
          })}
        </View>
      </View>
    );
  }

  function renderClientPicker() {
    return (
      <View style={{ gap: spacing.sm }}>
        <Typography variant="label">CLIENTE</Typography>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
          {clients.map((client) => (
            <Chip
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
      </View>
    );
  }

  function renderQuantityInputs() {
    return selectedStockItems.map(({ product, variation }) => {
      const key = stockItemKey(product.id, variation?.id);
      const name = variation ? `${product.name} — ${variation.name}` : product.name;
      return (
        <Input
          key={key}
          label={`Quantidade — ${name}`}
          value={quantities[key] ?? "1"}
          onChangeText={(value) => setQuantities({ ...quantities, [key]: value })}
          keyboardType="number-pad"
        />
      );
    });
  }

  function renderBusinessAccountPicker() {
    const accounts = (businessAccounts.data ?? []).filter(
      (account) => account.clientId === selectedClientId && account.active,
    );
    if (!accounts.length) return null;
    return (
      <View style={{ gap: spacing.sm }}>
        <Typography variant="label">CONVÊNIO</Typography>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
          {accounts.map((account) => (
            <Chip
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
      </View>
    );
  }

  function renderModeForm() {
    if (!mode) return null;
    if (mode === "checkout") {
      return (
        <View style={{ gap: spacing.lg }}>
          {renderProductPicker()}
          {renderQuantityInputs()}
          {renderClientPicker()}
          {renderBusinessAccountPicker()}
          <Typography variant="h3">
            Subtotal: R$ {selectedTotal.toFixed(2).replace(".", ",")}
          </Typography>
          <Typography variant="caption">
            Promoções e desconto do convênio são calculados antes de registrar o
            pagamento.
          </Typography>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
            {PAYMENT_METHODS.map((method) => (
              <Chip
                key={method.id}
                label={method.label}
                selected={primaryPayment === method.id}
                onPress={() => setPrimaryPayment(method.id)}
              />
            ))}
          </View>
          <Input
            label="Valor na segunda forma (opcional)"
            value={secondaryAmount}
            onChangeText={setSecondaryAmount}
            keyboardType="numeric"
          />
          {secondaryAmount ? (
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
              {PAYMENT_METHODS.map((method) => (
                <Chip
                  key={method.id}
                  label={method.label}
                  selected={secondaryPayment === method.id}
                  onPress={() => setSecondaryPayment(method.id)}
                />
              ))}
            </View>
          ) : null}
          <Chip
            label="Solicitar NFC-e"
            selected={detail === "fiscal"}
            onPress={() => setDetail(detail === "fiscal" ? "" : "fiscal")}
          />
        </View>
      );
    }
    if (mode === "inventory_count") {
      return (
        <View style={{ gap: spacing.lg }}>
          <Input label="Nome da contagem" value={title} onChangeText={setTitle} />
          {renderProductPicker()}
          {selectedStockItems.map(({ product, variation }) => {
            const key = stockItemKey(product.id, variation?.id);
            const name = variation ? `${product.name} — ${variation.name}` : product.name;
            return (
              <Input
                key={key}
                label={`Contado — ${name}`}
                value={counted[key] ?? ""}
                onChangeText={(value) => setCounted({ ...counted, [key]: value })}
                keyboardType="number-pad"
              />
            );
          })}
        </View>
      );
    }
    if (mode === "school_list") {
      return (
        <View style={{ gap: spacing.lg }}>
          <Input label="Nome da lista" value={title} onChangeText={setTitle} />
          <Input label="Escola / série" value={detail} onChangeText={setDetail} />
          {renderProductPicker()}
          {renderQuantityInputs()}
        </View>
      );
    }
    if (mode === "service_order") {
      return (
        <View style={{ gap: spacing.lg }}>
          <Input label="Serviço" value={title} onChangeText={setTitle} />
          <Input
            label="Valor"
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
          />
          <Input label="Especificações" value={detail} onChangeText={setDetail} />
          {renderClientPicker()}
        </View>
      );
    }
    if (mode === "promotion") {
      return (
        <View style={{ gap: spacing.lg }}>
          <Input label="Nome da promoção" value={title} onChangeText={setTitle} />
          <Input
            label="Desconto (%)"
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
          />
          {renderProductPicker()}
        </View>
      );
    }
    if (mode === "prices") {
      return (
        <View style={{ gap: spacing.lg }}>
          <Input
            label="Reajuste (%)"
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
          />
          {renderProductPicker()}
        </View>
      );
    }
    if (mode === "labels") {
      return (
        <View style={{ gap: spacing.lg }}>
          {renderProductPicker()}
          <View style={{ flexDirection: "row", gap: spacing.sm }}>
            <Chip
              label="Produto"
              selected={detail !== "shelf"}
              onPress={() => setDetail("product")}
            />
            <Chip
              label="Gôndola"
              selected={detail === "shelf"}
              onPress={() => setDetail("shelf")}
            />
          </View>
        </View>
      );
    }
    return (
      <View style={{ gap: spacing.lg }}>
        <Input label="Razão social" value={title} onChangeText={setTitle} />
        <Input
          label="Limite de crédito"
          value={amount}
          onChangeText={setAmount}
          keyboardType="numeric"
        />
        <Input
          label="Desconto padrão (%)"
          value={detail}
          onChangeText={setDetail}
          keyboardType="numeric"
        />
        {renderClientPicker()}
      </View>
    );
  }

  return (
    <FeatureRouteGuard feature="varejoPapelaria">
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
        <Stack.Screen options={{ headerShown: false }} />
        <ScreenHeader title="Operação da Papelaria" />
        <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg }}>
          <Card variant="elevated" style={{ gap: spacing.md }}>
            <Typography variant="h3">Caixa</Typography>
            {cash.data ? (
              <>
                <Typography>
                  Esperado em dinheiro: R${" "}
                  {cash.data.expectedCash.toFixed(2).replace(".", ",")}
                </Typography>
                <Input
                  label="Valor"
                  value={amount}
                  onChangeText={setAmount}
                  keyboardType="numeric"
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
                  value={amount}
                  onChangeText={setAmount}
                  keyboardType="numeric"
                />
                <Button
                  title="Abrir caixa"
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

          <Card variant="elevated" style={{ gap: spacing.md }}>
            <Typography variant="h3">Reposição inteligente</Typography>
            <Typography>
              {replenishment.data?.length ?? 0} itens precisam de reposição.
            </Typography>
            {(replenishment.data ?? []).slice(0, 5).map((item) => (
              <Typography
                key={`${item.productId}-${item.variationId ?? "product"}`}
                variant="caption"
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

          <Card variant="elevated" style={{ gap: spacing.md }}>
            <Typography variant="h3">Painel operacional</Typography>
            {DOCUMENT_KINDS.map((group, index) => (
              <View key={group.kind} style={{ gap: spacing.xs }}>
                <Typography variant="bodyBold">
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
            <Typography variant="caption">
              Promoções: {promotions.data?.length ?? 0} · Convênios:{" "}
              {businessAccounts.data?.length ?? 0}
            </Typography>
          </Card>
        </ScrollView>

        <StandardModal
          visible={mode !== null}
          onClose={resetForm}
          title={mode ? MODE_TITLE[mode] : "Operação"}
          footer={
            <Button
              title="Salvar"
              onPress={submitMode}
              loading={
                createDocument.isPending || checkout.isPending || checkoutQuote.isPending
              }
              style={{ flex: 1 }}
            />
          }
        >
          {renderModeForm()}
        </StandardModal>
        <BarcodeScanner
          visible={scannerVisible}
          onClose={() => setScannerVisible(false)}
          onManual={() => setScannerVisible(false)}
          onScanned={(code) => {
            setProductSearch(code);
            setScannerVisible(false);
          }}
        />
      </SafeAreaView>
    </FeatureRouteGuard>
  );
}
