import type { ExpenseCategory, RecurringExpense } from "@lucro-caseiro/contracts";
import { hasActiveFeature } from "@lucro-caseiro/contracts";
import {
  Button,
  EmptyState,
  fonts,
  fontSizes,
  iconSizes,
  Input,
  radii,
  spacing,
  Typography,
  useTheme,
  type Theme,
} from "@lucro-caseiro/ui";
import { Stack, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useMemo, useState } from "react";
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import fixedExpensesCalendar from "../assets/fixed-expenses-calendar.png";
import { useBusinessCopy } from "../features/subscription/business-copy";
import {
  useCreateRecurring,
  useDeleteRecurring,
  useRecurringExpenses,
  useUpdateRecurring,
} from "../features/finance/hooks";
import {
  nextRecurringExpense,
  sortRecurringExpenses,
  upcomingRecurringDays,
  type RecurringSortDirection,
} from "../features/finance/recurring-expenses-view";
import { useProfile } from "../features/subscription/hooks";
import type { AppIconName } from "../shared/components/app-icon";
import { AppIcon } from "../shared/components/app-icon";
import { showAlert } from "../shared/components/alert-store";
import { SkeletonList } from "../shared/components/skeleton";
import { StandardModal } from "../shared/components/standard-modal";
import { showToast } from "../shared/components/toast";
import { usePaywall } from "../shared/hooks/use-paywall";
import { desktopStretch, pageGutter } from "../shared/layout/desktop-density";
import { brandScreenPalette } from "../shared/brand-palette";
import { useDesktopLayout } from "../shared/layout/use-desktop-layout";
import { ApiError } from "../shared/utils/api-client";
import { alertError, alertValidation } from "../shared/utils/alerts";
import { maskCurrencyInput, parseCurrencyInput } from "../shared/utils/currency-input";
import { formatCurrency } from "../shared/utils/format";

const CATEGORIES: {
  key: ExpenseCategory;
  label: string;
  icon: AppIconName;
}[] = [
  { key: "utility", label: "Utilidade", icon: "flash-outline" },
  { key: "material", label: "Insumo", icon: "cube-outline" },
  { key: "packaging", label: "Embalagem", icon: "file-tray-outline" },
  { key: "transport", label: "Transporte", icon: "car-outline" },
  { key: "fee", label: "Taxa", icon: "pricetag-outline" },
  { key: "other", label: "Outro", icon: "ellipsis-horizontal-circle-outline" },
];

const CATEGORY_SURFACES: Record<ExpenseCategory, string> = {
  sale: "#F5EEE8",
  utility: "#FBE6EA",
  material: "#F4ECE8",
  packaging: "#F5EEE8",
  transport: "#EDF0F2",
  fee: "#F7EEE8",
  other: "#F1ECF4",
};

function useRecurringTheme() {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  return { theme, styles, palette: brandScreenPalette(theme) };
}

function categoryLabel(
  key: string,
  materialNoun = "insumo",
  packagingNoun = "embalagem",
): string {
  if (key === "material") return capitalize(materialNoun);
  if (key === "packaging") return capitalize(packagingNoun);
  return CATEGORIES.find((category) => category.key === key)?.label ?? "Outro";
}

function categoryIcon(key: ExpenseCategory): AppIconName {
  return CATEGORIES.find((category) => category.key === key)?.icon ?? "receipt-outline";
}

function capitalize(value: string): string {
  return value.replace(/^./, (letter) => letter.toUpperCase());
}

function moneyInputValue(value: number): string {
  return value.toFixed(2).replace(".", ",");
}

