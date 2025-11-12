import { useEffect, useMemo, useRef, useState } from 'react'

function RiskBadge({ score }) {
  const { label, color } = useMemo(() => {
    if (score <= 20) return { label: 'Safe', color: 'bg-emerald-500' }
    if (score <= 50) return { label: 'Moderate Risk', color: 'bg-amber-500' }
    if (score <= 70) return { label: 'High Risk', color: 'bg-orange-600' }
    return { label: 'Extreme Risk', color: 'bg-red-600' }
  }, [score])
  return (
    <div className={`inline-flex items-center gap-2 ${color} text-white px-3 py-1.5 rounded-full text-sm`}> 
      <span className="w-2 h-2 bg-white/80 rounded-full"></span>
      <span>{label}</span>
      <span className="font-semibold">{score}</span>
    </div>
  )
}

function Graph({ address, transactions = [] }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const W = canvas.clientWidth
    const H = canvas.clientHeight
    canvas.width = W * window.devicePixelRatio
    canvas.height = H * window.devicePixelRatio
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio)

    ctx.clearRect(0, 0, W, H)

    // Build nodes
    const peers = new Set()
    transactions.forEach(tx => {
      if (tx.from_address !== address) peers.add(tx.from_address)
      if (tx.to_address !== address) peers.add(tx.to_address)
    })
    const peerList = Array.from(peers).slice(0, 14)

    // Positions: center for address, circle for peers
    const center = { x: W / 2, y: H / 2 }
    const radius = Math.min(W, H) / 2.4

    const positions = { [address]: center }
    peerList.forEach((p, i) => {
      const t = (i / peerList.length) * Math.PI * 2
      positions[p] = { x: center.x + radius * Math.cos(t), y: center.y + radius * Math.sin(t) }
    })

    // Draw edges
    ctx.strokeStyle = 'rgba(59,130,246,0.35)'
    ctx.lineWidth = 2
    transactions.slice(0, 40).forEach(tx => {
      const a = positions[tx.from_address] || center
      const b = positions[tx.to_address] || center
      ctx.beginPath()
      ctx.moveTo(a.x, a.y)
      ctx.lineTo(b.x, b.y)
      ctx.stroke()
    })

    // Draw nodes
    function node(x, y, r, fill, stroke) {
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2)
      ctx.fillStyle = fill; ctx.fill(); ctx.strokeStyle = stroke; ctx.lineWidth = 2; ctx.stroke()
    }

    node(center.x, center.y, 12, '#111827', '#60A5FA')

    peerList.forEach(p => {
      const { x, y } = positions[p]
      node(x, y, 8, '#0B1220', '#34D399')
    })

    // Labels
    ctx.fillStyle = '#93C5FD'
    ctx.font = '12px Inter, ui-sans-serif, system-ui'
    ctx.textAlign = 'center'
    ctx.fillText(address.length > 14 ? address.slice(0, 6) + '…' + address.slice(-4) : address, center.x, center.y - 16)
  }, [address, transactions])

  return (
    <div className="w-full h-72 rounded-xl overflow-hidden border border-white/10 bg-gradient-to-b from-black/20 to-black/40">
      <canvas ref={canvasRef} className="w-full h-full" />
    </div>
  )
}

function SplineHero() {
  // Load Spline viewer script dynamically (no index.html edits needed)
  useEffect(() => {
    const existing = document.querySelector('script[data-spline]')
    if (existing) return
    const s = document.createElement('script')
    s.src = 'https://unpkg.com/@splinetool/viewer@latest/build/spline-viewer.js'
    s.async = true
    s.setAttribute('data-spline', 'true')
    document.body.appendChild(s)
  }, [])

  return (
    <div className="relative w-full min-h-[56vh] md:min-h-[64vh] overflow-hidden bg-black">
      <div className="absolute inset-0">
        {/* eslint-disable-next-line react/no-unknown-property */}
        <spline-viewer url="https://prod.spline.design/44zrIZf-iQZhbQNQ/scene.splinecode" style={{ width: '100%', height: '100%' }}></spline-viewer>
      </div>
      <div className="relative z-10 mx-auto max-w-6xl px-6 md:px-10 py-16 md:py-24 text-center text-white">
        <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur px-3 py-1 rounded-full text-xs md:text-sm mb-4 border border-white/20">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
          Live Crypto Intelligence
        </div>
        <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight leading-tight">
          CryptoSleuth — Real‑Time Blockchain Forensics
        </h1>
        <p className="mt-4 text-white/80 max-w-2xl mx-auto">
          Trace transactions, detect mixers and darknet links, and get instant risk scores for wallets across chains.
        </p>
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
    </div>
  )
}

