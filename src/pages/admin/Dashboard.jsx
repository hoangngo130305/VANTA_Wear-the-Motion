import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { listAllOrders } from '../../api/orders.js';
import { listCustomers } from '../../api/auth.js';
import { useCatalog } from '../../context/CatalogContext.jsx';
import { useData } from '../../components/admin/useData.js';
import { PageHead } from '../../components/admin/AdminLayout.jsx';
import { fmtDate } from '../../components/OrderParts.jsx';
import { Spinner } from '../../components/ui/index.jsx';
import { money } from '../../lib/utils.js';
import { thumb } from '../../data/catalog.js';
import { pName } from '../../i18n/helpers.js';
import { totalStock } from '../../api/products.js';
import { t } from '../../i18n/index.js';

const DAY = 86400000;
const startOfDay = t => { const d = new Date(t); d.setHours(0, 0, 0, 0); return d.getTime(); };
const counts = o => !['cancelled', 'returned'].includes(o.status);

function Delta({ cur, prev }) {
  if (!prev) return <em className="delta">{t("new")}</em>;
  const pct = Math.round((cur - prev) / prev * 100);
  return <em className={'delta ' + (pct >= 0 ? 'up' : 'down')}>{pct >= 0 ? '▲' : '▼'} {Math.abs(pct)}%</em>;
}

function RevenueChart({ days }) {
  const [hover, setHover] = useState(null);
  const W = 720, H = 220, P = { l: 44, r: 8, t: 14, b: 26 };
  const max = Math.max(10, ...days.map(d => d.revenue));
  const nice = Math.ceil(max / 100) * 100;
  const bw = (W - P.l - P.r) / days.length;
  const y = v => P.t + (H - P.t - P.b) * (1 - v / nice);
  return (
    <div className="chart">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={t("Revenue by day")} onMouseLeave={() => setHover(null)}>
        {[0, .25, .5, .75, 1].map(f => <g key={f}><line x1={P.l} x2={W - P.r} y1={y(nice * f)} y2={y(nice * f)} className="grid" /><text x={P.l - 8} y={y(nice * f) + 4} textAnchor="end">{money(Math.round(nice * f))}</text></g>)}
        {days.map((d, i) => {
          const h = Math.max(1, H - P.b - y(d.revenue));
          return (
            <g key={d.t} onMouseEnter={() => setHover(i)}>
              <rect x={P.l + i * bw} y={P.t} width={bw} height={H - P.t - P.b} fill="transparent" />
              <rect className={'bar' + (hover === i ? ' hot' : '')} x={P.l + i * bw + bw * .16} width={bw * .68} y={H - P.b - h} height={h} rx="3" style={{ '--i': i }} />
              {(days.length <= 10 || i % Math.ceil(days.length / 8) === 0) && <text x={P.l + i * bw + bw / 2} y={H - 8} textAnchor="middle">{new Date(d.t).getDate()}/{new Date(d.t).getMonth() + 1}</text>}
            </g>
          );
        })}
      </svg>
      {hover !== null && <div className="chart__tip" style={{ left: `${(P.l + hover * bw + bw / 2) / W * 100}%` }}><b>{money(days[hover].revenue)}</b><small>{days[hover].orders === 1 ? t('1 order') : t('{n} orders', { n: days[hover].orders })} · {fmtDate(days[hover].t)}</small></div>}
    </div>
  );
}

