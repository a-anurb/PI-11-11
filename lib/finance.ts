// =============================================================================
// MonY — Matemática financeira do Simulador
// -----------------------------------------------------------------------------
// Tudo em funções puras (sem tela), para poder testar com valores conhecidos.
// Os valores monetários das parcelas são calculados em CENTAVOS (inteiros), e a
// última parcela absorve a diferença de arredondamento — assim a soma bate
// exatamente com o total.
//
// Fórmulas:
//   Juros simples   J = C × i × t        M = C + J
//   Juros compostos M = C × (1 + i)^t    J = M − C
//   Tabela Price    PMT = C × i / (1 − (1 + i)^−n)      (i = 0 → PMT = C / n)
//   SAC             amortização constante A = C / n;  parcela_k = A + saldo_k × i
// =============================================================================

export type RatePeriod = 'mes' | 'ano';
export type InterestType = 'simples' | 'compostos';
export type PaymentMode = 'avista' | 'sem_juros' | 'com_juros' | 'financiamento';
export type AmortSystem = 'price' | 'sac';

const toCents = (v: number) => Math.round(v * 100);
const fromCents = (c: number) => c / 100;

/** Converte a taxa informada (em %) para taxa MENSAL decimal. */
export function monthlyRate(ratePercent: number, period: RatePeriod, type: InterestType): number {
  const r = ratePercent / 100;
  if (period === 'mes') return r;
  // taxa anual → mensal
  return type === 'compostos' ? Math.pow(1 + r, 1 / 12) - 1 : r / 12;
}

/** Taxa anual equivalente (efetiva, para compostos; proporcional, para simples). */
export function annualRate(monthly: number, type: InterestType): number {
  return type === 'compostos' ? Math.pow(1 + monthly, 12) - 1 : monthly * 12;
}

// ----------------------------------------------------------------- juros (valor único)
export interface InterestResult {
  capital: number;
  montante: number;
  juros: number;
  /** taxa por período usada no cálculo (decimal) */
  taxaPeriodo: number;
  /** quantidade de períodos da taxa */
  periodos: number;
}

/**
 * Juros sobre um valor único.
 * @param ratePercent taxa em %
 * @param ratePeriod período da taxa
 * @param time tempo
 * @param timeUnit unidade do tempo
 */
export function calcInterest(
  capital: number,
  ratePercent: number,
  ratePeriod: RatePeriod,
  time: number,
  timeUnit: 'meses' | 'anos',
  type: InterestType
): InterestResult {
  const i = ratePercent / 100;
  // tempo convertido para o MESMO período da taxa
  const t =
    ratePeriod === 'mes' ? (timeUnit === 'meses' ? time : time * 12) : timeUnit === 'anos' ? time : time / 12;
  const montante = type === 'simples' ? capital * (1 + i * t) : capital * Math.pow(1 + i, t);
  return {
    capital,
    montante: fromCents(toCents(montante)),
    juros: fromCents(toCents(montante) - toCents(capital)),
    taxaPeriodo: i,
    periodos: t,
  };
}

// ----------------------------------------------------------------- parcelamentos
export interface Installment {
  n: number;
  parcela: number;
  juros: number;
  amortizacao: number;
  saldo: number;
}

export interface PlanResult {
  /** parcela "típica" (primeira; no SAC as parcelas diminuem) */
  parcela: number;
  ultimaParcela: number;
  parcelas: number;
  totalParcelas: number;
  juros: number;
  tabela: Installment[];
}

/** Tabela Price (parcelas fixas, juros compostos). Cálculo em centavos. */
export function priceSchedule(principal: number, i: number, n: number): PlanResult {
  const P = toCents(principal);
  const pmtExact = i === 0 ? P / n : (P * i) / (1 - Math.pow(1 + i, -n));
  const pmt = Math.round(pmtExact);
  const tabela: Installment[] = [];
  let saldo = P;
  let total = 0;
  for (let k = 1; k <= n; k++) {
    const juros = Math.round(saldo * i);
    let parcela = pmt;
    let amort = parcela - juros;
    if (k === n) {
      // última parcela zera o saldo (absorve arredondamentos)
      amort = saldo;
      parcela = amort + juros;
    }
    saldo -= amort;
    total += parcela;
    tabela.push({ n: k, parcela: fromCents(parcela), juros: fromCents(juros), amortizacao: fromCents(amort), saldo: fromCents(saldo) });
  }
  return {
    parcela: tabela[0].parcela,
    ultimaParcela: tabela[n - 1].parcela,
    parcelas: n,
    totalParcelas: fromCents(total),
    juros: fromCents(total - P),
    tabela,
  };
}

