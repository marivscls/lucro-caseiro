import type {
  CreateVerticalDocument,
  PublishedVerticalDomain,
  ResaleSerial,
  VerticalDocument,
  VerticalDocumentItemInput,
} from "@lucro-caseiro/contracts";
import {
  Badge,
  Button,
  Card,
  Chip,
  EmptyState,
  Input,
  Typography,
  iconSizes,
  radii,
  spacing,
  useBrand,
  useTheme,
} from "@lucro-caseiro/ui";
import React, { useMemo, useState } from "react";
import { ActivityIndicator, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAllProducts } from "../features/products/hooks";
import {
  nextVerticalStatus,
  statusLabel,
  VERTICAL_DEFINITIONS,
  type VerticalKindDefinition,
} from "../features/verticals/definitions";
import {
  useCreateResaleSerial,
  useCreateVerticalAsset,
  useCreateVerticalDocument,
  useResaleSerials,
  useTransitionVerticalDocument,
  useUpdateResaleSerialStatus,
  useVerticalAssets,
  useVerticalDashboard,
  useVerticalDocuments,
  useVerticalMembership,
} from "../features/verticals/hooks";
import { FeatureRouteGuard } from "../shared/components/feature-route-guard";
import { AppIcon, type AppIconName } from "../shared/components/app-icon";
import { FAB } from "../shared/components/fab";
import { ScreenHeader } from "../shared/components/screen-header";
import { StandardModal } from "../shared/components/standard-modal";
import { showToast } from "../shared/components/toast";
import {
  desktopStretch,
  desktopWidths,
  pageGutter,
} from "../shared/layout/desktop-density";
import { useDesktopLayout } from "../shared/layout/use-desktop-layout";
import { alertError, alertValidation } from "../shared/utils/alerts";
import { formatCurrency } from "../shared/utils/format";

type LineDraft = {
  key: string;
  name: string;
  quantity: string;
  unitCost: string;
  unitPrice: string;
};

let nextLineKey = 0;
const freshLine = (): LineDraft => ({
  key: `operation-line-${nextLineKey++}`,
  name: "",
  quantity: "1",
  unitCost: "",
  unitPrice: "",
});

function numberValue(value: string, fallback = 0) {
  const parsed = Number(value.replace(",", "."));
  return Number.isFinite(parsed) ? parsed : fallback;
}

function publishedDomain(value: string): value is PublishedVerticalDomain {
  return value === "revenda" || value === "oficina" || value === "obra";
}

function makePayload(
  domain: PublishedVerticalDomain,
  kind: VerticalKindDefinition["kind"],
  values: {
    detail: string;
    referenceId: string;
    numberOne: string;
    numberTwo: string;
  },
): Record<string, unknown> {
  const one = numberValue(values.numberOne);
  const two = numberValue(values.numberTwo);
  const now = new Date();
  const nextWeek = new Date(now.getTime() + 7 * 86_400_000).toISOString();

  if (domain === "revenda") {
    if (kind === "import_purchase")
      return {
        currency: "BRL",
        exchangeRate: one || 1,
        freight: 0,
        insurance: 0,
        taxes: 0,
        fees: 0,
        originCountry: values.detail || undefined,
      };
    if (kind === "inventory_lot")
      return { origin: values.detail, serialTracked: false, landedCost: 0 };
    if (kind === "wholesale_table")
      return {
        minimumQuantity: one || 1,
        discountPercent: two,
        clientSegment: values.detail,
      };
    if (kind === "return_case") return { reason: values.detail, resolution: "refund" };
    return { issue: values.detail };
  }

  if (domain === "oficina") {
    if (kind === "service_order")
      return {
        assetId: values.referenceId,
        reportedIssue: values.detail,
        priority: "normal",
        approvalStatus: "pending",
        accessories: [],
        photos: [],
      };
    if (kind === "inspection")
      return {
        assetId: values.referenceId,
        checklist: [values.detail],
        damages: [],
        photos: [],
      };
    if (kind === "quote")
      return {
        serviceOrderId: values.referenceId,
        validityDays: one || 15,
        approvalStatus: "pending",
      };
    if (kind === "warranty_case")
      return { serviceOrderId: values.referenceId, issue: values.detail, covered: false };
    return { assetId: values.referenceId, intervalDays: one || 180 };
  }

  if (kind === "estimate")
    return {
      address: values.detail,
      overheadPercent: one,
      profitPercent: two,
      exclusions: [],
    };
  if (kind === "project") return { address: values.detail, baselineVersion: 1 };
  if (kind === "stage")
    return {
      projectId: values.referenceId,
      plannedStart: now.toISOString(),
      plannedEnd: nextWeek,
      dependencies: [],
      assignedTo: values.detail || undefined,
    };
  if (kind === "daily_log")
    return {
      projectId: values.referenceId,
      date: now.toISOString().slice(0, 10),
      teamCount: one,
      activities: [values.detail],
      occurrences: [],
      photos: [],
    };
  if (kind === "measurement")
    return {
      projectId: values.referenceId,
      measuredQuantity: one,
      contractedQuantity: two,
      retentionPercent: 0,
      approvalStatus: "pending",
    };
  if (kind === "change_order")
    return {
      projectId: values.referenceId,
      reason: values.detail,
      daysImpact: one,
      approvalStatus: "pending",
    };
  return {
    projectId: values.referenceId,
    pendingItems: values.detail
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean),
  };
}

