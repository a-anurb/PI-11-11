import { Feather } from '@expo/vector-icons';
import { useCloudValue } from '../../lib/cloudData';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, ScrollView, Share, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { blackAlpha, brand, colors, radii, shadow } from '../../constants/theme';
import {
  AmortSystem,
  calcInterest,
  compareOptions,
  InterestType,
  PaymentMode,
  RatePeriod,
  SimInput,
  simulate,
} from '../../lib/finance';
import { formatCurrency } from '../../utils/format';
import { useAmountInput } from '../../utils/useAmountInput';

// ---------------------------------------------------------------- helpers
const pct = (v: number, digits = 2) => `${v.toFixed(digits).replace('.', ',')}%`;
const parseMoney = (v: string) => parseFloat(v.replace(/\./g, '').replace(',', '.')) || 0;
const moneyToField = (n: number) => n.toFixed(2).replace('.', ',');
const parseRate = (v: string) => {
  const n = parseFloat(v.replace(',', '.'));
  return Number.isFinite(n) ? n : NaN;
};

const MODES: { key: PaymentMode; label: string; icon: keyof typeof Feather.glyphMap }[] = [
  { key: 'avista', label: 'À vista', icon: 'dollar-sign' },
  { key: 'sem_juros', label: 'Sem juros', icon: 'layers' },
  { key: 'com_juros', label: 'Com juros', icon: 'trending-up' },
  { key: 'financiamento', label: 'Financiamento', icon: 'home' },
];

interface SavedSim {
  id: string;
  createdAt: string;
  title: string;
  input: SimInput;
  parcela: number;
  parcelas: number;
  total: number;
  juros: number;
}

type Tab = 'parcelamento' | 'juros' | 'salvas';