/** SAC (amortização constante, parcelas decrescentes). Cálculo em centavos. */
export function sacSchedule(principal: number, i: number, n: number): PlanResult {
  const P = toCents(principal);
  const amortBase = Math.floor(P / n);
  const tabela: Installment[] = [];
  let saldo = P;
  let total = 0;
  for (let k = 1; k <= n; k++) {
    const juros = Math.round(saldo * i);
    const amort = k === n ? saldo : amortBase;
    const parcela = amort + juros;
    saldo -= amort;
    total += parcela;
    tabela.push({ n: k, parcela: fromCents(parcela), juros: fromCents(juros), amortizacao: fromCents(amort), saldo: fromCents(saldo) });
  }
  return {
    parcela: tabela[0].parcela,
    ultimaParcela: tabela[n - 1].parcela,
    parcelas: n,
    totalParcelas: fromCents(total),
    juros: fromCents(total - P),
    tabela,
  };
}

/** Juros simples sobre o valor parcelado, dividido em parcelas iguais. */
export function simpleInstallments(principal: number, i: number, n: number): PlanResult {
  const P = toCents(principal);
  const J = Math.round(P * i * n);
  const total = P + J;
  const base = Math.floor(total / n);
  const tabela: Installment[] = [];
  const jurosParcela = Math.floor(J / n);
  let saldo = P;
  for (let k = 1; k <= n; k++) {
    const parcela = k === n ? total - base * (n - 1) : base;
    const juros = k === n ? J - jurosParcela * (n - 1) : jurosParcela;
    const amort = parcela - juros;
    saldo -= amort;
    tabela.push({ n: k, parcela: fromCents(parcela), juros: fromCents(juros), amortizacao: fromCents(amort), saldo: fromCents(Math.max(0, saldo)) });
  }
  return {
    parcela: tabela[0].parcela,
    ultimaParcela: tabela[n - 1].parcela,
    parcelas: n,
    totalParcelas: fromCents(total),
    juros: fromCents(J),
    tabela,
  };
}

/** Parcelado sem juros: divide o valor em parcelas iguais (última ajusta centavos). */
export function noInterestInstallments(principal: number, n: number): PlanResult {
  return priceSchedule(principal, 0, n);
}

// ----------------------------------------------------------------- simulação completa
export interface SimInput {
  price: number; // valor da compra
  downPayment: number; // entrada
  installments: number; // nº de parcelas
  ratePercent: number; // taxa em %
  ratePeriod: RatePeriod;
  interestType: InterestType;
  mode: PaymentMode;
  amortSystem: AmortSystem; // só para financiamento
  fees: number; // tarifas/seguros informados pelo usuário (valor total)
  cashDiscountPercent: number; // desconto para pagamento à vista
}

export interface SimResult {
  ok: true;
  mode: PaymentMode;
  price: number;
  downPayment: number;
  financed: number;
  parcela: number;
  ultimaParcela: number;
  parcelas: number;
  totalPaid: number;
  interest: number;
  fees: number;
  interestPctOfFinanced: number;
  monthlyRate: number;
  annualRate: number;
  plan: PlanResult | null;
  cashDiscount: number;
  warnings: string[];
}

export type SimOutcome = SimResult | { ok: false; errors: string[] };

export function validate(input: SimInput): string[] {
  const e: string[] = [];
  if (!(input.price > 0)) e.push('Informe o valor da compra.');
  if (input.downPayment < 0) e.push('A entrada não pode ser negativa.');
  if (input.price > 0 && input.downPayment > input.price) e.push('A entrada não pode ser maior que o valor da compra.');
  if (input.mode !== 'avista') {
    if (!Number.isInteger(input.installments) || input.installments < 1) e.push('Informe um número de parcelas válido (1 ou mais).');
    if (input.installments > 480) e.push('O número máximo de parcelas é 480.');
  }
  if ((input.mode === 'com_juros' || input.mode === 'financiamento') && (input.ratePercent < 0 || !Number.isFinite(input.ratePercent))) {
    e.push('A taxa de juros não pode ser negativa.');
  }
  if (input.fees < 0) e.push('As tarifas não podem ser negativas.');
  if (input.cashDiscountPercent < 0 || input.cashDiscountPercent >= 100) e.push('O desconto à vista deve ficar entre 0% e 99%.');
  return e;
}