function Metric({
  label,
  value,
  icon,
  desktop,
}: Readonly<{
  label: string;
  value: string;
  icon: AppIconName;
  desktop: boolean;
}>) {
  const { theme } = useTheme();

  if (!desktop) {
    return (
      <Card variant="elevated" style={{ flexGrow: 1, minWidth: 145 }}>
        <Typography variant="caption" color={theme.colors.textSecondary}>
          {label}
        </Typography>
        <Typography variant="money" style={{ marginTop: spacing.xs }}>
          {value}
        </Typography>
      </Card>
    );
  }

  return (
    <Card variant="elevated" padding="lg" style={{ flex: 1, minWidth: 220 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}>
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: radii.md,
            backgroundColor: theme.colors.primaryBg,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <AppIcon name={icon} size={iconSizes.md} color={theme.colors.primaryStrong} />
        </View>
        <View style={{ flex: 1, minWidth: 0, gap: spacing.xs }}>
          <Typography variant="caption" color={theme.colors.textSecondary}>
            {label}
          </Typography>
          <Typography variant="money" numberOfLines={1}>
            {value}
          </Typography>
        </View>
      </View>
    </Card>
  );
}

function DocumentCard({
  document,
  onTransition,
  loading,
}: Readonly<{
  document: VerticalDocument;
  onTransition: (document: VerticalDocument, status: string) => Promise<void>;
  loading: boolean;
}>) {
  const { theme } = useTheme();
  const next = nextVerticalStatus(document);
  return (
    <Card variant="elevated">
      <View style={{ flexDirection: "row", alignItems: "flex-start", gap: spacing.md }}>
        <View style={{ flex: 1, gap: spacing.xs }}>
          <Typography variant="h3">{document.title}</Typography>
          <Typography variant="caption" color={theme.colors.textSecondary}>
            {document.items.length} item(ns) · atualizado{" "}
            {new Date(document.updatedAt).toLocaleDateString("pt-BR")}
          </Typography>
        </View>
        <Badge
          label={statusLabel(document.status)}
          variant={next ? "warning" : "success"}
        />
      </View>
      <View style={{ flexDirection: "row", gap: spacing.xl, marginTop: spacing.lg }}>
        <View>
          <Typography variant="caption">Valor</Typography>
          <Typography variant="bodyBold">{formatCurrency(document.amount)}</Typography>
        </View>
        <View>
          <Typography variant="caption">Margem projetada</Typography>
          <Typography variant="bodyBold" color={theme.colors.success}>
            {formatCurrency(document.amount - document.cost)}
          </Typography>
        </View>
      </View>
      {document.progress > 0 ? (
        <View style={{ marginTop: spacing.lg, gap: spacing.xs }}>
          <Typography variant="caption">Avanço {document.progress}%</Typography>
          <View
            style={{
              height: 7,
              borderRadius: radii.full,
              backgroundColor: theme.colors.border,
            }}
          >
            <View
              style={{
                height: 7,
                width: `${document.progress}%`,
                borderRadius: radii.full,
                backgroundColor: theme.colors.primary,
              }}
            />
          </View>
        </View>
      ) : null}
      {next ? (
        <Button
          title={next.label}
          variant="secondary"
          loading={loading}
          style={{ marginTop: spacing.lg, alignSelf: "flex-start" }}
          onPress={() => void onTransition(document, next.status)}
        />
      ) : null}
    </Card>
  );
}

function LineItemCard({
  index,
  line,
  onChange,
}: Readonly<{
  index: number;
  line: LineDraft;
  onChange: (line: LineDraft) => void;
}>) {
  return (
    <Card variant="elevated">
      <Input
        label={`Item ${index + 1}`}
        value={line.name}
        onChangeText={(name) => onChange({ ...line, name })}
      />
      <View style={{ flexDirection: "row", gap: spacing.sm, marginTop: spacing.md }}>
        <Input
          label="Qtd."
          value={line.quantity}
          keyboardType="decimal-pad"
          onChangeText={(quantity) => onChange({ ...line, quantity })}
          containerStyle={{ flex: 0.7 }}
        />
        <Input
          label="Custo un."
          value={line.unitCost}
          keyboardType="decimal-pad"
          onChangeText={(unitCost) => onChange({ ...line, unitCost })}
          containerStyle={{ flex: 1 }}
        />
        <Input
          label="Preço un."
          value={line.unitPrice}
          keyboardType="decimal-pad"
          onChangeText={(unitPrice) => onChange({ ...line, unitPrice })}
          containerStyle={{ flex: 1 }}
        />
      </View>
    </Card>
  );
}

function SerialRow({
  item,
  loading,
  onStatusChange,
}: Readonly<{
  item: ResaleSerial;
  loading: boolean;
  onStatusChange: (item: ResaleSerial, status: ResaleSerial["status"]) => void;
}>) {
  const available = item.status === "available";
  const actionLabel = available ? "Reservar" : "Liberar";
  const nextStatus = available ? "reserved" : "available";
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        marginTop: spacing.md,
        gap: spacing.md,
      }}
    >
      <Typography variant="bodyBold" style={{ flex: 1 }}>
        {item.serial}
      </Typography>
      <Badge label={statusLabel(item.status)} />
      <Button
        title={actionLabel}
        size="sm"
        variant="ghost"
        loading={loading}
        onPress={() => onStatusChange(item, nextStatus)}
      />
    </View>
  );
}