// ================================================================= tela
export default function Simulator() {
  const [tab, setTab] = useState<Tab>('parcelamento');
  const [saved, setSaved, loaded] = useCloudValue<SavedSim[]>('mony_simulations', []);
  const [history, setHistory, historyLoaded] = useCloudValue<SavedSim[]>('mony_sim_history', []);
  const [pendingLoad, setPendingLoad] = useState<SimInput | null>(null);
  const addToHistory = (entry: SavedSim) =>
    setHistory((prev) => {
      const key = JSON.stringify(entry.input);
      return [entry, ...prev.filter((h) => JSON.stringify(h.input) !== key)].slice(0, 10);
    });

  if (!loaded || !historyLoaded) {
    return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg }}>
      <ActivityIndicator color={brand.green} />
    </View>;
  }

  return (
    <LinearGradient colors={[colors.bg, colors.bgAlt]} style={styles.flex}>
      <SafeAreaView style={styles.flex} edges={['top']}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Simulador</Text>
            <Text style={styles.headerSubtitle}>Descubra quanto você realmente vai pagar</Text>
          </View>

          <View style={styles.tabs}>
            {(
              [
                ['parcelamento', 'Compra', 'shopping-bag'],
                ['juros', 'Juros', 'percent'],
                ['salvas', `Salvas${saved.length ? ` (${saved.length})` : ''}`, 'bookmark'],
              ] as const
            ).map(([key, label, icon]) => (
              <Pressable key={key} onPress={() => setTab(key)} style={[styles.tab, tab === key && styles.tabOn]}>
                <Feather name={icon} size={14} color={tab === key ? colors.white : blackAlpha(0.55)} />
                <Text style={[styles.tabLabel, tab === key && styles.tabLabelOn]}>{label}</Text>
              </Pressable>
            ))}
          </View>

          {tab === 'parcelamento' && (
            <PurchaseSimulator
              pendingLoad={pendingLoad}
              onLoaded={() => setPendingLoad(null)}
              onSave={(s) => setSaved((prev) => [s, ...prev].slice(0, 50))}
              onHistory={addToHistory}
            />
          )}
          {tab === 'juros' && <InterestCalculator />}
          {tab === 'salvas' && (
            <SavedList
              items={saved}
              history={history}
              onClearHistory={() => setHistory([])}
              onSaveFromHistory={(h) => setSaved((prev) => [{ ...h, id: `sim_${Date.now()}`, createdAt: new Date().toISOString() }, ...prev].slice(0, 50))}
              onDelete={(id) => setSaved((prev) => prev.filter((s) => s.id !== id))}
              onLoad={(s) => {
                setPendingLoad(s.input);
                setTab('parcelamento');
              }}
            />
          )}

          <View style={styles.disclaimer}>
            <Feather name="info" size={13} color={blackAlpha(0.4)} />
            <Text style={styles.disclaimerText}>
              Simulação educativa, feita com os dados que você informou. Não é proposta de crédito nem garantia de
              aprovação. Bancos e lojas podem cobrar encargos (IOF, seguros, tarifas) que só entram no cálculo se você
              informar.
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

// ================================================================= simulador de compra
function PurchaseSimulator({
  pendingLoad,
  onLoaded,
  onSave,
  onHistory,
}: {
  pendingLoad: SimInput | null;
  onLoaded: () => void;
  onSave: (s: SavedSim) => void;
  onHistory: (s: SavedSim) => void;
}) {
  const price = useAmountInput('0,00');
  const down = useAmountInput('0,00');
  const fees = useAmountInput('0,00');
  const [installments, setInstallments] = useState('10');
  const [rate, setRate] = useState('2,5');
  const [ratePeriod, setRatePeriod] = useState<RatePeriod>('mes');
  const [interestType, setInterestType] = useState<InterestType>('compostos');
  const [mode, setMode] = useState<PaymentMode>('com_juros');
  const [amort, setAmort] = useState<AmortSystem>('price');
  const [discount, setDiscount] = useState('0');
  const [showMore, setShowMore] = useState(false);
  const [showTable, setShowTable] = useState(false);
  const [toast, setToast] = useState('');

  // carregar simulação salva
  useEffect(() => {
    if (!pendingLoad) return;
    const p = pendingLoad;
    price.setValue(moneyToField(p.price));
    down.setValue(moneyToField(p.downPayment));
    fees.setValue(moneyToField(p.fees));
    setInstallments(String(p.installments));
    setRate(String(p.ratePercent).replace('.', ','));
    setRatePeriod(p.ratePeriod);
    setInterestType(p.interestType);
    setMode(p.mode);
    setAmort(p.amortSystem);
    setDiscount(String(p.cashDiscountPercent).replace('.', ','));
    setShowMore(p.fees > 0 || p.cashDiscountPercent > 0);
    onLoaded();
    flash('Simulação carregada');
  }, [pendingLoad]);

  const flash = (m: string) => {
    setToast(m);
    setTimeout(() => setToast(''), 2500);
  };

  const rateNum = parseRate(rate);
  const input: SimInput = {
    price: parseMoney(price.value),
    downPayment: parseMoney(down.value),
    installments: parseInt(installments, 10) || 0,
    ratePercent: Number.isNaN(rateNum) ? -1 : rateNum,
    ratePeriod,
    interestType,
    mode,
    amortSystem: amort,
    fees: parseMoney(fees.value),
    cashDiscountPercent: parseRate(discount) || 0,
  };

  const result = useMemo(() => simulate(input), [JSON.stringify(input)]);
  const comparison = useMemo(() => compareOptions({ ...input, mode: 'com_juros' }), [JSON.stringify(input)]);
  const needsRate = mode === 'com_juros' || mode === 'financiamento';
  const needsInstallments = mode !== 'avista';
  const touched = input.price > 0;

  const clear = () => {
    price.setValue('0,00');
    down.setValue('0,00');
    fees.setValue('0,00');
    setInstallments('10');
    setRate('2,5');
    setRatePeriod('mes');
    setInterestType('compostos');
    setMode('com_juros');
    setAmort('price');
    setDiscount('0');
    setShowTable(false);
    flash('Pronto para uma nova simulação');
  };

  const modeLabel = MODES.find((m) => m.key === mode)!.label;

  const summaryText = () => {
    if (!result.ok) return '';
    const lines = [
      `Simulação MonY — ${modeLabel}`,
      `Valor da compra: ${formatCurrency(result.price)}`,
      result.downPayment > 0 ? `Entrada: ${formatCurrency(result.downPayment)}` : '',
      result.parcelas > 0 ? `Parcelas: ${result.parcelas}x de ${formatCurrency(result.parcela)}` : '',
      needsRate ? `Taxa: ${pct(rateNum)} ${ratePeriod === 'mes' ? 'ao mês' : 'ao ano'}` : '',
      `Total pago: ${formatCurrency(result.totalPaid)}`,
      result.interest > 0 ? `Juros: ${formatCurrency(result.interest)} (${pct(result.interestPctOfFinanced, 1)} do valor financiado)` : '',
      '(simulação educativa, não é proposta de crédito)',
    ];
    return lines.filter(Boolean).join('\n');
  };

  const share = async () => {
    const text = summaryText();
    if (!text) return;
    try {
      if (Platform.OS === 'web') {
        const nav: any = typeof navigator !== 'undefined' ? navigator : null;
        if (nav?.share) await nav.share({ text });
        else if (nav?.clipboard) {
          await nav.clipboard.writeText(text);
          flash('Resumo copiado para a área de transferência');
        }
      } else {
        await Share.share({ message: text });
      }
    } catch {
      // compartilhamento cancelado
    }
  };

  const buildEntry = (): SavedSim | null => {
    if (!result.ok) return null;
    const title =
      mode === 'avista'
        ? `${formatCurrency(result.price)} à vista`
        : `${formatCurrency(result.price)} em ${result.parcelas}x — ${modeLabel.toLowerCase()}${needsRate ? ` ${pct(rateNum)} ${ratePeriod === 'mes' ? 'a.m.' : 'a.a.'}` : ''}`;
    return {
      id: `sim_${Date.now()}`,
      createdAt: new Date().toISOString(),
      title,
      input,
      parcela: result.parcela,
      parcelas: result.parcelas,
      total: result.totalPaid,
      juros: result.interest,
    };
  };

  const save = () => {
    const entry = buildEntry();
    if (!entry) return;
    onSave(entry);
    flash('Simulação salva em "Salvas"');
  };

  // Histórico: registra a simulação quando o usuário para de editar por 2 s
  useEffect(() => {
    if (!touched || !result.ok) return;
    const t = setTimeout(() => {
      const entry = buildEntry();
      if (entry) onHistory(entry);
    }, 2000);
    return () => clearTimeout(t);
  }, [JSON.stringify(input)]);

  // Economia em relação à opção mais barata (à vista / sem juros / com juros)
  const cheapest =
    comparison && result.ok
      ? comparison.options.reduce((a, b) => (b.total < a.total ? b : a))
      : null;
  const savingVsCheapest = cheapest && result.ok ? Math.max(0, Math.round((result.totalPaid - cheapest.total) * 100) / 100) : 0;

  return (
    <View>
      {/* -------- forma de pagamento */}
      <Text style={styles.sectionTitle}>Forma de pagamento</Text>
      <View style={styles.modeGrid}>
        {MODES.map((m) => (
          <Pressable key={m.key} onPress={() => setMode(m.key)} style={[styles.modeBtn, mode === m.key && styles.modeBtnOn]}>
            <Feather name={m.icon} size={16} color={mode === m.key ? colors.white : brand.green} />
            <Text style={[styles.modeLabel, mode === m.key && { color: colors.white }]}>{m.label}</Text>
          </Pressable>
        ))}
      </View>

      {/* -------- dados */}
      <View style={styles.card}>
        <MoneyField label="Valor da compra" hook={price} />
        {needsInstallments && <MoneyField label="Valor da entrada (opcional)" hook={down} />}

        {needsInstallments && (
          <View style={styles.field}>
            <Text style={styles.label}>Número de parcelas</Text>
            <TextInput
              value={installments}
              onChangeText={(v) => setInstallments(v.replace(/\D/g, '').slice(0, 3))}
              keyboardType="number-pad"
              style={styles.input}
              placeholder="Ex: 10"
              placeholderTextColor={colors.gray400}
            />
            <View style={styles.quickRow}>
              {[3, 6, 10, 12, 24, 48].map((q) => (
                <Pressable key={q} onPress={() => setInstallments(String(q))} style={[styles.quick, installments === String(q) && styles.quickOn]}>
                  <Text style={[styles.quickText, installments === String(q) && { color: colors.white }]}>{q}x</Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {needsRate && (
          <>
            <View style={styles.field}>
              <Text style={styles.label}>Taxa de juros (%)</Text>
              <View style={styles.stack}>
                <TextInput
                  value={rate}
                  onChangeText={(v) => setRate(v.replace(/[^\d,.]/g, ''))}
                  keyboardType="decimal-pad"
                  style={styles.input}
                  placeholder="Ex: 2,5"
                  placeholderTextColor={colors.gray400}
                />
                <Segmented
                  full value={ratePeriod}
                  onChange={(v) => setRatePeriod(v as RatePeriod)}
                  options={[
                    ['mes', 'ao mês'],
                    ['ano', 'ao ano'],
                  ]}
                />
              </View>
            </View>

            {mode === 'com_juros' ? (
              <View style={styles.field}>
                <Text style={styles.label}>Tipo de juros</Text>
                <Segmented
                  full
                  value={interestType}
                  onChange={(v) => setInterestType(v as InterestType)}
                  options={[
                    ['simples', 'Simples'],
                    ['compostos', 'Compostos (Price)'],
                  ]}
                />
              </View>
            ) : (
              <View style={styles.field}>
                <Text style={styles.label}>Sistema de amortização</Text>
                <Segmented
                  full
                  value={amort}
                  onChange={(v) => setAmort(v as AmortSystem)}
                  options={[
                    ['price', 'Price (parcelas fixas)'],
                    ['sac', 'SAC (decrescentes)'],
                  ]}
                />
              </View>
            )}
          </>
        )}

        <Pressable onPress={() => setShowMore((s) => !s)} style={styles.moreToggle}>
          <Text style={styles.moreToggleText}>Tarifas, seguros e desconto à vista</Text>
          <Feather name={showMore ? 'chevron-up' : 'chevron-down'} size={16} color={brand.green} />
        </Pressable>
        {showMore && (
          <>
            <MoneyField label="Tarifas e seguros (total, se houver)" hook={fees} />
            <View style={styles.field}>
              <Text style={styles.label}>Desconto para pagar à vista (%)</Text>
              <TextInput
                value={discount}
                onChangeText={(v) => setDiscount(v.replace(/[^\d,.]/g, ''))}
                keyboardType="decimal-pad"
                style={styles.input}
                placeholder="0"
                placeholderTextColor={colors.gray400}
              />
            </View>
          </>
        )}
      </View>

      {/* -------- validação */}
      {touched && !result.ok && (
        <View style={styles.errorBox}>
          {result.errors.map((e) => (
            <View key={e} style={styles.errorRow}>
              <Feather name="alert-circle" size={14} color={colors.red600} />
              <Text style={styles.errorText}>{e}</Text>
            </View>
          ))}
        </View>
      )}
      {needsRate && Number.isNaN(rateNum) && touched && (
        <View style={styles.errorBox}>
          <View style={styles.errorRow}>
            <Feather name="alert-circle" size={14} color={colors.red600} />
            <Text style={styles.errorText}>Informe a taxa de juros (use 0 se não houver).</Text>
          </View>
        </View>
      )}

      {!touched && (
        <View style={styles.empty}>
          <Feather name="percent" size={26} color={brand.green} />
          <Text style={styles.emptyText}>Digite o valor da compra para ver o resultado.</Text>
        </View>
      )}

      {/* -------- resultado */}
      {touched && result.ok && (
        <>
          {result.warnings.map((w) => (
            <View key={w} style={styles.warnBox}>
              <Feather name="alert-triangle" size={14} color={colors.yellow600} />
              <Text style={styles.warnText}>{w}</Text>
            </View>
          ))}

          <LinearGradient colors={['#144146', '#153540', '#115e56', '#0c8a6d']} start={{ x: 0.3, y: 0 }} end={{ x: 0.7, y: 1 }} style={styles.resultCard}>
            <Text style={styles.resultLabel}>{mode === 'avista' ? 'Você paga' : result.parcelas > 0 ? 'Valor de cada parcela' : 'Total'}</Text>
            <Text style={styles.resultBig}>
              {mode === 'avista' || result.parcelas === 0
                ? formatCurrency(result.totalPaid)
                : `${result.parcelas}x ${formatCurrency(result.parcela)}`}
            </Text>
            {result.parcelas > 0 && result.ultimaParcela !== result.parcela && (
              <Text style={styles.resultSmall}>
                {mode === 'financiamento' && amort === 'sac'
                  ? `Parcelas diminuem até ${formatCurrency(result.ultimaParcela)}`
                  : `Última parcela: ${formatCurrency(result.ultimaParcela)} (ajuste de centavos)`}
              </Text>
            )}
            <View style={styles.resultGrid}>
              <ResultItem label="Valor da compra" value={formatCurrency(result.price)} />
              {mode === 'avista' ? (
                <ResultItem label="Desconto à vista" value={formatCurrency(result.cashDiscount)} />
              ) : (
                <ResultItem label="Entrada" value={formatCurrency(result.downPayment)} />
              )}
              {mode !== 'avista' && <ResultItem label="Valor parcelado" value={formatCurrency(result.financed)} />}
              <ResultItem label="Total pago" value={formatCurrency(result.totalPaid)} strong />
              <ResultItem label="Total de juros" value={formatCurrency(result.interest)} tone="red" />
              {cheapest && (
                <ResultItem
                  label={savingVsCheapest > 0 ? `Economia escolhendo ${cheapest.label.toLowerCase()}` : 'Economia possível'}
                  value={savingVsCheapest > 0 ? formatCurrency(savingVsCheapest) : 'Já é a mais barata'}
                  tone={savingVsCheapest > 0 ? 'green' : undefined}
                />
              )}
              {mode !== 'avista' && (
                <ResultItem label="Juros sobre o parcelado" value={pct(result.interestPctOfFinanced, 1)} tone="red" />
              )}
              {result.fees > 0 && <ResultItem label="Tarifas e seguros" value={formatCurrency(result.fees)} />}
            </View>
          </LinearGradient>

          {/* explicação simples */}
          <View style={styles.explain}>
            <Feather name="message-circle" size={16} color={brand.green} />
            <Text style={styles.explainText}>
              {result.interest > 0
                ? `Por causa dos juros, você vai pagar ${formatCurrency(result.interest)} a mais do que o valor parcelado — é como se a compra custasse ${formatCurrency(result.totalPaid)} em vez de ${formatCurrency(result.price)}.`
                : mode === 'avista' && result.cashDiscount > 0
                  ? `Pagando à vista você economiza ${formatCurrency(result.cashDiscount)}.`
                  : 'Nesta opção você não paga juros: o total é igual ao valor da compra.'}
            </Text>
          </View>

          {/* barra de composição do total */}
          {result.totalPaid > 0 && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Para onde vai o seu dinheiro</Text>
              <CompositionBar
                parts={[
                  { label: 'Valor do produto', value: Math.max(0, result.price - result.cashDiscount), color: brand.green },
                  { label: 'Juros', value: result.interest, color: colors.red500 },
                  { label: 'Tarifas', value: result.fees, color: colors.amber500 },
                ]}
              />
              {needsRate && rateNum > 0 && (
                <Text style={styles.rateInfo}>
                  {ratePeriod === 'ano'
                    ? `Taxa usada por mês: ${pct(result.monthlyRate * 100, 4)} ${
                        (mode === 'financiamento' || interestType === 'compostos')
                          ? '(equivalente composta — não é simplesmente a anual ÷ 12)'
                          : '(proporcional: anual ÷ 12)'
                      }.`
                    : `Equivale a ${pct(result.annualRate * 100)} ao ano ${
                        mode === 'financiamento' || interestType === 'compostos' ? '(taxa efetiva, com juros sobre juros)' : '(taxa nominal, proporcional)'
                      }.`}
                </Text>
              )}
            </View>
          )}

          {/* tabela de amortização */}
          {result.plan && result.plan.tabela.length > 0 && mode !== 'sem_juros' && (
            <View style={styles.card}>
              <Pressable onPress={() => setShowTable((s) => !s)} style={styles.tableHeader}>
                <Text style={styles.cardTitle}>
                  Parcela a parcela {mode === 'financiamento' ? (amort === 'sac' ? '(SAC)' : '(Tabela Price)') : interestType === 'compostos' ? '(Tabela Price)' : '(juros simples)'}
                </Text>
                <Feather name={showTable ? 'chevron-up' : 'chevron-down'} size={18} color={brand.green} />
              </Pressable>
              {showTable && <AmortTable rows={result.plan.tabela} />}
            </View>
          )}

          {/* comparação */}
          {comparison && needsInstallments && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Compare suas opções</Text>
              <Text style={styles.cardSub}>
                Mesma compra, mesma entrada e {input.installments}x
                {Number.isNaN(rateNum) ? '' : `, juros de ${pct(rateNum)} ${ratePeriod === 'mes' ? 'ao mês' : 'ao ano'}`}
              </Text>
              {(() => {
                const max = Math.max(...comparison.options.map((o) => o.total));
                return comparison.options.map((o) => {
                  const best = comparison.cheapest.includes(o.key);
                  return (
                    <View key={o.key} style={[styles.cmpRow, best && styles.cmpRowBest]}>
                      <View style={styles.cmpTop}>
                        <Text style={styles.cmpLabel}>{o.label}</Text>
                        {best && (
                          <View style={styles.bestBadge}>
                            <Text style={styles.bestBadgeText}>
                              {comparison.cheapest.length > 1 ? 'Menor custo (empate)' : 'Menor custo'}
                            </Text>
                          </View>
                        )}
                      </View>
                      <View style={styles.cmpTrack}>
                        <View style={[styles.cmpFill, { width: `${max > 0 ? (o.total / max) * 100 : 0}%`, backgroundColor: o.juros > 0 ? colors.red500 : brand.green }]} />
                      </View>
                      <View style={styles.cmpValues}>
                        <Text style={styles.cmpValue}>
                          {o.key === 'avista' ? '1x ' : `${o.parcelas}x `}
                          {formatCurrency(o.parcela)}
                        </Text>
                        <Text style={styles.cmpValue}>Total {formatCurrency(o.total)}</Text>
                        <Text style={[styles.cmpValue, { color: o.juros > 0 ? colors.red600 : blackAlpha(0.45) }]}>
                          Juros {formatCurrency(o.juros)}
                        </Text>
                      </View>
                    </View>
                  );
                });
              })()}
              <View style={styles.verdict}>
                <Feather name="award" size={16} color={brand.green} />
                <Text style={styles.verdictText}>
                  {comparison.cheapest.length === 3
                    ? 'As três opções são equivalentes em valor total.'
                    : comparison.cheapest.length === 2
                      ? `${comparison.options.filter((o) => comparison.cheapest.includes(o.key)).map((o) => o.label).join(' e ')} são equivalentes em valor total e custam ${formatCurrency(comparison.savingVsMostExpensive)} a menos que a opção mais cara.`
                      : `${comparison.options.find((o) => o.key === comparison.cheapest[0])!.label} é a opção mais barata: economia de ${formatCurrency(comparison.savingVsMostExpensive)} em relação à mais cara.`}
                </Text>
              </View>
            </View>
          )}

          <View style={styles.actions}>
            <ActionBtn icon="rotate-ccw" label="Limpar" onPress={clear} />
            <ActionBtn icon="bookmark" label="Salvar" onPress={save} />
            <ActionBtn icon="share-2" label="Compartilhar" onPress={share} primary />
          </View>
        </>
      )}

      {touched && !result.ok && (
        <View style={styles.actions}>
          <ActionBtn icon="rotate-ccw" label="Limpar" onPress={clear} />
        </View>
      )}

      {!!toast && (
        <View style={styles.toast}>
          <Feather name="check-circle" size={14} color={colors.white} />
          <Text style={styles.toastText}>{toast}</Text>
        </View>
      )}
    </View>
  );
}

// ================================================================= calculadora de juros
function InterestCalculator() {
  const capital = useAmountInput('1000,00');
  const [rate, setRate] = useState('2');
  const [ratePeriod, setRatePeriod] = useState<RatePeriod>('mes');
  const [time, setTime] = useState('12');
  const [timeUnit, setTimeUnit] = useState<'meses' | 'anos'>('meses');
  const [type, setType] = useState<InterestType>('compostos');
  const [openInfo, setOpenInfo] = useState<string | null>(null);

  const C = parseMoney(capital.value);
  const r = parseRate(rate);
  const t = parseFloat(time.replace(',', '.'));
  const errors: string[] = [];
  if (!(C > 0)) errors.push('Informe o capital (valor inicial).');
  if (Number.isNaN(r) || r < 0) errors.push('Informe uma taxa válida (0 ou mais).');
  if (!(t > 0)) errors.push('Informe o tempo (maior que zero).');
  if (t > 100 && timeUnit === 'anos') errors.push('Use no máximo 100 anos.');

  const ok = errors.length === 0;
  const res = ok ? calcInterest(C, r, ratePeriod, t, timeUnit, type) : null;
  const other = ok ? calcInterest(C, r, ratePeriod, t, timeUnit, type === 'simples' ? 'compostos' : 'simples') : null;

  // evolução em 5 pontos para o gráfico
  const points = ok
    ? [0.2, 0.4, 0.6, 0.8, 1].map((f) => ({
        f,
        s: calcInterest(C, r, ratePeriod, t * f, timeUnit, 'simples').montante,
        c: calcInterest(C, r, ratePeriod, t * f, timeUnit, 'compostos').montante,
      }))
    : [];
  const maxP = points.length ? Math.max(...points.map((p) => Math.max(p.s, p.c))) : 1;

  const info = [
    ['taxa', 'O que é taxa de juros?', 'É o "preço" do dinheiro no tempo: a porcentagem cobrada (ou recebida) a cada período, por exemplo 2% ao mês.'],
    ['simples', 'Juros simples', 'Os juros são calculados sempre sobre o valor inicial. Crescem em linha reta: J = C × i × t.'],
    ['compostos', 'Juros compostos', 'Os juros de cada período entram na conta do período seguinte ("juros sobre juros"). Crescem cada vez mais rápido: M = C × (1 + i)^t. É o modelo usado em cartões, empréstimos e financiamentos.'],
  ];

  return (
    <View>
      <View style={styles.card}>
        <Text style={styles.label}>Tipo de juros</Text>
        <Segmented
          full
          value={type}
          onChange={(v) => setType(v as InterestType)}
          options={[
            ['simples', 'Simples'],
            ['compostos', 'Compostos'],
          ]}
        />
        <View style={{ height: 14 }} />
        <MoneyField label="Capital (valor inicial)" hook={capital} />
        <View style={styles.field}>
          <Text style={styles.label}>Taxa de juros (%)</Text>
          <View style={styles.stack}>
            <TextInput value={rate} onChangeText={(v) => setRate(v.replace(/[^\d,.]/g, ''))} keyboardType="decimal-pad" style={styles.input} />
            <Segmented full value={ratePeriod} onChange={(v) => setRatePeriod(v as RatePeriod)} options={[['mes', 'ao mês'], ['ano', 'ao ano']]} />
          </View>
        </View>
        <View style={styles.field}>
          <Text style={styles.label}>Tempo</Text>
          <View style={styles.stack}>
            <TextInput value={time} onChangeText={(v) => setTime(v.replace(/[^\d,.]/g, ''))} keyboardType="decimal-pad" style={styles.input} />
            <Segmented full value={timeUnit} onChange={(v) => setTimeUnit(v as 'meses' | 'anos')} options={[['meses', 'meses'], ['anos', 'anos']]} />
          </View>
        </View>
      </View>

      {!ok && (
        <View style={styles.errorBox}>
          {errors.map((e) => (
            <View key={e} style={styles.errorRow}>
              <Feather name="alert-circle" size={14} color={colors.red600} />
              <Text style={styles.errorText}>{e}</Text>
            </View>
          ))}
        </View>
      )}

      {res && other && (
        <>
          <LinearGradient colors={['#144146', '#153540', '#115e56', '#0c8a6d']} start={{ x: 0.3, y: 0 }} end={{ x: 0.7, y: 1 }} style={styles.resultCard}>
            <Text style={styles.resultLabel}>Montante final ({type === 'simples' ? 'juros simples' : 'juros compostos'})</Text>
            <Text style={styles.resultBig}>{formatCurrency(res.montante)}</Text>
            <View style={styles.resultGrid}>
              <ResultItem label="Capital" value={formatCurrency(res.capital)} />
              <ResultItem label="Juros acumulados" value={formatCurrency(res.juros)} tone="red" />
              <ResultItem label="Taxa aplicada" value={`${pct(r)} ${ratePeriod === 'mes' ? 'ao mês' : 'ao ano'}`} />
              <ResultItem
                label="Tempo"
                value={`${time.replace('.', ',')} ${timeUnit}${ratePeriod === 'mes' && timeUnit === 'anos' ? ` (${res.periodos} meses)` : ratePeriod === 'ano' && timeUnit === 'meses' ? ` (${res.periodos.toFixed(2).replace('.', ',')} anos)` : ''}`}
              />
            </View>
          </LinearGradient>

          <View style={styles.explain}>
            <Feather name="message-circle" size={16} color={brand.green} />
            <Text style={styles.explainText}>
              {type === 'compostos'
                ? `Com juros compostos você acumula ${formatCurrency(res.juros)}. Em juros simples seriam ${formatCurrency(other.juros)} — diferença de ${formatCurrency(Math.abs(res.juros - other.juros))}.`
                : `Com juros simples você acumula ${formatCurrency(res.juros)}. Em juros compostos seriam ${formatCurrency(other.juros)} — diferença de ${formatCurrency(Math.abs(res.juros - other.juros))}.`}
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Simples × compostos ao longo do tempo</Text>
            <View style={styles.chart}>
              {points.map((p) => (
                <View key={p.f} style={styles.chartCol}>
                  <View style={styles.chartBars}>
                    <View style={[styles.chartBar, { height: `${(p.s / maxP) * 100}%`, backgroundColor: brand.blue }]} />
                    <View style={[styles.chartBar, { height: `${(p.c / maxP) * 100}%`, backgroundColor: brand.green }]} />
                  </View>
                  <Text style={styles.chartLabel}>
                    {+(t * p.f).toFixed(1)}
                    {timeUnit === 'meses' ? 'm' : 'a'}
                  </Text>
                </View>
              ))}
            </View>
            <View style={styles.legend}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: brand.blue }]} />
                <Text style={styles.legendText}>Simples</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: brand.green }]} />
                <Text style={styles.legendText}>Compostos</Text>
              </View>
            </View>
          </View>
        </>
      )}

      <Text style={styles.sectionTitle}>Entenda</Text>
      {info.map(([key, title, text]) => (
        <Pressable key={key} onPress={() => setOpenInfo(openInfo === key ? null : key)} style={styles.infoCard}>
          <View style={styles.infoTop}>
            <Text style={styles.infoTitle}>{title}</Text>
            <Feather name={openInfo === key ? 'chevron-up' : 'chevron-down'} size={16} color={blackAlpha(0.4)} />
          </View>
          {openInfo === key && <Text style={styles.infoText}>{text}</Text>}
        </Pressable>
      ))}
    </View>
  );
}