export function simulate(input: SimInput): SimOutcome {
  const errors = validate(input);
  if (errors.length) return { ok: false, errors };

  const warnings: string[] = [];
  const i = monthlyRate(input.ratePercent, input.ratePeriod, input.mode === 'financiamento' ? 'compostos' : input.interestType);
  const iType: InterestType = input.mode === 'financiamento' ? 'compostos' : input.interestType;
  const financed = fromCents(toCents(input.price) - toCents(input.downPayment));
  const n = input.installments;

  if (input.ratePercent > 0 && i > 0.15) warnings.push('Taxa muito alta (acima de 15% ao mês). Confira se digitou corretamente.');

  let plan: PlanResult | null = null;
  let cashDiscount = 0;

  if (input.mode === 'avista') {
    cashDiscount = fromCents(Math.round(toCents(input.price) * (input.cashDiscountPercent / 100)));
  } else if (financed <= 0) {
    warnings.push('A entrada cobre todo o valor: não há nada a parcelar.');
  } else if (input.mode === 'sem_juros') {
    plan = noInterestInstallments(financed, n);
  } else if (input.mode === 'com_juros') {
    if (input.ratePercent === 0) warnings.push('Com taxa 0%, o parcelamento com juros equivale ao parcelamento sem juros.');
    plan = iType === 'simples' ? simpleInstallments(financed, i, n) : priceSchedule(financed, i, n);
  } else {
    if (input.ratePercent === 0) warnings.push('Com taxa 0%, o financiamento não tem custo de juros.');
    plan = input.amortSystem === 'sac' ? sacSchedule(financed, i, n) : priceSchedule(financed, i, n);
  }

  const interest = plan ? plan.juros : 0;
  const totalPaid =
    input.mode === 'avista'
      ? fromCents(toCents(input.price) - toCents(cashDiscount) + toCents(input.fees))
      : fromCents(toCents(input.downPayment) + toCents(plan ? plan.totalParcelas : 0) + toCents(input.fees));

  return {
    ok: true,
    mode: input.mode,
    price: input.price,
    downPayment: input.mode === 'avista' ? 0 : input.downPayment,
    financed: input.mode === 'avista' ? 0 : Math.max(0, financed),
    parcela: plan ? plan.parcela : 0,
    ultimaParcela: plan ? plan.ultimaParcela : 0,
    parcelas: plan ? plan.parcelas : 0,
    totalPaid,
    interest,
    fees: input.fees,
    interestPctOfFinanced: plan && financed > 0 ? (interest / financed) * 100 : 0,
    monthlyRate: i,
    annualRate: annualRate(i, iType),
    plan,
    cashDiscount,
    warnings,
  };
}

// ----------------------------------------------------------------- comparação
export interface CompareOption {
  key: 'avista' | 'sem_juros' | 'com_juros';
  label: string;
  parcela: number;
  parcelas: number;
  total: number;
  juros: number;
}

export interface CompareResult {
  options: CompareOption[];
  cheapest: CompareOption['key'][]; // mais de um = equivalentes
  savingVsMostExpensive: number;
}

/** Compara à vista × sem juros × com juros para a mesma compra (mesma entrada e nº de parcelas). */
export function compareOptions(input: SimInput): CompareResult | null {
  const base = { ...input };
  if (!(base.price > 0) || base.downPayment > base.price || base.installments < 1) return null;
  const av = simulate({ ...base, mode: 'avista' });
  const sj = simulate({ ...base, mode: 'sem_juros' });
  const cj = simulate({ ...base, mode: 'com_juros' });
  if (!av.ok || !sj.ok || !cj.ok) return null;
  const options: CompareOption[] = [
    { key: 'avista', label: 'À vista', parcela: av.totalPaid, parcelas: 1, total: av.totalPaid, juros: 0 },
    { key: 'sem_juros', label: 'Parcelado sem juros', parcela: sj.parcela, parcelas: sj.parcelas, total: sj.totalPaid, juros: sj.interest },
    { key: 'com_juros', label: 'Parcelado com juros', parcela: cj.parcela, parcelas: cj.parcelas, total: cj.totalPaid, juros: cj.interest },
  ];
  const minC = Math.min(...options.map((o) => toCents(o.total)));
  const maxC = Math.max(...options.map((o) => toCents(o.total)));
  return {
    options,
    cheapest: options.filter((o) => toCents(o.total) === minC).map((o) => o.key),
    savingVsMostExpensive: fromCents(maxC - minC),
  };
}