export default function Dashboard() {
  const { products } = useCatalog();
  const [range, setRange] = useState(14);
  const orders = useData(listAllOrders);
  const customers = useData(listCustomers);

  const stats = useMemo(() => {
    if (!orders.data) return null;
    const now = Date.now(), from = startOfDay(now - (range - 1) * DAY), prevFrom = from - range * DAY;
    const cur = orders.data.filter(o => o.createdAt >= from && counts(o));
    const prev = orders.data.filter(o => o.createdAt >= prevFrom && o.createdAt < from && counts(o));
    const sum = l => l.reduce((a, o) => a + o.total, 0);
    const days = Array.from({ length: range }, (_, i) => {
      const t = startOfDay(now - (range - 1 - i) * DAY);
      const l = cur.filter(o => startOfDay(o.createdAt) === t);
      return { t, revenue: sum(l), orders: l.length };
    });
    const sold = {};
    cur.forEach(o => o.items.forEach(i => { sold[i.productId] = (sold[i.productId] || 0) + i.qty; }));
    const top = Object.entries(sold).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([id, q]) => ({ p: products.find(x => x.id === id), q })).filter(x => x.p);
    const byStatus = ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'returned'].map(s => ({ s, n: orders.data.filter(o => o.status === s).length }));
    const newCust = (customers.data || []).filter(c => c.createdAt >= from).length;
    const newCustPrev = (customers.data || []).filter(c => c.createdAt >= prevFrom && c.createdAt < from).length;
    return { rev: sum(cur), prevRev: sum(prev), n: cur.length, prevN: prev.length, aov: cur.length ? sum(cur) / cur.length : 0, prevAov: prev.length ? sum(prev) / prev.length : 0, days, top, byStatus, newCust, newCustPrev };
  }, [orders.data, customers.data, range, products]);

  const low = products.map(p => ({ p, n: totalStock(p) })).filter(x => x.n <= 8).sort((a, b) => a.n - b.n).slice(0, 6);
  const needs = orders.data ? orders.data.filter(o => o.status === 'pending').length : 0;

  return (
    <>
      <PageHead title={t("Dashboard")} sub={t("How the store is doing.")} actions={
        <div className="seg" role="tablist" aria-label={t("Range")}>{[7, 14, 30].map(d => <button key={d} type="button" role="tab" aria-selected={range === d} className={range === d ? 'on' : ''} onClick={() => setRange(d)}>{d}d</button>)}</div>
      } />
      {!stats ? <Spinner /> : (
        <>
          <div className="kpis">
            <div><small>{t("Revenue")}</small><b>{money(stats.rev)}</b><Delta cur={stats.rev} prev={stats.prevRev} /></div>
            <div><small>{t("Orders")}</small><b>{stats.n}</b><Delta cur={stats.n} prev={stats.prevN} /></div>
            <div><small>{t("Avg. order value")}</small><b>{money(Math.round(stats.aov * 100) / 100)}</b><Delta cur={stats.aov} prev={stats.prevAov} /></div>
            <div><small>{t("New customers")}</small><b>{stats.newCust}</b><Delta cur={stats.newCust} prev={stats.newCustPrev} /></div>
          </div>

          {needs > 0 && <p className="notice">⚡ {needs === 1 ? t('1 order waiting to be processed.') : t('{n} orders waiting to be processed.', { n: needs })} <Link to="/admin/orders?status=pending">{t('Review now')}</Link></p>}

          <div className="adm__cols">
            <section className="card-a"><h2>{t("Revenue")}</h2><RevenueChart days={stats.days} /></section>
            <section className="card-a"><h2>{t("Orders by status")}</h2>
              <ul className="hbars">{stats.byStatus.map(x => <li key={x.s}><span>{t(x.s)}</span><i><u style={{ width: x.n / Math.max(1, ...stats.byStatus.map(y => y.n)) * 100 + '%' }} /></i><b>{x.n}</b></li>)}</ul>
            </section>
          </div>

          <div className="adm__cols adm__cols--3">
            <section className="card-a"><h2>{t("Top products")}</h2>
              {stats.top.length === 0 ? <p className="muted">{t("No sales in this range.")}</p> : <ul className="mini">{stats.top.map(({ p, q }) => <li key={p.id}><img src={thumb(p)} alt="" /><span>{pName(p)}</span><b>{t('{n} sold', { n: q })}</b></li>)}</ul>}
            </section>
            <section className="card-a"><h2>{t("Low stock")}</h2>
              {low.length === 0 ? <p className="muted">{t("All stocked up.")}</p> : <ul className="mini">{low.map(({ p, n }) => <li key={p.id}><img src={thumb(p)} alt="" /><span>{pName(p)}</span><b className={n === 0 ? 'bad' : 'warn'}>{n === 0 ? t('Sold out') : t('{n} left', { n })}</b></li>)}</ul>}
              <Link className="link" to="/admin/products"><span>{t("Manage stock")}</span></Link>
            </section>
            <section className="card-a"><h2>{t("Recent orders")}</h2>
              <ul className="mini mini--orders">{orders.data.slice(0, 6).map(o => <li key={o.id}><Link to={`/admin/orders/${o.id}`}><b>{o.id}</b><span>{o.customerName}</span><em>{money(o.total)}</em></Link></li>)}</ul>
            </section>
          </div>
        </>
      )}
    </>
  );
}