// ================================================================= salvas
function SavedList({
  items,
  history,
  onDelete,
  onLoad,
  onClearHistory,
  onSaveFromHistory,
}: {
  items: SavedSim[];
  history: SavedSim[];
  onDelete: (id: string) => void;
  onLoad: (s: SavedSim) => void;
  onClearHistory: () => void;
  onSaveFromHistory: (s: SavedSim) => void;
}) {
  const [selected, setSelected] = useState<string[]>([]);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const chosen = items.filter((s) => selected.includes(s.id));
  const minTotal = chosen.length ? Math.min(...chosen.map((c) => Math.round(c.total * 100))) : 0;

  const historyBlock = (
    <View style={{ marginTop: 18 }}>
      <View style={styles.histHeader}>
        <Text style={styles.sectionTitle}>Histórico recente</Text>
        {history.length > 0 && (
          <Pressable onPress={onClearHistory} hitSlop={8}>
            <Text style={[styles.savedLink, { color: blackAlpha(0.45) }]}>Limpar histórico</Text>
          </Pressable>
        )}
      </View>
      {history.length === 0 ? (
        <Text style={styles.cardSub}>As simulações que você fizer aparecem aqui automaticamente (últimas 10).</Text>
      ) : (
        history.map((h) => (
          <View key={h.id} style={styles.histItem}>
            <Feather name="clock" size={15} color={blackAlpha(0.35)} />
            <View style={{ flex: 1 }}>
              <Text style={styles.histTitle} numberOfLines={1}>
                {h.title}
              </Text>
              <Text style={styles.savedSub}>
                Total {formatCurrency(h.total)} • {new Date(h.createdAt).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>
            <Pressable onPress={() => onLoad(h)} hitSlop={6}>
              <Text style={styles.savedLink}>Abrir</Text>
            </Pressable>
            <Pressable onPress={() => onSaveFromHistory(h)} hitSlop={6} accessibilityLabel="Salvar do histórico">
              <Feather name="bookmark" size={16} color={brand.green} />
            </Pressable>
          </View>
        ))
      )}
    </View>
  );

  if (items.length === 0) {
    return (
      <View>
        <View style={styles.empty}>
          <Feather name="bookmark" size={26} color={brand.green} />
          <Text style={styles.emptyText}>Nenhuma simulação salva ainda. Na aba "Compra", toque em Salvar.</Text>
        </View>
        {historyBlock}
      </View>
    );
  }

  return (
    <View>
      <Text style={styles.sectionTitle}>Simulações salvas</Text>
      <Text style={styles.cardSub}>Marque duas ou mais simulações para comparar.</Text>
      {items.map((s) => {
        const on = selected.includes(s.id);
        return (
          <View key={s.id} style={[styles.savedItem, on && { borderColor: brand.green }]}>
            <Pressable
              onPress={() => setSelected((p) => (on ? p.filter((x) => x !== s.id) : [...p, s.id]))}
              style={[styles.check, on && styles.checkOn]}
              accessibilityLabel="Comparar"
            >
              {on && <Feather name="check" size={12} color={colors.white} />}
            </Pressable>
            <View style={{ flex: 1 }}>
              <Text style={styles.savedTitle}>{s.title}</Text>
              <Text style={styles.savedSub}>
                Total {formatCurrency(s.total)} • Juros {formatCurrency(s.juros)} •{' '}
                {new Date(s.createdAt).toLocaleDateString('pt-BR')}
              </Text>
              <View style={styles.savedActions}>
                <Pressable onPress={() => onLoad(s)} hitSlop={6}>
                  <Text style={styles.savedLink}>Abrir</Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    if (confirmId === s.id) {
                      onDelete(s.id);
                      setSelected((p) => p.filter((x) => x !== s.id));
                      setConfirmId(null);
                    } else setConfirmId(s.id);
                  }}
                  hitSlop={6}
                >
                  <Text style={[styles.savedLink, { color: colors.red600 }]}>
                    {confirmId === s.id ? 'Confirmar exclusão' : 'Excluir'}
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        );
      })}

      {chosen.length >= 2 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Comparando {chosen.length} propostas</Text>
          {chosen.map((c) => {
            const best = Math.round(c.total * 100) === minTotal;
            return (
              <View key={c.id} style={[styles.cmpRow, best && styles.cmpRowBest]}>
                <View style={styles.cmpTop}>
                  <Text style={[styles.cmpLabel, { flex: 1 }]} numberOfLines={2}>
                    {c.title}
                  </Text>
                  {best && (
                    <View style={styles.bestBadge}>
                      <Text style={styles.bestBadgeText}>Menor custo</Text>
                    </View>
                  )}
                </View>
                <View style={styles.cmpValues}>
                  <Text style={styles.cmpValue}>{c.parcelas > 0 ? `${c.parcelas}x ${formatCurrency(c.parcela)}` : 'À vista'}</Text>
                  <Text style={styles.cmpValue}>Total {formatCurrency(c.total)}</Text>
                  <Text style={[styles.cmpValue, { color: c.juros > 0 ? colors.red600 : blackAlpha(0.45) }]}>Juros {formatCurrency(c.juros)}</Text>
                </View>
              </View>
            );
          })}
        </View>
      )}
      {historyBlock}
    </View>
  );
}

