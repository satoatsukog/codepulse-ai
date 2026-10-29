'use client'

import { useState } from 'react'
import {
    AlertTriangle,
    Check,
    CheckCircle2,
    ChevronDown,
    Clipboard,
    Code2,
    Download,
    FileCode2,
    GitBranch,
    Lightbulb,
    Menu,
    Play,
    ShieldCheck,
    Sparkles,
    Zap,
} from 'lucide-react'

interface Finding {
    type: string
    title: string
    text: string
    line: string
    color: 'amber' | 'blue'
}

interface ReviewResult {
    score: number
    issuesCount: number
    suggestionsCount: number
    reviewTime: string
    findings: Finding[]
    suggestedRefactor: string
}

const initialFindings: Finding[] = [
    { type: 'warning', title: 'Missing input validation', text: 'userId is passed directly to getUser without checking its format.', line: 'Line 3', color: 'amber' },
    { type: 'suggestion', title: 'Use a typed return value', text: 'Add a return type to improve readability and catch future regressions.', line: 'Line 3', color: 'blue' },
    { type: 'suggestion', title: 'Consider response caching', text: 'Profile data could be cached to reduce repeated auth lookups.', line: 'Line 4', color: 'blue' },
]

function Badge({ children, tone = 'neutral' }: { children: React.ReactNode; tone?: 'green' | 'amber' | 'blue' | 'neutral' }) {
    const tones = { green: 'border-emerald-500/25 bg-emerald-500/10 text-emerald-400', amber: 'border-amber-500/25 bg-amber-500/10 text-amber-400', blue: 'border-sky-500/25 bg-sky-500/10 text-sky-400', neutral: 'border-white/10 bg-white/[0.04] text-slate-300' }
    return <span className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-[11px] font-medium ${tones[tone]}`}>{children}</span>
}

function Inspector() {
    const [language, setLanguage] = useState('TypeScript')
    const [code, setCode] = useState(`import { getUser } from './auth';

export async function getProfile(userId) {
  const user = await getUser(userId);
  if (!user) return null;

  return {
    id: user.id,
    name: user.name,
    email: user.email,
  };
}`)

    const [loading, setLoading] = useState(false)
    const [copied, setCopied] = useState(false)

    const [result, setResult] = useState<ReviewResult>({
        score: 85,
        issuesCount: 3,
        suggestionsCount: 2,
        reviewTime: '1.2s',
        findings: initialFindings,
        suggestedRefactor: `export async function getProfile(userId: string): Promise<User | null> {\n  if (!userId) return null;\n  return getUser(userId);\n}`
    })

    const runAudit = async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/review', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code, language }),
            })
            if (res.ok) {
                const data = await res.json()
                setResult(data)
            } else {
                alert('Ошибка при анализе кода. Проверьте ваш GEMINI_API_KEY в .env.local')
            }
        } catch (err) {
            console.error(err)
            alert('Не удалось связаться с бэкендом.')
        } finally {
            setLoading(false)
        }
    }

    const copyCode = async () => {
        await navigator.clipboard?.writeText(result.suggestedRefactor)
        setCopied(true)
        window.setTimeout(() => setCopied(false), 1600)
    }

    return (
        <div className="grid gap-5 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
            <section className="rounded-xl border border-white/10 bg-[#161b22] p-5 shadow-2xl shadow-black/10">
                <div className="mb-5 flex items-start justify-between">
                    <div>
                        <h2 className="text-sm font-semibold text-white">Code input</h2>
                        <p className="mt-1 text-xs text-slate-500">Paste a file to start your review</p>
                    </div>
                    <Badge tone="neutral"><Code2 className="size-3" /> {language}</Badge>
                </div>

                <label className="mb-2 block text-xs font-medium text-slate-400" htmlFor="language">Language</label>
                <div className="relative mb-5">
                    <select
                        id="language"
                        value={language}
                        onChange={(e) => setLanguage(e.target.value)}
                        className="w-full appearance-none rounded-lg border border-white/10 bg-[#0d1117] px-3 py-2.5 text-sm text-slate-200 outline-none focus:border-sky-500/60"
                    >
                        <option>TypeScript</option>
                        <option>JavaScript</option>
                        <option>Python</option>
                        <option>C#</option>
                        <option>React</option>
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-3 size-4 text-slate-500" />
                </div>

                <div className="overflow-hidden rounded-lg border border-white/10 bg-[#0b1016] shadow-inner">
                    <div className="flex items-center gap-2 border-b border-white/10 bg-[#131a22] px-4 py-2.5">
                        <span className="size-2.5 rounded-full bg-[#ff5f57]" />
                        <span className="size-2.5 rounded-full bg-[#febc2e]" />
                        <span className="size-2.5 rounded-full bg-[#28c840]" />
                        <span className="ml-3 flex items-center gap-1.5 text-[11px] text-slate-500">
              <FileCode2 className="size-3.5" /> main.{language === 'Python' ? 'py' : language === 'C#' ? 'cs' : 'ts'}
            </span>
                    </div>
                    <textarea
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        placeholder="Вставьте ваш код для проверки..."
                        className="w-full h-[280px] resize-none bg-transparent p-4 font-mono text-[12px] leading-6 text-slate-300 outline-none selection:bg-sky-500/30"
                        spellCheck="false"
                    />
                </div>

                <button
                    onClick={runAudit}
                    disabled={loading}
                    className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-sky-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-sky-400 disabled:cursor-wait disabled:opacity-70"
                >
                    {loading ? (
                        <><span className="size-4 animate-spin rounded-full border-2 border-slate-950/30 border-t-slate-950" /> Reviewing with AI...</>
                    ) : (
                        <><Play className="size-4 fill-current" /> Audit &amp; Review Code</>
                    )}
                </button>
            </section>

            <section className="flex flex-col gap-5">
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                    <div className="col-span-2 rounded-xl border border-white/10 bg-[#161b22] p-4">
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-slate-500">Overall health score</span>
                            <ShieldCheck className="size-4 text-emerald-400" />
                        </div>
                        <div className="mt-2 flex items-end gap-2">
                            <span className="text-3xl font-semibold tracking-tight text-white">{result.score}</span>
                            <span className="mb-1 text-sm text-slate-500">/ 100</span>
                        </div>
                        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
                            <div
                                className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-sky-400 transition-all duration-500"
                                style={{ width: `${result.score}%` }}
                            />
                        </div>
                    </div>

                    <div className="rounded-xl border border-white/10 bg-[#161b22] p-4">
                        <span className="text-xs text-slate-500">Issues found</span>
                        <p className="mt-2 text-2xl font-semibold text-white">{result.issuesCount}</p>
                        <span className="text-[11px] text-amber-400">{result.suggestionsCount} suggestions</span>
                    </div>

                    <div className="rounded-xl border border-white/10 bg-[#161b22] p-4">
                        <span className="text-xs text-slate-500">Review time</span>
                        <p className="mt-2 text-2xl font-semibold text-white">{result.reviewTime}</p>
                        <span className="text-[11px] text-emerald-400">Fast review</span>
                    </div>
                </div>

                <div className="rounded-xl border border-white/10 bg-[#161b22] p-5">
                    <div className="mb-4 flex items-center justify-between">
                        <div>
                            <h2 className="text-sm font-semibold text-white">Review findings</h2>
                            <p className="mt-1 text-xs text-slate-500">Actionable feedback from your code audit</p>
                        </div>
                        <div className="flex gap-2">
                            <Badge tone="green"><CheckCircle2 className="size-3" /> Safe</Badge>
                            <Badge tone="amber">{result.issuesCount} issues</Badge>
                        </div>
                    </div>

                    <div className="flex flex-col divide-y divide-white/[0.07]">
                        {result.findings.map((item, idx) => {
                            const Icon = item.color === 'amber' ? AlertTriangle : Lightbulb
                            return (
                                <div key={idx} className="flex gap-3 py-3.5 first:pt-0 last:pb-0">
                                    <div className={`mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md ${item.color === 'amber' ? 'bg-amber-500/10 text-amber-400' : 'bg-sky-500/10 text-sky-400'}`}>
                                        <Icon className="size-4" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center justify-between gap-3">
                                            <h3 className="text-xs font-medium text-slate-200">{item.title}</h3>
                                            <span className="shrink-0 font-mono text-[10px] text-slate-600">{item.line}</span>
                                        </div>
                                        <p className="mt-1 text-xs leading-5 text-slate-500">{item.text}</p>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>

                <div className="rounded-xl border border-white/10 bg-[#161b22] p-5">
                    <div className="mb-3 flex items-center justify-between">
                        <div>
                            <h2 className="text-sm font-semibold text-white">Suggested refactor</h2>
                            <p className="mt-1 text-xs text-slate-500">A safer, more explicit implementation</p>
                        </div>
                        <button onClick={copyCode} className="flex items-center gap-1.5 rounded-md border border-white/10 px-2.5 py-1.5 text-[11px] font-medium text-slate-300 transition hover:bg-white/[0.06]">
                            {copied ? <Check className="size-3.5 text-emerald-400" /> : <Clipboard className="size-3.5" />}
                            {copied ? 'Copied' : 'Copy Fixed Code'}
                        </button>
                    </div>
                    <pre className="overflow-x-auto rounded-lg border border-white/[0.07] bg-[#0b1016] p-4 font-mono text-[11px] leading-6 text-slate-300">
            <code>{result.suggestedRefactor}</code>
          </pre>
                </div>
            </section>
        </div>
    )
}

function ReadmeArchitect() {
    const [raw, setRaw] = useState(false)
    const [copied, setCopied] = useState(false)
    const markdown = '# CodePulse AI\n\n> Intelligent code reviews and documentation, built for modern teams.\n\n## Features\n\n**Code Inspector** — Find bugs, security risks, and opportunities to improve.\n\n**README Architect** — Generate polished documentation in seconds.\n\n## Getting Started\n\n```bash\npnpm install\npnpm dev\n```'

    return (
        <div className="grid gap-5 lg:grid-cols-[minmax(0,0.86fr)_minmax(0,1.14fr)]">
            <section className="rounded-xl border border-white/10 bg-[#161b22] p-5">
                <div className="mb-5">
                    <h2 className="text-sm font-semibold text-white">Project metadata</h2>
                    <p className="mt-1 text-xs text-slate-500">Tell us about your project</p>
                </div>
                <div className="flex flex-col gap-4">
                    <label className="text-xs text-slate-400">Project name<input defaultValue="CodePulse AI" className="mt-2 w-full rounded-lg border border-white/10 bg-[#0d1117] px-3 py-2.5 text-sm text-slate-200 outline-none focus:border-sky-500/60" /></label>
                    <label className="text-xs text-slate-400">Short description<input defaultValue="AI-powered developer productivity tools" className="mt-2 w-full rounded-lg border border-white/10 bg-[#0d1117] px-3 py-2.5 text-sm text-slate-200 outline-none focus:border-sky-500/60" /></label>
                    <label className="text-xs text-slate-400">Tech stack<input defaultValue="Next.js, TypeScript, Tailwind CSS" className="mt-2 w-full rounded-lg border border-white/10 bg-[#0d1117] px-3 py-2.5 text-sm text-slate-200 outline-none focus:border-sky-500/60" /></label>
                    <button className="mt-1 flex w-full items-center justify-center gap-2 rounded-lg bg-sky-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-sky-400"><Sparkles className="size-4" /> Generate Documentation</button>
                </div>
            </section>
            <section className="rounded-xl border border-white/10 bg-[#161b22] p-5">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h2 className="text-sm font-semibold text-white">README preview</h2>
                        <p className="mt-1 text-xs text-slate-500">Edit and export your documentation</p>
                    </div>
                </div>
                <div className="min-h-[350px] rounded-lg border border-white/[0.08] bg-[#0d1117] p-6">
                    <pre className="whitespace-pre-wrap font-mono text-xs leading-6 text-slate-400">{markdown}</pre>
                </div>
            </section>
        </div>
    )
}

export default function CodePulseApp() {
    const [tab, setTab] = useState<'inspector' | 'readme'>('inspector')

    return (
        <main className="min-h-screen bg-[#0d1117] text-slate-200">
            <header className="border-b border-white/[0.08] bg-[#0d1117]/95">
                <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-4 px-5 py-4 lg:px-8">
                    <div className="flex items-center gap-3">
                        <div className="flex size-8 items-center justify-center rounded-lg bg-sky-500/15 text-sky-400"><Code2 className="size-4" /></div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-sm font-semibold tracking-tight text-white">CodePulse AI</h1>
                                <Badge tone="green"><span className="size-1.5 rounded-full bg-emerald-400" /> System Operational</Badge>
                            </div>
                            <p className="mt-0.5 hidden text-[11px] text-slate-600 sm:block">Developer productivity workspace</p>
                        </div>
                    </div>
                    <nav className="flex items-center rounded-lg border border-white/10 bg-[#161b22] p-1" aria-label="Primary">
                        <button onClick={() => setTab('inspector')} className={`flex items-center gap-2 rounded-md px-3 py-2 text-xs font-medium transition ${tab === 'inspector' ? 'bg-white/10 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}><ShieldCheck className="size-3.5" /> Code Inspector</button>
                        <button onClick={() => setTab('readme')} className={`flex items-center gap-2 rounded-md px-3 py-2 text-xs font-medium transition ${tab === 'readme' ? 'bg-white/10 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}><FileCode2 className="size-3.5" /> README Architect</button>
                    </nav>
                </div>
            </header>
            <div className="mx-auto max-w-[1440px] px-5 py-7 lg:px-8 lg:py-9">
                <div className="mb-7">
                    <p className="mb-2 text-xs font-medium uppercase tracking-[0.18em] text-sky-400">{tab === 'inspector' ? 'Code review workspace' : 'Documentation workspace'}</p>
                    <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">{tab === 'inspector' ? 'Inspect with confidence.' : 'Build better READMEs.'}</h2>
                    <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">{tab === 'inspector' ? 'Get instant, actionable feedback on security, performance, and code quality.' : 'Turn your project context into clear, useful documentation.'}</p>
                </div>
                {tab === 'inspector' ? <Inspector /> : <ReadmeArchitect />}
            </div>
        </main>
    )
}