export default function App() {
  const [address, setAddress] = useState('')
  const [chain, setChain] = useState('ethereum')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [report, setReport] = useState(null)
  const baseUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'

  const trace = async () => {
    if (!address) return
    setLoading(true)
    setReport(null)
    try {
      const res = await fetch(`${baseUrl}/api/trace`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address, chain }),
      })
      const data = await res.json()
      setResult(data)
    } catch (e) {
      console.error(e)
      setResult({ error: e.message })
    } finally {
      setLoading(false)
    }
  }

  const generateReport = async () => {
    if (!address) return
    setLoading(true)
    try {
      const res = await fetch(`${baseUrl}/api/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address, chain }),
      })
      const data = await res.json()
      setReport(data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <SplineHero />

      <main className="mx-auto max-w-6xl px-6 md:px-10 -mt-20 relative z-20">
        <section className="bg-white/5 rounded-2xl border border-white/10 backdrop-blur p-6 md:p-8 shadow-xl">
          <div className="grid md:grid-cols-[1fr_auto_auto] gap-3 md:gap-4 items-end">
            <div>
              <label className="text-sm text-white/70">Wallet Address</label>
              <input
                value={address}
                onChange={e => setAddress(e.target.value)}
                placeholder="Paste a BTC/ETH address (e.g., 0xabc..., bc1...)"
                className="mt-1 w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono text-sm placeholder-white/40"
              />
            </div>
            <div>
              <label className="text-sm text-white/70">Chain</label>
              <select
                value={chain}
                onChange={e => setChain(e.target.value)}
                className="mt-1 w-full bg-black/40 border border-white/10 rounded-lg px-3 py-3 focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm"
              >
                <option value="bitcoin">Bitcoin</option>
                <option value="ethereum">Ethereum</option>
                <option value="tron">Tron</option>
                <option value="polygon">Polygon</option>
                <option value="bsc">BSC</option>
                <option value="litecoin">Litecoin</option>
              </select>
            </div>
            <div className="flex gap-2 md:gap-3">
              <button onClick={trace} disabled={loading}
                className="w-full md:w-auto bg-sky-500 hover:bg-sky-600 disabled:opacity-60 text-white font-semibold px-5 py-3 rounded-lg">
                {loading ? 'Tracing…' : 'Trace'}
              </button>
              <button onClick={generateReport} disabled={loading || !result}
                className="w-full md:w-auto bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60 text-white font-semibold px-5 py-3 rounded-lg">
                {loading ? 'Working…' : 'Generate Report'}
              </button>
            </div>
          </div>

          {result && !result.error && (
            <div className="mt-8 space-y-6">
              <div className="flex flex-wrap items-center gap-3 justify-between">
                <RiskBadge score={result.risk_score} />
                <div className="flex flex-wrap gap-2">
                  {(result.flags || []).map((f) => (
                    <span key={f} className="px-3 py-1 rounded-full text-xs bg-white/10 border border-white/10">
                      {f}
                    </span>
                  ))}
                </div>
              </div>

              <Graph address={result.address} transactions={result.transactions} />

              <div className="overflow-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="text-white/70">
                    <tr>
                      <th className="py-2 pr-4">TXID</th>
                      <th className="py-2 pr-4">From</th>
                      <th className="py-2 pr-4">To</th>
                      <th className="py-2 pr-4">Amount</th>
                      <th className="py-2 pr-4">Asset</th>
                      <th className="py-2 pr-4">Flags</th>
                      <th className="py-2 pr-4">Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(result.transactions || []).map((tx) => (
                      <tr key={tx.txid} className="border-t border-white/10">
                        <td className="py-2 pr-4 font-mono">
                          {tx.txid.length > 18 ? tx.txid.slice(0, 10) + '…' + tx.txid.slice(-5) : tx.txid}
                        </td>
                        <td className="py-2 pr-4 font-mono">{tx.from_address}</td>
                        <td className="py-2 pr-4 font-mono">{tx.to_address}</td>
                        <td className="py-2 pr-4">{tx.amount}</td>
                        <td className="py-2 pr-4">{tx.symbol}</td>
                        <td className="py-2 pr-4">
                          <div className="flex flex-wrap gap-1">
                            {(tx.flags || []).map(f => (
                              <span key={f} className="px-2 py-0.5 rounded bg-white/10 text-[11px]">{f}</span>
                            ))}
                          </div>
                        </td>
                        <td className="py-2 pr-4 text-white/70">{new Date(tx.timestamp).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {result?.error && (
            <p className="mt-6 text-red-400">{result.error}</p>
          )}

          {report && (
            <div className="mt-8 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm text-white/70">Automated Report</p>
                  <h3 className="text-lg font-semibold">{report.address} · {report.chain}</h3>
                  <p className="text-white/80 mt-1">{report.summary}</p>
                </div>
                <RiskBadge score={report.risk_score} />
              </div>
              <div className="mt-4 text-sm text-white/80">
                <p><span className="text-white/60">Recommendation:</span> {report.details?.recommendation}</p>
                <p className="text-white/60 mt-2">Generated at: {new Date(report.generated_at).toLocaleString()}</p>
              </div>
              <div className="mt-4 flex gap-2">
                <a
                  href={`data:application/json,${encodeURIComponent(JSON.stringify(report, null, 2))}`}
                  download={`cryptosleuth-${report.address}-report.json`}
                  className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg"
                >
                  Download JSON
                </a>
              </div>
            </div>
          )}
        </section>

        <section className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
            <h4 className="font-semibold">Darknet & Mixer Detection</h4>
            <p className="text-sm text-white/70 mt-1">Flags known darknet links, mixers like Tornado/Wasabi using threat intel feeds.</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
            <h4 className="font-semibold">Real‑Time Alerts</h4>
            <p className="text-sm text-white/70 mt-1">Subscribe to high‑risk mempool activity and large transfers with bot alerts.</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
            <h4 className="font-semibold">Compliance‑Ready Reports</h4>
            <p className="text-sm text-white/70 mt-1">Export evidence‑ready summaries for AML teams and law enforcement.</p>
          </div>
        </section>

        <footer className="py-10 text-center text-white/40 text-sm">© {new Date().getFullYear()} CryptoSleuth • MVP</footer>
      </main>
    </div>
  )
}