// ================================================================= peças reutilizáveis
function MoneyField({ label, hook }: { label: string; hook: ReturnType<typeof useAmountInput> }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.moneyWrap}>
        <Text style={styles.moneyPrefix}>R$</Text>
        <TextInput
          value={hook.value}
          onChangeText={hook.handleChangeText}
          keyboardType="number-pad"
          selectTextOnFocus
          style={styles.moneyInput}
        />
      </View>
    </View>
  );
}

function Segmented({
  value,
  onChange,
  options,
  full,
}: {
  value: string;
  onChange: (v: string) => void;
  options: readonly (readonly [string, string])[];
  full?: boolean;
}) {
  return (
    <View style={[styles.seg, full && { alignSelf: 'stretch' }]}>
      {options.map(([k, l]) => (
        <Pressable key={k} onPress={() => onChange(k)} style={[styles.segBtn, full && { flex: 1 }, value === k && styles.segBtnOn]}>
          <Text style={[styles.segText, value === k && styles.segTextOn]} numberOfLines={1}>
            {l}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

function ResultItem({ label, value, strong, tone }: { label: string; value: string; strong?: boolean; tone?: 'red' | 'green' }) {
  return (
    <View style={styles.resultItem}>
      <Text style={styles.resultItemLabel}>{label}</Text>
      <Text style={[styles.resultItemValue, strong && { fontSize: 17 }, tone === 'red' && { color: '#fecaca' }, tone === 'green' && { color: '#bbf7d0' }]}>{value}</Text>
    </View>
  );
}

function CompositionBar({ parts }: { parts: { label: string; value: number; color: string }[] }) {
  const visible = parts.filter((p) => p.value > 0);
  const total = visible.reduce((s, p) => s + p.value, 0);
  if (total <= 0) return null;
  return (
    <View>
      <View style={styles.compBar}>
        {visible.map((p) => (
          <View key={p.label} style={{ flex: p.value / total, backgroundColor: p.color }} />
        ))}
      </View>
      <View style={styles.compLegend}>
        {visible.map((p) => (
          <View key={p.label} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: p.color }]} />
            <Text style={styles.legendText}>
              {p.label}: {formatCurrency(p.value)} ({pct((p.value / total) * 100, 1)})
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function AmortTable({ rows }: { rows: { n: number; parcela: number; juros: number; amortizacao: number; saldo: number }[] }) {
  const [all, setAll] = useState(false);
  const shown = all ? rows : rows.slice(0, 6);
  return (
    <View>
      <View style={[styles.tRow, styles.tHead]}>
        {['Nº', 'Parcela', 'Juros', 'Amortiz.', 'Saldo'].map((h, i) => (
          <Text key={h} style={[styles.tCell, i === 0 && styles.tCellN, styles.tHeadText]}>
            {h}
          </Text>
        ))}
      </View>
      {shown.map((r) => (
        <View key={r.n} style={styles.tRow}>
          <Text style={[styles.tCell, styles.tCellN]}>{r.n}</Text>
          <Text style={styles.tCell}>{formatCurrency(r.parcela).replace('R$ ', '')}</Text>
          <Text style={[styles.tCell, { color: colors.red600 }]}>{formatCurrency(r.juros).replace('R$ ', '')}</Text>
          <Text style={styles.tCell}>{formatCurrency(r.amortizacao).replace('R$ ', '')}</Text>
          <Text style={styles.tCell}>{formatCurrency(r.saldo).replace('R$ ', '')}</Text>
        </View>
      ))}
      {rows.length > 6 && (
        <Pressable onPress={() => setAll((a) => !a)} style={styles.tMore}>
          <Text style={styles.savedLink}>{all ? 'Mostrar menos' : `Ver todas as ${rows.length} parcelas`}</Text>
        </Pressable>
      )}
    </View>
  );
}

function ActionBtn({ icon, label, onPress, primary }: { icon: keyof typeof Feather.glyphMap; label: string; onPress: () => void; primary?: boolean }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.actionBtn, primary && styles.actionBtnPrimary, pressed && { opacity: 0.8 }]}>
      <Feather name={icon} size={16} color={primary ? colors.white : brand.green} />
      <Text style={[styles.actionLabel, primary && { color: colors.white }]}>{label}</Text>
    </Pressable>
  );
}

// ================================================================= estilos
const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: { paddingHorizontal: 16, paddingVertical: 24, paddingBottom: 48, maxWidth: 448, width: '100%', alignSelf: 'center' },
  header: { marginBottom: 20 },
  headerTitle: { color: colors.text, fontSize: 24 },
  headerSubtitle: { color: blackAlpha(0.6), fontSize: 14, marginTop: 4 },
  tabs: { flexDirection: 'row', backgroundColor: colors.white, borderRadius: radii.xl, padding: 4, borderWidth: 1, borderColor: colors.border, marginBottom: 18 },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 9 },
  tabOn: { backgroundColor: brand.green },
  tabLabel: { fontSize: 13, color: blackAlpha(0.6) },
  tabLabelOn: { color: colors.white, fontWeight: '600' },
  sectionTitle: { color: colors.text, fontSize: 14, fontWeight: '600', marginBottom: 10, marginTop: 4 },
  modeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  modeBtn: {
    flexGrow: 1,
    flexBasis: '45%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: radii.xl,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modeBtnOn: { backgroundColor: brand.green, borderColor: brand.green },
  modeLabel: { fontSize: 14, color: colors.text, fontWeight: '500' },
  card: { backgroundColor: colors.white, borderRadius: radii['2xl'], padding: 16, marginBottom: 14, borderWidth: 1, borderColor: colors.border, ...shadow.sm },
  cardTitle: { color: colors.text, fontSize: 15, fontWeight: '600', marginBottom: 4 },
  cardSub: { color: blackAlpha(0.5), fontSize: 12, marginBottom: 12 },
  field: { marginBottom: 14 },
  label: { fontSize: 13, color: blackAlpha(0.65), marginBottom: 6, fontWeight: '500' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  stack: { gap: 8 },
  input: {
    height: 46,
    borderRadius: radii.xl,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.gray50,
    paddingHorizontal: 14,
    fontSize: 15,
    color: colors.text,
  },
  moneyWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 50,
    borderRadius: radii.xl,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.gray50,
    paddingHorizontal: 14,
  },
  moneyPrefix: { fontSize: 16, color: brand.green, fontWeight: '700', marginRight: 6 },
  moneyInput: { flex: 1, minWidth: 0, fontSize: 18, color: colors.text, fontWeight: '600', height: '100%', ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : {}) },
  quickRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  quick: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: radii.full, backgroundColor: brand.greenSoft },
  quickOn: { backgroundColor: brand.green },
  quickText: { fontSize: 12, color: brand.green, fontWeight: '600' },
  seg: { flexDirection: 'row', backgroundColor: colors.gray100, borderRadius: radii.xl, padding: 3, flexShrink: 0 },
  segBtn: { paddingHorizontal: 10, paddingVertical: 9, borderRadius: 9, alignItems: 'center' },
  segBtnOn: { backgroundColor: colors.white, ...shadow.sm },
  segText: { fontSize: 13, color: blackAlpha(0.55) },
  segTextOn: { color: brand.green, fontWeight: '700' },
  moreToggle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 6 },
  moreToggleText: { color: brand.green, fontWeight: '600', fontSize: 13 },
  errorBox: { backgroundColor: colors.red50, borderRadius: radii.xl, padding: 12, gap: 6, marginBottom: 14, borderWidth: 1, borderColor: colors.red100 },
  errorRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  errorText: { flex: 1, color: colors.red700, fontSize: 13 },
  warnBox: { flexDirection: 'row', gap: 8, alignItems: 'center', backgroundColor: colors.yellow50, borderRadius: radii.xl, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: '#fde68a' },
  warnText: { flex: 1, color: '#854d0e', fontSize: 13 },
  empty: { alignItems: 'center', paddingVertical: 28, gap: 10 },
  emptyText: { color: blackAlpha(0.5), fontSize: 13, textAlign: 'center', paddingHorizontal: 20 },
  resultCard: { borderRadius: radii['3xl'], padding: 20, marginBottom: 12, ...shadow.lg },
  resultLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 13 },
  resultBig: { color: colors.white, fontSize: 32, fontWeight: '700', marginTop: 4 },
  resultSmall: { color: 'rgba(255,255,255,0.75)', fontSize: 12, marginTop: 2 },
  resultGrid: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 16, rowGap: 12 },
  resultItem: { width: '50%', paddingRight: 8 },
  resultItemLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 11 },
  resultItemValue: { color: colors.white, fontSize: 15, fontWeight: '600', marginTop: 2 },
  explain: { flexDirection: 'row', gap: 10, backgroundColor: brand.greenSoft, borderRadius: radii.xl, padding: 14, marginBottom: 14, borderWidth: 1, borderColor: brand.greenBorder },
  explainText: { flex: 1, color: colors.text, fontSize: 13, lineHeight: 19 },
  compBar: { flexDirection: 'row', height: 16, borderRadius: 8, overflow: 'hidden', marginTop: 10, backgroundColor: colors.gray100 },
  compLegend: { marginTop: 10, gap: 6 },
  legend: { flexDirection: 'row', justifyContent: 'center', gap: 20, marginTop: 10 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: 12, color: blackAlpha(0.65) },
  rateInfo: { fontSize: 12, color: blackAlpha(0.55), marginTop: 12, lineHeight: 17 },
  tableHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  tRow: { flexDirection: 'row', paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: colors.gray100 },
  tHead: { marginTop: 10 },
  tHeadText: { fontWeight: '700', color: blackAlpha(0.5) },
  tCell: { flex: 1, fontSize: 11, color: colors.text, textAlign: 'right' },
  tCellN: { flex: 0.5, textAlign: 'left' },
  tMore: { alignItems: 'center', paddingTop: 10 },
  cmpRow: { borderRadius: radii.xl, borderWidth: 1, borderColor: colors.border, padding: 12, marginBottom: 8 },
  cmpRowBest: { borderColor: brand.green, backgroundColor: brand.greenSoft },
  cmpTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  cmpLabel: { fontSize: 14, fontWeight: '600', color: colors.text },
  bestBadge: { backgroundColor: brand.green, paddingHorizontal: 8, paddingVertical: 3, borderRadius: radii.full },
  bestBadgeText: { color: colors.white, fontSize: 10, fontWeight: '700' },
  cmpTrack: { height: 8, backgroundColor: colors.gray100, borderRadius: 4, marginVertical: 8, overflow: 'hidden' },
  cmpFill: { height: '100%', borderRadius: 4 },
  cmpValues: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 6 },
  cmpValue: { fontSize: 12, color: blackAlpha(0.7) },
  verdict: { flexDirection: 'row', gap: 8, alignItems: 'flex-start', marginTop: 6 },
  verdictText: { flex: 1, fontSize: 13, color: colors.text, lineHeight: 19, fontWeight: '500' },
  actions: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 46,
    borderRadius: radii.xl,
    borderWidth: 1.5,
    borderColor: brand.greenBorder,
    backgroundColor: colors.white,
  },
  actionBtnPrimary: { backgroundColor: brand.green, borderColor: brand.green },
  actionLabel: { color: brand.green, fontWeight: '600', fontSize: 13 },
  toast: { flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'center', backgroundColor: colors.text, paddingHorizontal: 14, paddingVertical: 9, borderRadius: radii.full, marginBottom: 12 },
  toastText: { color: colors.white, fontSize: 12 },
  chart: { flexDirection: 'row', height: 140, alignItems: 'flex-end', justifyContent: 'space-around', marginTop: 12 },
  chartCol: { alignItems: 'center', flex: 1 },
  chartBars: { flexDirection: 'row', alignItems: 'flex-end', gap: 3, height: 120 },
  chartBar: { width: 12, borderTopLeftRadius: 3, borderTopRightRadius: 3 },
  chartLabel: { fontSize: 10, color: blackAlpha(0.5), marginTop: 4 },
  infoCard: { backgroundColor: colors.white, borderRadius: radii.xl, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: colors.border },
  infoTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  infoTitle: { fontSize: 14, fontWeight: '600', color: colors.text },
  infoText: { fontSize: 13, color: blackAlpha(0.65), marginTop: 8, lineHeight: 19 },
  savedItem: { flexDirection: 'row', gap: 12, backgroundColor: colors.white, borderRadius: radii.xl, padding: 14, marginBottom: 8, borderWidth: 1.5, borderColor: colors.border },
  check: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: colors.gray300, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  checkOn: { backgroundColor: brand.green, borderColor: brand.green },
  savedTitle: { fontSize: 14, fontWeight: '600', color: colors.text },
  histHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  histItem: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.white, borderRadius: radii.xl, paddingVertical: 10, paddingHorizontal: 12, marginBottom: 6, borderWidth: 1, borderColor: colors.border },
  histTitle: { fontSize: 13, fontWeight: '600', color: colors.text },
  savedSub: { fontSize: 12, color: blackAlpha(0.5), marginTop: 3 },
  savedActions: { flexDirection: 'row', gap: 18, marginTop: 8 },
  savedLink: { color: brand.green, fontWeight: '600', fontSize: 13 },
  disclaimer: { flexDirection: 'row', gap: 8, marginTop: 10, paddingHorizontal: 4 },
  disclaimerText: { flex: 1, fontSize: 11, color: blackAlpha(0.45), lineHeight: 16 },
});