export default function RecurringExpensesScreen() {
  const { theme, styles, palette } = useRecurringTheme();
  const experienceCopy = useBusinessCopy();
  const isDesktop = useDesktopLayout();
  const { width: viewportWidth } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { data: items, isLoading } = useRecurringExpenses();
  const remove = useDeleteRecurring();
  const { data: profile } = useProfile();
  const canUseRecurringExpenses =
    !!profile &&
    hasActiveFeature(profile.plan, profile.planExpiresAt, "recurringExpenses");
  const showPaywall = usePaywall((state) => state.show);
  const [showForm, setShowForm] = useState(false);
  const [sortDirection, setSortDirection] = useState<RecurringSortDirection>("asc");
  const [selectedExpense, setSelectedExpense] = useState<RecurringExpense | null>(null);
  const [editingExpense, setEditingExpense] = useState<RecurringExpense | null>(null);

  const recurringItems = items ?? [];
  const orderedItems = useMemo(
    () => sortRecurringExpenses(items ?? [], sortDirection),
    [items, sortDirection],
  );
  const nextExpense = useMemo(() => nextRecurringExpense(items ?? []), [items]);
  const timelineDays = useMemo(() => upcomingRecurringDays(items ?? []), [items]);
  const total = useMemo(
    () => (items ?? []).reduce((sum, item) => sum + item.amount, 0),
    [items],
  );

  function handleBack() {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace("/tabs/more");
  }

  function handleAddPress() {
    if (!canUseRecurringExpenses) {
      showPaywall("recurring");
      return;
    }
    setSelectedExpense(null);
    setEditingExpense(null);
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingExpense(null);
  }

  function confirmDelete(id: string, description: string) {
    showAlert({
      title: "Remover gasto fixo?",
      message: `"${description}" não vai mais cair automaticamente no caixa. Os lançamentos já gerados continuam.`,
      buttons: [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Remover",
          style: "destructive",
          onPress: () => {
            remove.mutate(id);
            setSelectedExpense(null);
            setEditingExpense(null);
          },
        },
      ],
    });
  }

  return (
    <SafeAreaView edges={["top", "left", "right"]} style={styles.safeArea}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar style={theme.mode === "dark" ? "light" : "dark"} />

      <View style={styles.screen}>
        <RecurringHeader
          title="Gastos fixos"
          subtitle="Organize o que se repete todo mês."
          onBack={handleBack}
          onAdd={handleAddPress}
          isDesktop={isDesktop}
        />

        <ScrollView
          contentContainerStyle={[
            styles.content,
            pageGutter(isDesktop, spacing.lg),
            desktopStretch(isDesktop),
            { paddingBottom: Math.max(112, insets.bottom + 96) },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <MonthlyCommitmentsCard
            compact={viewportWidth <= 360}
            count={recurringItems.length}
            imageSize={Math.min(
              160,
              Math.max(
                96,
                (viewportWidth - (viewportWidth <= 360 ? 56 : 64)) *
                  (viewportWidth <= 360 ? 0.4 : 0.44) *
                  0.92,
              ),
            )}
            nextDay={nextExpense?.dayOfMonth ?? null}
            timelineDays={timelineDays}
            total={total}
          />

          {!canUseRecurringExpenses ? (
            <RecurringPremiumGate onUnlock={() => showPaywall("recurring")} />
          ) : (
            <>
              <View style={styles.listHeadingRow}>
                <View style={styles.listHeadingCopy}>
                  <Typography variant="h3" color={palette.wine}>
                    Seus gastos fixos
                  </Typography>
                  <Typography variant="caption">Ordenados por vencimento</Typography>
                </View>
                <Pressable
                  accessibilityHint="Alterna a ordem dos gastos pelo dia do mês"
                  accessibilityLabel={`Ordenar por data em ordem ${
                    sortDirection === "asc" ? "decrescente" : "crescente"
                  }`}
                  accessibilityRole="button"
                  onPress={() =>
                    setSortDirection((current) => (current === "asc" ? "desc" : "asc"))
                  }
                  style={({ pressed }) => [styles.sortButton, pressed && styles.pressed]}
                >
                  <AppIcon
                    name="filter-outline"
                    size={iconSizes.xs}
                    color={palette.wine}
                  />
                  <Typography variant="captionBold" color={palette.wine}>
                    Data {sortDirection === "asc" ? "↑" : "↓"}
                  </Typography>
                </Pressable>
              </View>

              {isLoading ? <SkeletonList rows={5} variant="amount" /> : null}

              {!isLoading && recurringItems.length === 0 ? (
                <EmptyRecurringState isDesktop={isDesktop} />
              ) : null}

              {!isLoading && orderedItems.length > 0 ? (
                <View style={styles.expenseList}>
                  {orderedItems.map((item, index) => (
                    <ExpenseRow
                      key={item.id}
                      item={item}
                      isLast={index === orderedItems.length - 1}
                      isNext={item.id === nextExpense?.id}
                      isSelected={selectedExpense?.id === item.id}
                      materialNoun={experienceCopy.materialNoun}
                      packagingNoun={experienceCopy.packagingNoun}
                      onPress={() => {
                        setSelectedExpense(item);
                        setEditingExpense(null);
                      }}
                    />
                  ))}
                </View>
              ) : null}

              {selectedExpense && !isLoading ? (
                <RecurringDetails
                  item={selectedExpense}
                  onClose={() => setSelectedExpense(null)}
                  onDelete={() =>
                    confirmDelete(selectedExpense.id, selectedExpense.description)
                  }
                  onEdit={() => {
                    setEditingExpense(selectedExpense);
                    setShowForm(true);
                  }}
                />
              ) : null}
            </>
          )}
        </ScrollView>

        {canUseRecurringExpenses ? (
          <Pressable
            accessibilityLabel="Adicionar gasto fixo"
            accessibilityRole="button"
            hitSlop={6}
            onPress={handleAddPress}
            style={({ pressed }) => [
              styles.fab,
              { bottom: insets.bottom + spacing.xl },
              pressed && styles.pressed,
            ]}
          >
            <AppIcon name="add" size={iconSizes.lg} color={palette.onWine} />
          </Pressable>
        ) : null}
      </View>

      {showForm && canUseRecurringExpenses ? (
        <RecurringFormModal
          key={editingExpense?.id ?? "new"}
          item={editingExpense}
          onClose={closeForm}
          onPaywall={() => {
            closeForm();
            showPaywall("recurring");
          }}
          onSaved={(saved) => setSelectedExpense(saved)}
        />
      ) : null}
    </SafeAreaView>
  );
}

function RecurringHeader({
  title,
  subtitle,
  onBack,
  onAdd,
  isDesktop,
}: Readonly<{
  title: string;
  subtitle: string;
  onBack: () => void;
  onAdd?: () => void;
  isDesktop: boolean;
}>) {
  const { styles, palette } = useRecurringTheme();

  return (
    <View
      style={[
        styles.header,
        pageGutter(isDesktop, spacing.lg),
        desktopStretch(isDesktop),
      ]}
    >
      <Pressable
        accessibilityLabel="Voltar"
        accessibilityRole="button"
        hitSlop={6}
        onPress={onBack}
        style={({ pressed }) => [styles.headerBack, pressed && styles.pressed]}
      >
        <AppIcon name="chevron-back" size={iconSizes.md} color={palette.ink} />
      </Pressable>
      <View style={styles.headerCopy}>
        <Typography variant="screenTitle" color={palette.wine} numberOfLines={1}>
          {title}
        </Typography>
        <Typography variant="caption" color={palette.warmGray}>
          {subtitle}
        </Typography>
      </View>
      {onAdd ? (
        <Pressable
          accessibilityLabel="Adicionar gasto fixo"
          accessibilityRole="button"
          hitSlop={4}
          onPress={onAdd}
          style={({ pressed }) => [styles.headerAdd, pressed && styles.pressed]}
        >
          <AppIcon name="add" size={iconSizes.md} color={palette.onWine} />
        </Pressable>
      ) : null}
    </View>
  );
}

function MonthlyCommitmentsCard({
  compact,
  count,
  imageSize,
  nextDay,
  timelineDays,
  total,
}: Readonly<{
  compact: boolean;
  count: number;
  imageSize: number;
  nextDay: number | null;
  timelineDays: readonly number[];
  total: number;
}>) {
  const { styles, palette } = useRecurringTheme();

  return (
    <View style={[styles.commitmentCard, compact && styles.commitmentCardCompact]}>
      <View style={styles.commitmentUpper}>
        <View style={[styles.commitmentCopy, compact && styles.commitmentCopyCompact]}>
          <Typography variant="body" color={palette.onWine}>
            Compromissos do mês
          </Typography>
          <Typography
            adjustsFontSizeToFit
            minimumFontScale={0.62}
            numberOfLines={1}
            style={styles.commitmentValue}
          >
            {formatCurrency(total)}
          </Typography>
          <Typography variant="caption" color="rgba(255,255,255,0.9)">
            {count} {count === 1 ? "gasto cadastrado" : "gastos cadastrados"}
          </Typography>
        </View>

        <View
          accessible={false}
          importantForAccessibility="no-hide-descendants"
          pointerEvents="none"
          style={[styles.commitmentVisual, compact && styles.commitmentVisualCompact]}
        >
          <View style={styles.commitmentBlob} />
          <Image
            accessibilityIgnoresInvertColors
            accessible={false}
            resizeMode="contain"
            source={fixedExpensesCalendar}
            style={[styles.commitmentImage, { height: imageSize, width: imageSize }]}
          />
        </View>
      </View>

      <View style={styles.timeline}>
        {timelineDays.length > 1 ? <View style={styles.timelineLine} /> : null}
        {timelineDays.length > 0 ? (
          timelineDays.map((day) => {
            const highlighted = day === nextDay;
            return (
              <View key={day} style={styles.timelineItem}>
                <View
                  style={[
                    styles.timelineDot,
                    highlighted && styles.timelineDotHighlighted,
                  ]}
                />
                <Typography
                  variant="caption"
                  color={highlighted ? palette.lime : "rgba(255,255,255,0.9)"}
                >
                  {day}
                </Typography>
              </View>
            );
          })
        ) : (
          <Typography variant="caption" color="rgba(255,255,255,0.72)">
            Seus próximos vencimentos aparecerão aqui
          </Typography>
        )}
      </View>
    </View>
  );
}

function ExpenseRow({
  item,
  isLast,
  isNext,
  isSelected,
  materialNoun,
  packagingNoun,
  onPress,
}: Readonly<{
  item: RecurringExpense;
  isLast: boolean;
  isNext: boolean;
  isSelected: boolean;
  materialNoun: string;
  packagingNoun: string;
  onPress: () => void;
}>) {
  const { theme, styles, palette } = useRecurringTheme();
  const iconSurface =
    theme.mode === "light" ? CATEGORY_SURFACES[item.category] : theme.colors.surface;

  return (
    <Pressable
      accessibilityHint="Abre os detalhes e a edição deste gasto"
      accessibilityLabel={`${item.description}, ${categoryLabel(
        item.category,
        materialNoun,
        packagingNoun,
      )}, dia ${item.dayOfMonth}, ${formatCurrency(item.amount)}`}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.expenseRow,
        !isLast && styles.expenseRowDivider,
        isNext && styles.expenseRowNext,
        isSelected && styles.expenseRowSelected,
        pressed && styles.pressed,
      ]}
    >
      {isNext ? <View style={styles.nextExpenseBar} /> : null}
      <View style={[styles.expenseIcon, { backgroundColor: iconSurface }]}>
        <AppIcon
          name={categoryIcon(item.category)}
          size={iconSizes.list}
          color={palette.wine}
        />
      </View>
      <View style={styles.expenseInfo}>
        <Typography variant="bodyBold" numberOfLines={2}>
          {item.description}
        </Typography>
        <Typography numberOfLines={2}>
          {categoryLabel(item.category, materialNoun, packagingNoun)} · dia{" "}
          {item.dayOfMonth}
        </Typography>
      </View>
      <View style={styles.expenseAmountBlock}>
        <Typography variant="captionBold" numberOfLines={1} style={styles.expenseAmount}>
          {formatCurrency(item.amount)}
        </Typography>
        {isNext ? (
          <View accessibilityLabel="Próximo vencimento" style={styles.nextDot} />
        ) : null}
      </View>
      <AppIcon name="chevron-forward" size={iconSizes.sm} color={palette.warmGray} />
    </Pressable>
  );
}

