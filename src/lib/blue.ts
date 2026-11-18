/**
 * The Blue Sheet's "Project Totals" block, formula for formula (BLUE SHEET MASTER - PROFIT MARGINS.xlsx):
 *   Merlin AI   = L30 × TM                (1% of the TinyMod wholesale price on the master)
 *   Subtotal    = Sales tax + Modular + Project services            (K44 = SUM(K34:K43))
 *   Tariff      = TM × tariff %                                     (K45 = G29 × L45)
 *   Margin      = margin % × Subtotal                               (K46 = L46 × K44)
 *   One-off     = Margin × one-off %                                (K47 = K46 × L47)
 *   Retail      = Subtotal + Tariff + Margin + One-off              (K48 = SUM(K44:K47))
 *   TinyMod net = Margin + One-off + Frame return credit            (K50 = K46 + K47 + K49)
 * Site sections (land, foundation, utilities, garage, finish) are left out: Eric and Kevin said on
 * 30 Jul they live on the customer's budget, not here.
 */
export interface Service {
  id: string
  name: string
  payee: string
  mode: 'fixed' | 'pctTM'
  value: number
}

export interface Blue {
  wholesale: number   // "TM" — the TinyMod wholesale price from the factory quote
  uniFrame: number
  services: Service[]
  salesTax: number
  tariffPct: number
  marginPct: number
  oneOffPct: number
  frameCredit: number
}

export function serviceAmount(b: Blue, s: Service) {
  return s.mode === 'fixed' ? s.value : s.value * b.wholesale
}

export function calcBlue(b: Blue) {
  const modular = b.wholesale + b.uniFrame
  const services = b.services.reduce((a, s) => a + serviceAmount(b, s), 0)
  const subtotal = b.salesTax + modular + services
  const tariff = b.wholesale * b.tariffPct
  const margin = b.marginPct * subtotal
  const oneOff = margin * b.oneOffPct
  const retail = subtotal + tariff + margin + oneOff
  const net = margin + oneOff + b.frameCredit
  return { modular, services, subtotal, tariff, margin, oneOff, retail, net }
}

/** Margin % that makes retail land exactly on the signed order form. */
export function solveMargin(b: Blue, targetRetail: number) {
  const r = calcBlue({ ...b, marginPct: 0 })
  if (r.subtotal <= 0) return b.marginPct
  return (targetRetail - r.subtotal - r.tariff) / (r.subtotal * (1 + b.oneOffPct))
}