export default function OperationsScreen() {
  const { theme } = useTheme();
  const brand = useBrand();
  const isDesktop = useDesktopLayout();
  const domainValue = brand.vertical.domain;
  const domain = publishedDomain(domainValue) ? domainValue : "revenda";
  const definition = VERTICAL_DEFINITIONS[domain];
  const [selectedKind, setSelectedKind] = useState(definition.kinds[0].kind);
  const kindDefinition = definition.kinds.find((item) => item.kind === selectedKind)!;
  const [createVisible, setCreateVisible] = useState(false);
  const [assetVisible, setAssetVisible] = useState(false);
  const [serialVisible, setSerialVisible] = useState(false);
  const [title, setTitle] = useState("");
  const [detail, setDetail] = useState("");
  const [referenceId, setReferenceId] = useState("");
  const [numberOne, setNumberOne] = useState("");
  const [numberTwo, setNumberTwo] = useState("");
  const [amount, setAmount] = useState("");
  const [cost, setCost] = useState("");
  const [lines, setLines] = useState<LineDraft[]>([freshLine()]);
  const [assetName, setAssetName] = useState("");
  const [assetIdentifier, setAssetIdentifier] = useState("");
  const [serial, setSerial] = useState("");
  const [serialProductId, setSerialProductId] = useState("");

  useVerticalMembership();
  const dashboard = useVerticalDashboard();
  const documents = useVerticalDocuments(selectedKind);
  const allDocuments = useVerticalDocuments();
  const assets = useVerticalAssets(domain === "oficina");
  const serials = useResaleSerials(domain === "revenda");
  const products = useAllProducts();
  const createDocument = useCreateVerticalDocument();
  const transitionDocument = useTransitionVerticalDocument();
  const createAsset = useCreateVerticalAsset();
  const createSerial = useCreateResaleSerial();
  const updateSerial = useUpdateResaleSerialStatus();

  const references = useMemo(() => {
    if (kindDefinition.reference === "asset")
      return (assets.data ?? []).map((asset) => ({ id: asset.id, label: asset.name }));
    if (kindDefinition.reference === "service_order")
      return (allDocuments.data ?? [])
        .filter((item) => item.kind === "service_order")
        .map((item) => ({ id: item.id, label: item.title }));
    if (kindDefinition.reference === "project")
      return (allDocuments.data ?? [])
        .filter((item) => item.kind === "project")
        .map((item) => ({ id: item.id, label: item.title }));
    return [];
  }, [allDocuments.data, assets.data, kindDefinition.reference]);

  function resetDocumentForm() {
    setTitle("");
    setDetail("");
    setReferenceId("");
    setNumberOne("");
    setNumberTwo("");
    setAmount("");
    setCost("");
    setLines([freshLine()]);
  }

  async function submitDocument() {
    if (!title.trim() || !detail.trim())
      return alertValidation("Preencha o título e os detalhes da operação.");
    if (kindDefinition.reference && !referenceId)
      return alertValidation("Selecione o vínculo desta operação.");
    const items: VerticalDocumentItemInput[] = lines
      .filter((line) => line.name.trim())
      .map((line) => ({
        name: line.name.trim(),
        quantity: numberValue(line.quantity, 1),
        unit: "un",
        unitCost: numberValue(line.unitCost),
        unitPrice: numberValue(line.unitPrice),
        metadata: {},
      }));
    const data: CreateVerticalDocument = {
      domain,
      kind: selectedKind,
      title: title.trim(),
      amount: numberValue(amount),
      cost: numberValue(cost),
      progress: 0,
      payload: makePayload(domain, selectedKind, {
        detail: detail.trim(),
        referenceId,
        numberOne,
        numberTwo,
      }),
      items,
    };
    try {
      await createDocument.mutateAsync(data);
      setCreateVisible(false);
      resetDocumentForm();
      showToast(`${kindDefinition.singular} salvo(a)`);
    } catch (error) {
      alertError(error);
    }
  }

  async function submitTransition(document: VerticalDocument, status: string) {
    try {
      await transitionDocument.mutateAsync({
        id: document.id,
        status,
        idempotencyKey: `${document.id}-${status}-${Date.now()}`,
      });
      showToast("Etapa atualizada");
    } catch (error) {
      alertError(error);
    }
  }

  async function submitAsset() {
    if (!assetName.trim())
      return alertValidation("Informe o nome do equipamento ou veículo.");
    try {
      await createAsset.mutateAsync({
        domain: "oficina",
        kind: "other",
        name: assetName.trim(),
        identifier: assetIdentifier.trim() || undefined,
        payload: {},
      });
      setAssetName("");
      setAssetIdentifier("");
      setAssetVisible(false);
      showToast("Equipamento cadastrado");
    } catch (error) {
      alertError(error);
    }
  }

  async function submitSerial() {
    if (!serialProductId || serial.trim().length < 3)
      return alertValidation("Selecione o produto e informe um serial válido.");
    try {
      await createSerial.mutateAsync({
        productId: serialProductId,
        serial: serial.trim(),
        cost: 0,
        metadata: {},
      });
      setSerial("");
      setSerialProductId("");
      setSerialVisible(false);
      showToast("Serial rastreado");
    } catch (error) {
      alertError(error);
    }
  }

  function changeSerialStatus(item: ResaleSerial, status: ResaleSerial["status"]) {
    void updateSerial
      .mutateAsync({ id: item.id, expectedStatus: item.status, status })
      .catch(alertError);
  }

  function changeLine(changedLine: LineDraft) {
    setLines((current) =>
      current.map((item) => (item.key === changedLine.key ? changedLine : item)),
    );
  }

  const lineTotal = lines
    .filter((line) => line.name.trim())
    .reduce(
      (total, line) =>
        total + numberValue(line.quantity, 1) * numberValue(line.unitPrice),
      0,
    );
  let documentContent: React.ReactNode;
  if (documents.isLoading) {
    documentContent = <ActivityIndicator color={theme.colors.primary} />;
  } else if (documents.data?.length) {
    documentContent = documents.data.map((document) => (
      <DocumentCard
        key={document.id}
        document={document}
        loading={transitionDocument.isPending}
        onTransition={submitTransition}
      />
    ));
  } else {
    documentContent = isDesktop ? (
      <Card variant="elevated" padding="md">
        <EmptyState
          icon={
            <View
              style={{
                width: 56,
                height: 56,
                borderRadius: radii.full,
                backgroundColor: theme.colors.primaryBg,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <AppIcon
                name="clipboard-outline"
                size={iconSizes.lg}
                color={theme.colors.primaryStrong}
              />
            </View>
          }
          title={`Nenhuma ${kindDefinition.singular} ainda`}
          description={`Crie a primeira ${kindDefinition.singular} para iniciar o fluxo.`}
          action={
            <Button
              title={`Nova ${kindDefinition.singular}`}
              onPress={() => setCreateVisible(true)}
            />
          }
          style={{ paddingVertical: spacing["3xl"], paddingHorizontal: spacing.xl }}
        />
      </Card>
    ) : (
      <Card variant="elevated">
        <Typography variant="h3">Nenhum registro ainda</Typography>
        <Typography variant="body" color={theme.colors.textSecondary}>
          Crie a primeira {kindDefinition.singular} para iniciar o fluxo.
        </Typography>
      </Card>
    );
  }

  return (
    <FeatureRouteGuard feature="operacaoVertical">
      <SafeAreaView
        edges={["top", "left", "right"]}
        style={{ flex: 1, backgroundColor: theme.colors.background }}
      >
        <ScreenHeader
          title={brand.vertical.operationLabel}
          subtitle={isDesktop ? brand.vertical.operationDescription : brand.appName}
          hideBack={isDesktop}
          right={
            isDesktop ? (
              <FAB
                icon="add"
                header
                accessibilityLabel={`Nova ${kindDefinition.singular}`}
                onPress={() => setCreateVisible(true)}
              />
            ) : undefined
          }
        />
        <ScrollView
          contentContainerStyle={{
            paddingTop: isDesktop ? spacing.md : 0,
            paddingBottom: spacing["4xl"],
            gap: spacing.xl,
            ...pageGutter(isDesktop),
            ...desktopStretch(isDesktop, desktopWidths.data),
          }}
        >
          {!isDesktop ? (
            <View
              style={{
                backgroundColor: theme.colors.primary,
                borderRadius: radii.xl,
                padding: spacing.xl,
                gap: spacing.sm,
                overflow: "hidden",
              }}
            >
              <Typography
                variant="captionBold"
                color={theme.colors.textOnPrimary}
                style={{ letterSpacing: 1.4 }}
              >
                {definition.eyebrow}
              </Typography>
              <Typography variant="h3" color={theme.colors.textOnPrimary}>
                {definition.headline}
              </Typography>
              <Typography variant="body" color={theme.colors.textOnPrimary}>
                {definition.supporting}
              </Typography>
            </View>
          ) : null}

          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.xl }}>
            <Metric
              label="Operações abertas"
              value={String(dashboard.data?.openDocuments ?? 0)}
              icon="clipboard-outline"
              desktop={isDesktop}
            />
            <Metric
              label="Valor em operação"
              value={formatCurrency(dashboard.data?.amount ?? 0)}
              icon="wallet-outline"
              desktop={isDesktop}
            />
            <Metric
              label="Resultado projetado"
              value={formatCurrency(dashboard.data?.projectedProfit ?? 0)}
              icon="trending-up-outline"
              desktop={isDesktop}
            />
          </View>

          {domain === "oficina" ? (
            <Card variant="elevated">
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}
              >
                {isDesktop ? (
                  <View
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: radii.md,
                      backgroundColor: theme.colors.primaryBg,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <AppIcon
                      name="car-outline"
                      size={iconSizes.md}
                      color={theme.colors.primaryStrong}
                    />
                  </View>
                ) : null}
                <View style={{ flex: 1 }}>
                  <Typography variant="h3">Pátio de equipamentos</Typography>
                  <Typography variant="caption">
                    {assets.data?.length ?? 0} ativo(s) com histórico próprio
                  </Typography>
                </View>
                <Button
                  title="Cadastrar"
                  size="sm"
                  variant={isDesktop ? "secondary" : "primary"}
                  onPress={() => setAssetVisible(true)}
                />
              </View>
            </Card>
          ) : null}
          {domain === "revenda" ? (
            <Card variant="elevated">
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}
              >
                {isDesktop ? (
                  <View
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: radii.md,
                      backgroundColor: theme.colors.primaryBg,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <AppIcon
                      name="barcode-outline"
                      size={iconSizes.md}
                      color={theme.colors.primaryStrong}
                    />
                  </View>
                ) : null}
                <View style={{ flex: 1 }}>
                  <Typography variant="h3">Rastreio por serial</Typography>
                  <Typography variant="caption">
                    {serials.data?.filter((item) => item.status === "available").length ??
                      0}{" "}
                    disponível(is)
                  </Typography>
                </View>
                <Button
                  title="Novo serial"
                  size="sm"
                  variant={isDesktop ? "secondary" : "primary"}
                  onPress={() => setSerialVisible(true)}
                />
              </View>
              {(serials.data ?? []).slice(0, 4).map((item) => (
                <SerialRow
                  key={item.id}
                  item={item}
                  loading={updateSerial.isPending}
                  onStatusChange={changeSerialStatus}
                />
              ))}
            </Card>
          ) : null}

          <View style={{ gap: spacing.md }}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: spacing.sm }}
            >
              {definition.kinds.map((item) => (
                <Chip
                  key={item.kind}
                  label={item.label}
                  selected={selectedKind === item.kind}
                  onPress={() => {
                    setSelectedKind(item.kind);
                    setReferenceId("");
                  }}
                />
              ))}
            </ScrollView>
            <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}>
              <View style={{ flex: 1 }}>
                <Typography variant="h3">{kindDefinition.label}</Typography>
                <Typography variant="caption">
                  {documents.data?.length ?? 0} registro(s)
                </Typography>
              </View>
              {!isDesktop ? (
                <Button
                  title={`Nova ${kindDefinition.singular}`}
                  titleLines={2}
                  onPress={() => setCreateVisible(true)}
                />
              ) : null}
            </View>
          </View>

          {documentContent}
        </ScrollView>

        <StandardModal
          visible={createVisible}
          onClose={() => setCreateVisible(false)}
          title={`Nova ${kindDefinition.singular}`}
          subtitle={kindDefinition.label}
          wide
          footer={
            <>
              <Button
                title="Cancelar"
                variant="ghost"
                style={{ flex: 1 }}
                onPress={() => setCreateVisible(false)}
              />
              <Button
                title="Salvar operação"
                loading={createDocument.isPending}
                style={{ flex: 1 }}
                onPress={() => void submitDocument()}
              />
            </>
          }
        >
          <Input
            label="Título"
            value={title}
            onChangeText={setTitle}
            placeholder="Identifique esta operação"
          />
          <Input
            label={kindDefinition.detailLabel}
            value={detail}
            onChangeText={setDetail}
            multiline
          />
          {kindDefinition.reference ? (
            <View style={{ gap: spacing.sm }}>
              <Typography variant="bodyBold">Vincular a</Typography>
              <ScrollView horizontal contentContainerStyle={{ gap: spacing.sm }}>
                {references.map((item) => (
                  <Chip
                    key={item.id}
                    label={item.label}
                    selected={referenceId === item.id}
                    onPress={() => setReferenceId(item.id)}
                  />
                ))}
              </ScrollView>
              {!references.length ? (
                <Typography variant="caption" color={theme.colors.alert}>
                  Cadastre primeiro o registro necessário para este vínculo.
                </Typography>
              ) : null}
            </View>
          ) : null}
          <View style={{ flexDirection: "row", gap: spacing.md }}>
            {kindDefinition.numberOneLabel ? (
              <Input
                label={kindDefinition.numberOneLabel}
                value={numberOne}
                onChangeText={setNumberOne}
                keyboardType="decimal-pad"
                containerStyle={{ flex: 1 }}
              />
            ) : null}
            {kindDefinition.numberTwoLabel ? (
              <Input
                label={kindDefinition.numberTwoLabel}
                value={numberTwo}
                onChangeText={setNumberTwo}
                keyboardType="decimal-pad"
                containerStyle={{ flex: 1 }}
              />
            ) : null}
          </View>
          <View style={{ flexDirection: "row", gap: spacing.md }}>
            <Input
              label="Valor previsto"
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
              containerStyle={{ flex: 1 }}
            />
            <Input
              label="Custo previsto"
              value={cost}
              onChangeText={setCost}
              keyboardType="decimal-pad"
              containerStyle={{ flex: 1 }}
            />
          </View>
          <View style={{ gap: spacing.md }}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Typography variant="h3" style={{ flex: 1 }}>
                Itens e serviços
              </Typography>
              <Button
                title="Adicionar item"
                size="sm"
                variant="secondary"
                onPress={() => setLines((current) => [...current, freshLine()])}
              />
            </View>
            {lines.map((line, index) => (
              <LineItemCard
                key={line.key}
                index={index}
                line={line}
                onChange={changeLine}
              />
            ))}
            <Typography variant="bodyBold">
              Total dos itens: {formatCurrency(lineTotal)}
            </Typography>
          </View>
        </StandardModal>

        <StandardModal
          visible={assetVisible}
          onClose={() => setAssetVisible(false)}
          title="Novo equipamento"
          footer={
            <Button
              title="Cadastrar equipamento"
              loading={createAsset.isPending}
              style={{ flex: 1 }}
              onPress={() => void submitAsset()}
            />
          }
        >
          <Input
            label="Nome"
            value={assetName}
            onChangeText={setAssetName}
            placeholder="Ex.: Honda Civic 2019"
          />
          <Input
            label="Placa, série ou IMEI"
            value={assetIdentifier}
            onChangeText={setAssetIdentifier}
          />
        </StandardModal>
        <StandardModal
          visible={serialVisible}
          onClose={() => setSerialVisible(false)}
          title="Rastrear produto por serial"
          footer={
            <Button
              title="Salvar serial"
              loading={createSerial.isPending}
              style={{ flex: 1 }}
              onPress={() => void submitSerial()}
            />
          }
        >
          <Typography variant="bodyBold">Produto</Typography>
          <ScrollView horizontal contentContainerStyle={{ gap: spacing.sm }}>
            {(products.data ?? []).map((product) => (
              <Chip
                key={product.id}
                label={product.name}
                selected={serialProductId === product.id}
                onPress={() => setSerialProductId(product.id)}
              />
            ))}
          </ScrollView>
          <Input
            label="Número de série"
            value={serial}
            onChangeText={setSerial}
            autoCapitalize="characters"
          />
        </StandardModal>
      </SafeAreaView>
    </FeatureRouteGuard>
  );
}