function RecurringFormModal({
  item,
  onClose,
  onPaywall,
  onSaved,
}: Readonly<{
  item?: RecurringExpense | null;
  onClose: () => void;
  onPaywall: () => void;
  onSaved?: (item: RecurringExpense) => void;
}>) {
  const create = useCreateRecurring();
  const update = useUpdateRecurring();
  const { styles, palette } = useRecurringTheme();
  const experienceCopy = useBusinessCopy();
  const isEditing = !!item;
  const isSaving = create.isPending || update.isPending;
  const [description, setDescription] = useState(item?.description ?? "");
  const [amount, setAmount] = useState(item ? moneyInputValue(item.amount) : "");
  const [category, setCategory] = useState<ExpenseCategory>(item?.category ?? "utility");
  const [day, setDay] = useState(item ? String(item.dayOfMonth) : "");
  const parsedDay = Number.parseInt(day, 10);
  const validDay = !Number.isNaN(parsedDay) && parsedDay >= 1 && parsedDay <= 28;
  const categories = CATEGORIES.map((categoryOption) => {
    if (categoryOption.key === "material") {
      return { ...categoryOption, label: capitalize(experienceCopy.materialNoun) };
    }
    if (categoryOption.key === "packaging") {
      return { ...categoryOption, label: capitalize(experienceCopy.packagingNoun) };
    }
    return categoryOption;
  });

  async function handleSave() {
    if (isSaving) return;

    const parsedAmount = parseCurrencyInput(amount);

    if (Number.isNaN(parsedAmount) || parsedAmount <= 0) {
      alertValidation("Informe um valor maior que zero.");
      return;
    }
    if (!description.trim()) {
      alertValidation("Adicione uma descrição (ex.: Aluguel).");
      return;
    }
    if (!validDay) {
      alertValidation("O dia deve estar entre 1 e 28.");
      return;
    }

    try {
      const payload = {
        category,
        amount: parsedAmount,
        description: description.trim(),
        dayOfMonth: parsedDay,
      };
      const saved = item
        ? await update.mutateAsync({ id: item.id, data: payload })
        : await create.mutateAsync(payload);
      if (
        saved.description !== payload.description ||
        saved.amount !== payload.amount ||
        saved.category !== payload.category ||
        saved.dayOfMonth !== payload.dayOfMonth
      ) {
        throw new Error("A API não confirmou o gasto fixo enviado.");
      }
      showToast(item ? "Gasto fixo atualizado!" : "Gasto fixo cadastrado!");
      onSaved?.(saved);
      onClose();
    } catch (error) {
      if (error instanceof ApiError && error.code === "LIMIT_EXCEEDED") {
        onPaywall();
        return;
      }
      alertError(
        error instanceof ApiError && error.status === 400
          ? error.message
          : "Não foi possível salvar. Tente novamente.",
      );
    }
  }

  return (
    <StandardModal
      visible
      onClose={onClose}
      title={isEditing ? "Editar gasto fixo" : "Novo gasto fixo"}
      subtitle={
        isEditing
          ? "Atualize os dados deste compromisso mensal."
          : "Cadastre uma vez e deixe o caixa lembrar todo mês."
      }
      footer={
        <>
          <Button
            disabled={isSaving}
            onPress={onClose}
            size="lg"
            style={styles.cancelAction}
            title="Cancelar"
            variant="outline"
          />
          <Button
            disabled={isSaving}
            loading={isSaving}
            onPress={() => void handleSave()}
            size="lg"
            style={styles.saveAction}
            title={isEditing ? "Salvar alterações" : "Salvar gasto"}
          />
        </>
      }
    >
      <Input
        accessibilityLabel="Descrição"
        autoCapitalize="sentences"
        icon={
          <AppIcon
            name="document-text-outline"
            size={iconSizes.sm}
            color={palette.wine}
          />
        }
        label="Descrição"
        maxLength={120}
        onChangeText={setDescription}
        placeholder="Ex.: Aluguel da cozinha"
        returnKeyType="next"
        style={styles.formInput}
        value={description}
      />

      <Input
        accessibilityLabel="Valor em reais"
        icon={<AppIcon name="wallet-outline" size={iconSizes.sm} color={palette.wine} />}
        keyboardType="decimal-pad"
        label="Valor (R$)"
        onChangeText={(value) => setAmount(maskCurrencyInput(value))}
        placeholder="Ex.: 800,00"
        style={styles.formInput}
        value={amount}
      />

      <View style={styles.fieldBlock}>
        <Typography variant="captionBold" color={palette.ink}>
          Categoria
        </Typography>
        <View style={styles.categoryGrid}>
          {categories.map((categoryOption) => {
            const selected = categoryOption.key === category;
            return (
              <Pressable
                key={categoryOption.key}
                accessibilityLabel={categoryOption.label}
                accessibilityRole="radio"
                accessibilityState={{ checked: selected }}
                onPress={() => setCategory(categoryOption.key)}
                style={({ pressed }) => [
                  styles.categoryOption,
                  selected && styles.categoryOptionSelected,
                  pressed && styles.pressed,
                ]}
              >
                <AppIcon
                  name={categoryOption.icon}
                  size={iconSizes.md}
                  color={selected ? palette.wine : palette.warmGray}
                />
                <Typography
                  variant={selected ? "captionBold" : "caption"}
                  color={selected ? palette.wine : palette.ink}
                  numberOfLines={1}
                >
                  {categoryOption.label}
                </Typography>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.fieldBlock}>
        <View style={styles.dayLabelRow}>
          <Typography variant="captionBold" color={palette.ink}>
            Dia do mês
          </Typography>
          <Typography variant="caption">De 1 a 28</Typography>
        </View>
        <Input
          accessibilityLabel="Dia do mês, de 1 a 28"
          icon={
            <AppIcon name="calendar-outline" size={iconSizes.sm} color={palette.wine} />
          }
          keyboardType="number-pad"
          maxLength={2}
          onChangeText={(value) => setDay(value.replace(/\D/g, "").slice(0, 2))}
          placeholder="Ex.: 8"
          style={styles.formInput}
          value={day}
        />
      </View>

      <View style={styles.recurrenceNotice}>
        <View style={styles.recurrenceNoticeIcon}>
          <AppIcon name="calendar-outline" size={iconSizes.md} color={palette.wine} />
        </View>
        <Typography variant="caption" color={palette.ink}>
          {validDay
            ? `Será lançado todo dia ${parsedDay}`
            : "Informe um dia entre 1 e 28"}
        </Typography>
      </View>
    </StandardModal>
  );
}

function RecurringDetails({
  item,
  onClose,
  onDelete,
  onEdit,
}: Readonly<{
  item: RecurringExpense;
  onClose: () => void;
  onDelete: () => void;
  onEdit: () => void;
}>) {
  const { theme, styles, palette } = useRecurringTheme();
  const experienceCopy = useBusinessCopy();
  const isDesktop = useDesktopLayout();

  return (
    <View style={styles.detailCard}>
      <View style={styles.detailHeader}>
        <Typography variant="h3">Detalhes do gasto</Typography>
        <Pressable
          accessibilityLabel="Fechar detalhes"
          accessibilityRole="button"
          hitSlop={12}
          onPress={onClose}
          style={({ pressed }) => pressed && styles.pressed}
        >
          <AppIcon name="close" size={iconSizes.sm} color={theme.colors.text} />
        </Pressable>
      </View>

      <Typography variant="h3">{item.description}</Typography>

      <View style={styles.detailGrid}>
        <DetailItem
          icon="cash-outline"
          label="Valor"
          value={formatCurrency(item.amount)}
        />
        <DetailItem
          icon="grid-outline"
          label="Categoria"
          value={categoryLabel(
            item.category,
            experienceCopy.materialNoun,
            experienceCopy.packagingNoun,
          )}
        />
        <DetailItem
          icon="calendar-outline"
          label="Dia do mês"
          value={`Todo dia ${item.dayOfMonth}`}
        />
        <DetailItem
          icon="checkmark-circle-outline"
          label="Status"
          value={item.active ? "Ativo" : "Inativo"}
        />
      </View>

      <View style={[styles.detailActions, isDesktop && { justifyContent: "flex-end" }]}>
        <Button
          icon={
            <AppIcon name="trash-outline" size={iconSizes.xs} color={palette.onWine} />
          }
          onPress={onDelete}
          style={styles.deleteAction}
          title="Remover"
        />
        <Button
          icon={
            <AppIcon name="create-outline" size={iconSizes.xs} color={palette.onWine} />
          }
          onPress={onEdit}
          style={styles.saveAction}
          title="Editar"
        />
      </View>
    </View>
  );
}

function DetailItem({
  icon,
  label,
  value,
}: Readonly<{
  icon: AppIconName;
  label: string;
  value: string;
}>) {
  const { theme, styles } = useRecurringTheme();

  return (
    <View style={styles.detailItem}>
      <AppIcon name={icon} size={iconSizes.xs} color={theme.colors.textSecondary} />
      <View style={styles.detailTextBlock}>
        <Typography variant="caption">{label}</Typography>
        <Typography variant="bodyBold">{value}</Typography>
      </View>
    </View>
  );
}

function RecurringPremiumGate({ onUnlock }: Readonly<{ onUnlock: () => void }>) {
  const { theme, styles } = useRecurringTheme();
  const benefits = [
    "Aluguel, internet, gás e outros custos caem sozinhos no caixa todo mês.",
    "Você não esquece nenhuma conta — o app lança na data certa.",
    "Enxergue o lucro real, já com os custos fixos descontados.",
  ];

  return (
    <View style={styles.gateCard}>
      <View style={styles.gateBadge}>
        <AppIcon
          name="diamond-outline"
          size={iconSizes.xs}
          color={theme.colors.premium}
        />
        <Typography variant="captionBold" color={theme.colors.premium}>
          Recurso Profissional
        </Typography>
      </View>
      <Typography variant="h3">Gastos fixos no automático</Typography>
      <Typography variant="caption">
        Cadastre uma vez e deixe o app lançar seus custos mensais sozinho, sempre na data
        certa.
      </Typography>
      {benefits.map((benefit) => (
        <View key={benefit} style={styles.gateBullet}>
          <AppIcon
            name="checkmark-circle"
            size={iconSizes.sm}
            color={theme.colors.premium}
          />
          <Typography variant="caption" color={theme.colors.text} style={styles.gateText}>
            {benefit}
          </Typography>
        </View>
      ))}
      <Button
        icon={
          <AppIcon
            name="lock-open-outline"
            size={iconSizes.sm}
            color={theme.colors.textOnPrimary}
          />
        }
        onPress={onUnlock}
        size="lg"
        title="Desbloquear no Profissional"
      />
    </View>
  );
}

function EmptyRecurringState({ isDesktop }: Readonly<{ isDesktop: boolean }>) {
  return (
    <EmptyState
      style={{
        flex: undefined,
        width: "100%",
        alignSelf: "center",
        marginTop: isDesktop ? spacing["3xl"] : 0,
        paddingTop: spacing.lg,
        paddingHorizontal: spacing.sm,
      }}
      title="Nenhum gasto fixo ainda"
      description="Cadastre seus custos mensais e deixe o app lançar pra você."
    />
  );
}

function createStyles(theme: Theme) {
  const palette = brandScreenPalette(theme);

  return StyleSheet.create({
    cancelAction: {
      borderColor: palette.wine,
      flex: 1,
    },
    categoryGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.md,
    },
    categoryOption: {
      alignItems: "center",
      backgroundColor: palette.white,
      borderColor: palette.border,
      borderRadius: radii.md,
      borderWidth: 1,
      flexBasis: "30%",
      flexGrow: 1,
      gap: spacing.xs,
      justifyContent: "center",
      minHeight: 76,
      minWidth: 84,
      paddingHorizontal: spacing.xs,
      paddingVertical: spacing.sm,
    },
    categoryOptionSelected: {
      backgroundColor: palette.softRose,
      borderColor: palette.wine,
      borderWidth: 1.5,
    },
    commitmentBlob: {
      backgroundColor: "#F1C7CF",
      borderRadius: radii.full,
      height: "82%",
      position: "absolute",
      right: -spacing.sm,
      top: spacing.md,
      transform: [{ rotate: "-9deg" }],
      width: "112%",
    },
    commitmentCard: {
      backgroundColor: palette.wineFill,
      borderRadius: radii.lg,
      height: 216,
      overflow: "hidden",
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.lg,
    },
    commitmentCardCompact: {
      height: 204,
      paddingHorizontal: spacing.md,
      paddingTop: spacing.md,
    },
    commitmentCopy: {
      gap: spacing.xs,
      justifyContent: "center",
      maxWidth: "55%",
      minWidth: 0,
      paddingBottom: spacing.sm,
      width: "55%",
      zIndex: 2,
    },
    commitmentCopyCompact: {
      maxWidth: "60%",
      width: "60%",
    },
    commitmentImage: {
      zIndex: 2,
    },
    commitmentUpper: {
      flex: 1,
      flexDirection: "row",
      minHeight: 0,
    },
    commitmentValue: {
      color: palette.onWine,
      fontFamily: fonts.extraBold,
      fontSize: fontSizes["2xl"],
      fontVariant: ["tabular-nums"],
      letterSpacing: -0.4,
      lineHeight: 36,
    },
    commitmentVisual: {
      alignItems: "center",
      bottom: spacing.xs,
      justifyContent: "center",
      position: "absolute",
      right: 0,
      top: -spacing.sm,
      width: "44%",
    },
    commitmentVisualCompact: {
      width: "40%",
    },
    content: {
      gap: spacing.xl,
      paddingTop: spacing.sm,
    },
    dayLabelRow: {
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "space-between",
    },
    deleteAction: {
      backgroundColor: theme.colors.alert,
      flex: 1,
    },
    detailActions: {
      flexDirection: "row",
      gap: spacing.md,
    },
    detailCard: {
      backgroundColor: palette.white,
      borderColor: palette.border,
      borderRadius: radii.lg,
      borderWidth: 1,
      gap: spacing.lg,
      padding: spacing.lg,
    },
    detailGrid: {
      gap: spacing.sm,
    },
    detailHeader: {
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "space-between",
    },
    detailItem: {
      alignItems: "center",
      backgroundColor: palette.neutral,
      borderRadius: radii.md,
      flexDirection: "row",
      gap: spacing.md,
      minHeight: 48,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    detailTextBlock: {
      flex: 1,
      gap: 2,
    },
    expenseAmount: {
      fontVariant: ["tabular-nums"],
      textAlign: "right",
    },
    expenseAmountBlock: {
      alignItems: "center",
      flexDirection: "row",
      flexShrink: 0,
      gap: spacing.xs,
      justifyContent: "flex-end",
      minWidth: 76,
    },
    expenseIcon: {
      alignItems: "center",
      borderRadius: radii.md,
      flexShrink: 0,
      height: 44,
      justifyContent: "center",
      width: 44,
    },
    expenseInfo: {
      flex: 1,
      gap: 1,
      minWidth: 0,
    },
    expenseList: {
      backgroundColor: palette.white,
      borderColor: palette.border,
      borderRadius: radii.md,
      borderWidth: 1,
      overflow: "hidden",
    },
    expenseRow: {
      alignItems: "center",
      backgroundColor: palette.white,
      flexDirection: "row",
      gap: spacing.xs,
      minHeight: 68,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      position: "relative",
    },
    expenseRowDivider: {
      borderBottomColor: palette.border,
      borderBottomWidth: StyleSheet.hairlineWidth,
    },
    expenseRowNext: {
      backgroundColor: palette.softRose,
    },
    expenseRowSelected: {
      backgroundColor: palette.softRose,
    },
    fab: {
      alignItems: "center",
      backgroundColor: palette.rose,
      borderRadius: radii.full,
      height: 56,
      justifyContent: "center",
      position: "absolute",
      right: spacing.lg,
      width: 56,
      ...theme.shadows.md,
    },
    fieldBlock: {
      gap: spacing.sm,
    },
    formInput: {
      height: 54,
    },
    gateBadge: {
      alignItems: "center",
      alignSelf: "flex-start",
      backgroundColor: theme.colors.premiumBg,
      borderRadius: radii.full,
      flexDirection: "row",
      gap: spacing.sm,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    gateBullet: {
      alignItems: "flex-start",
      flexDirection: "row",
      gap: spacing.md,
    },
    gateCard: {
      backgroundColor: palette.white,
      borderColor: theme.colors.premium,
      borderRadius: radii.lg,
      borderWidth: 1,
      gap: spacing.lg,
      padding: spacing.xl,
    },
    gateText: {
      flex: 1,
    },
    header: {
      alignItems: "center",
      flexDirection: "row",
      gap: spacing.sm,
      minHeight: 72,
      paddingBottom: spacing.sm,
      paddingTop: spacing.sm,
      width: "100%",
      zIndex: 10,
    },
    headerAdd: {
      alignItems: "center",
      backgroundColor: palette.rose,
      borderRadius: radii.full,
      flexShrink: 0,
      height: 48,
      justifyContent: "center",
      width: 48,
    },
    headerBack: {
      alignItems: "center",
      flexShrink: 0,
      height: 44,
      justifyContent: "center",
      width: 44,
    },
    headerCopy: {
      flex: 1,
      gap: 1,
      minWidth: 0,
    },
    listHeadingCopy: {
      flex: 1,
      minWidth: 0,
    },
    listHeadingRow: {
      alignItems: "center",
      flexDirection: "row",
      gap: spacing.md,
      justifyContent: "space-between",
    },
    nextDot: {
      backgroundColor: palette.lime,
      borderRadius: radii.full,
      height: 8,
      width: 8,
    },
    nextExpenseBar: {
      backgroundColor: palette.rose,
      bottom: spacing.sm,
      left: 3,
      position: "absolute",
      top: spacing.sm,
      width: 4,
    },
    pressed: {
      opacity: 0.78,
    },
    recurrenceNotice: {
      alignItems: "center",
      backgroundColor: palette.softRose,
      borderRadius: radii.md,
      flexDirection: "row",
      gap: spacing.md,
      minHeight: 60,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    recurrenceNoticeIcon: {
      alignItems: "center",
      backgroundColor: palette.white,
      borderRadius: radii.md,
      height: 44,
      justifyContent: "center",
      width: 44,
    },
    safeArea: {
      backgroundColor: palette.background,
      flex: 1,
    },
    saveAction: {
      backgroundColor: palette.rose,
      flex: 1,
    },
    screen: {
      flex: 1,
      minHeight: 0,
    },
    sortButton: {
      alignItems: "center",
      backgroundColor: palette.white,
      borderColor: palette.border,
      borderRadius: radii.md,
      borderWidth: 1,
      flexDirection: "row",
      flexShrink: 0,
      gap: spacing.sm,
      minHeight: 44,
      paddingHorizontal: spacing.md,
    },
    timeline: {
      alignItems: "flex-start",
      flexDirection: "row",
      height: 48,
      justifyContent: "space-between",
      paddingHorizontal: spacing.xs,
      position: "relative",
    },
    timelineDot: {
      backgroundColor: palette.wineFill,
      borderColor: "rgba(255,255,255,0.8)",
      borderRadius: radii.full,
      borderWidth: 1.5,
      height: 11,
      width: 11,
      zIndex: 2,
    },
    timelineDotHighlighted: {
      backgroundColor: palette.lime,
      borderColor: palette.onWine,
    },
    timelineItem: {
      alignItems: "center",
      flex: 1,
      gap: spacing.xs,
      zIndex: 2,
    },
    timelineLine: {
      backgroundColor: "rgba(255,255,255,0.5)",
      height: StyleSheet.hairlineWidth,
      left: "10%",
      position: "absolute",
      right: "10%",
      top: 5,
    },
  });
}
