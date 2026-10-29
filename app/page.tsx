'use client'

import { useState } from 'react'

interface Finding {
    type: 'warning' | 'suggestion'
    title: string
    text: string
    line: string
    color: string
}

interface ReviewResult {
    score: number
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH'
    issuesCount: number
    suggestionsCount: number
    reviewTime: string
    findings: Finding[]
    suggestedRefactor: string
    originalCodeSnippet: string
    timestamp?: string
    language?: string
}

export default function CodePulsePage() {
    const [code, setCode] = useState('')
    const [language, setLanguage] = useState('typescript')
    const [isLoading, setIsLoading] = useState(false)
    const [reviewData, setReviewData] = useState<ReviewResult | null>(null)
    const [activeTab, setActiveTab] = useState<'findings' | 'diff'>('findings')

    // UI Customization States
    const [theme, setTheme] = useState<'dracula' | 'github' | 'monokai'>('dracula')
    const [copied, setCopied] = useState(false)
    const [auditFocus, setAuditFocus] = useState({
        security: true,
        performance: true,
        cleanCode: true,
    })
    const [history, setHistory] = useState<ReviewResult[]>([])

    // Sample code snippets
    const sampleCodes: Record<string, string> = {
        typescript: `// TypeScript Example with Security & Performance Issues
import { useState, useEffect } from 'react';

export function UserProfile({ userId }: { userId: any }) {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // Missing error handling and input validation
    fetch(\`/api/users/\${userId}\`)
      .then(res => res.json())
      .then(data => setUser(data));
  }, [userId]);

  return (
    <div>
      <h1>{user.name}</h1>
      <p>{user.profile.bio}</p>
    </div>
  );
}`,
        python: `# Python Example with Security & Performance issues
import json

def fetch_and_process_data(raw_payload):
    # Unsafe evaluation / missing error handling
    data = eval(raw_payload)
    results = []
    for item in data:
        if item.get("status") == "active":
            results.append(item)
    return results`,
        csharp: `// C# Example with Nullable and Disposable warnings
using System.Net.Http;

public class DataService 
{
    public string GetData(string url) 
    {
        var client = new HttpClient();
        var response = client.GetStringAsync(url).Result; // Blocking call
        return response;
    }
}`,
        go: `// Go Example with Unhandled Errors
package main

import "os"

function ReadFile(filename string) string {
    file, _ := os.Open(filename)
    data := make([]byte, 100)
    file.Read(data)
    return string(data)
}`
    }

    // Calculate Code Metrics on the fly
    const calculateMetrics = (srcCode: string) => {
        const lines = srcCode.split('\n').filter((l) => l.trim().length > 0)
        const sloc = lines.length

        // Simple cyclomatic complexity estimation based on branching keywords
        const branchKeywords = srcCode.match(/(if|else|for|while|catch|case|&&|\|\||\?)/g) || []
        const complexity = branchKeywords.length + 1

        // Estimated Technical Debt
        const techDebtMinutes = sloc > 0 ? Math.min(120, Math.max(10, complexity * 8)) : 0

        return { sloc, complexity, techDebtMinutes }
    }

    const metrics = calculateMetrics(code)

    // Preset Mock Analysis Generator
    const getMockReviewByLanguage = (lang: string, currentCode: string): ReviewResult => {
        switch (lang) {
            case 'python':
                return {
                    score: 68,
                    riskLevel: 'HIGH',
                    issuesCount: 2,
                    suggestionsCount: 2,
                    reviewTime: "0.6s",
                    originalCodeSnippet: currentCode,
                    findings: [
                        {
                            type: "warning",
                            title: "Unsafe Code Execution (Security)",
                            text: "Using eval() poses a severe security risk. Use json.loads() for parsing structured strings.",
                            line: "Line 6",
                            color: "amber"
                        },
                        {
                            type: "suggestion",
                            title: "PEP 8 Optimization & List Comprehension",
                            text: "Replace explicit for-loops with filtered list comprehensions for higher performance.",
                            line: "Line 8",
                            color: "blue"
                        }
                    ],
                    suggestedRefactor: `# Refactored Python Code:\nimport json\n\ndef fetch_and_process_data(raw_payload: str) -> list:\n    try:\n        data = json.loads(raw_payload)\n        return [item for item in data if item.get("status") == "active"]\n    except (json.JSONDecodeError, TypeError):\n        return []`
                }
            case 'csharp':
                return {
                    score: 82,
                    riskLevel: 'MEDIUM',
                    issuesCount: 1,
                    suggestionsCount: 2,
                    reviewTime: "0.8s",
                    originalCodeSnippet: currentCode,
                    findings: [
                        {
                            type: "warning",
                            title: "Blocking Async Call & Resource Leak",
                            text: "HttpClient should be reused or injected. Calling .Result causes thread pool starvation.",
                            line: "Line 9",
                            color: "amber"
                        }
                    ],
                    suggestedRefactor: `// Refactored C# Code:\nusing System.Net.Http;\nusing System.Threading.Tasks;\n\npublic class DataService \n{\n    private readonly HttpClient _client;\n    public DataService(HttpClient client) => _client = client;\n\n    public async Task<string> GetDataAsync(string url) \n    {\n        return await _client.GetStringAsync(url);\n    }\n}`
                }
            case 'go':
                return {
                    score: 74,
                    riskLevel: 'MEDIUM',
                    issuesCount: 2,
                    suggestionsCount: 1,
                    reviewTime: "0.5s",
                    originalCodeSnippet: currentCode,
                    findings: [
                        {
                            type: "warning",
                            title: "Ignored Error Return Value",
                            text: "Always check returned errors explicitly instead of ignoring them with blank identifiers.",
                            line: "Line 8",
                            color: "amber"
                        }
                    ],
                    suggestedRefactor: `// Refactored Go Code:\npackage main\n\nimport (\n\t"os"\n\t"io"\n)\n\nfunc ReadFile(filename string) (string, error) {\n\tfile, err := os.Open(filename)\n\tif err != nil {\n\t\treturn "", err\n\t}\n\tdefer file.Close()\n\tdata, err := io.ReadAll(file)\n\treturn string(data), err\n}`
                }
            default:
                return {
                    score: 87,
                    riskLevel: 'LOW',
                    issuesCount: 2,
                    suggestionsCount: 2,
                    reviewTime: "0.9s",
                    originalCodeSnippet: currentCode,
                    findings: [
                        {
                            type: "warning",
                            title: "Implicit Any & Unhandled Async Errors",
                            text: "Add strict typing for userId and implement .catch() or try/catch around the fetch API.",
                            line: "Line 10",
                            color: "amber"
                        },
                        {
                            type: "suggestion",
                            title: "Safe Property Access (Optional Chaining)",
                            text: "Use optional chaining (user?.profile?.bio) to prevent crashes on null values.",
                            line: "Line 18",
                            color: "blue"
                        }
                    ],
                    suggestedRefactor: `// Refactored TypeScript Code:\nimport { useState, useEffect } from 'react';\n\ninterface UserProfileProps {\n  userId: string;\n}\n\nexport function UserProfile({ userId }: UserProfileProps) {\n  const [user, setUser] = useState<{ name: string; profile?: { bio: string } } | null>(null);\n\n  useEffect(() => {\n    let isMounted = true;\n    fetch(\`/api/users/\${userId}\`)\n      .then(res => res.ok ? res.json() : null)\n      .then(data => { if (isMounted) setUser(data); })\n      .catch(console.error);\n    return () => { isMounted = false; };\n  }, [userId]);\n\n  return (\n    <div>\n      <h1>{user?.name ?? 'Loading...'}</h1>\n      <p>{user?.profile?.bio ?? 'No bio available'}</p>\n    </div>\n  );\n}`
                }
        }
    }

    const handleAudit = async () => {
        setIsLoading(true)
        await new Promise((resolve) => setTimeout(resolve, 1100))

        const result = getMockReviewByLanguage(language, code)
        const resultWithMeta = {
            ...result,
            timestamp: new Date().toLocaleTimeString(),
            language: language.toUpperCase()
        }

        setReviewData(resultWithMeta)
        setHistory((prev) => [resultWithMeta, ...prev.slice(0, 4)])
        setIsLoading(false)
    }

    const handleCopy = () => {
        if (reviewData?.suggestedRefactor) {
            navigator.clipboard.writeText(reviewData.suggestedRefactor)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        }
    }

    const handleLoadSample = () => {
        setCode(sampleCodes[language] || sampleCodes.typescript)
    }

    // Export Audit Report as Markdown file
    const handleExportReport = () => {
        if (!reviewData) return

        const markdownContent = `# CodePulse AI Audit Report
**Date:** ${new Date().toLocaleString()}  
**Language:** ${reviewData.language}  
**Score:** ${reviewData.score}/100  
**Risk Level:** ${reviewData.riskLevel}  

---

## 🔍 Findings & Security Issues
${reviewData.findings.map((f, i) => `${i + 1}. **[${f.type.toUpperCase()}] ${f.title} (${f.line})**\n   ${f.text}`).join('\n\n')}

---

## 💡 Suggested Refactored Code
\`\`\`${language}
${reviewData.suggestedRefactor}
\`\`\`
`

        const blob = new Blob([markdownContent], { type: 'text/markdown' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `codepulse-audit-${language}-${Date.now()}.md`
        a.click()
        URL.revokeObjectURL(url)
    }

    const themeStyles = {
        dracula: {
            bg: 'bg-slate-950',
            panel: 'bg-slate-900 border-slate-800',
            accent: 'bg-indigo-600 hover:bg-indigo-500',
            text: 'text-slate-100',
        },
        github: {
            bg: 'bg-gray-900',
            panel: 'bg-gray-800 border-gray-700',
            accent: 'bg-blue-600 hover:bg-blue-500',
            text: 'text-gray-100',
        },
        monokai: {
            bg: 'bg-neutral-950',
            panel: 'bg-neutral-900 border-neutral-800',
            accent: 'bg-amber-600 hover:bg-amber-500',
            text: 'text-neutral-100',
        }
    }[theme]

    return (
        <div className={`min-h-screen ${themeStyles.bg} ${themeStyles.text} p-6 md:p-12 transition-colors duration-300`}>
            <div className="max-w-7xl mx-auto space-y-8">

                {/* Header */}
                <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b border-slate-800/80 pb-6">
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-extrabold tracking-tight text-white">CodePulse AI</h1>
                            <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                v2.5 Enterprise
              </span>
                        </div>
                        <p className="text-sm text-slate-400 mt-1">Automated code audit, vulnerability check, metrics, and diff view</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <select
                            value={theme}
                            onChange={(e: any) => setTheme(e.target.value)}
                            className="bg-slate-900 border border-slate-800 text-slate-300 text-xs rounded-lg px-3 py-2.5 focus:outline-none cursor-pointer"
                        >
                            <option value="dracula">Theme: Dracula</option>
                            <option value="github">Theme: GitHub Dark</option>
                            <option value="monokai">Theme: Monokai</option>
                        </select>

                        <select
                            value={language}
                            onChange={(e) => setLanguage(e.target.value)}
                            className="bg-slate-900 border border-slate-800 text-slate-300 text-xs rounded-lg px-3 py-2.5 focus:outline-none cursor-pointer"
                        >
                            <option value="typescript">TypeScript / JS</option>
                            <option value="python">Python</option>
                            <option value="csharp">C#</option>
                            <option value="go">Go</option>
                        </select>

                        <button
                            onClick={handleAudit}
                            disabled={isLoading}
                            className={`px-5 py-2.5 rounded-lg ${themeStyles.accent} font-medium text-white transition-all disabled:opacity-50 cursor-pointer shadow-lg`}
                        >
                            {isLoading ? 'Analyzing...' : 'Audit & Review Code'}
                        </button>
                    </div>
                </header>

                {/* Audit Focus Rules Bar */}
                <div className={`p-4 rounded-xl border ${themeStyles.panel} flex flex-wrap items-center justify-between gap-4`}>
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Audit Focus Rules:</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-6 text-xs text-slate-300">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={auditFocus.security}
                                onChange={(e) => setAuditFocus({ ...auditFocus, security: e.target.checked })}
                                className="rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-0"
                            />
                            Security & Vulnerabilities
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={auditFocus.performance}
                                onChange={(e) => setAuditFocus({ ...auditFocus, performance: e.target.checked })}
                                className="rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-0"
                            />
                            Performance & Memory
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={auditFocus.cleanCode}
                                onChange={(e) => setAuditFocus({ ...auditFocus, cleanCode: e.target.checked })}
                                className="rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-0"
                            />
                            Clean Code & Style
                        </label>
                    </div>
                </div>

                {/* Main Workspace */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                    {/* Left Column: Code Input & Live Metrics */}
                    <div className="flex flex-col space-y-3">
                        <div className="flex justify-between items-center">
                            <label className="text-sm font-medium text-slate-300">Source Code:</label>
                            <button
                                onClick={handleLoadSample}
                                className="text-xs font-mono text-indigo-400 hover:underline cursor-pointer"
                            >
                                + Load {language.toUpperCase()} Example
                            </button>
                        </div>

                        <textarea
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            placeholder={`Paste your ${language.toUpperCase()} code here, or click '+ Load Example' above...`}
                            className={`w-full h-[360px] ${themeStyles.panel} rounded-xl p-4 font-mono text-sm text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors resize-none border`}
                        />

                        {/* Code Metrics Bar */}
                        <div className={`p-3.5 rounded-xl border ${themeStyles.panel} grid grid-cols-3 gap-2 text-center text-xs font-mono`}>
                            <div>
                                <span className="text-slate-500 block text-[10px] uppercase">Lines of Code</span>
                                <span className="text-slate-200 font-bold">{metrics.sloc} SLOC</span>
                            </div>
                            <div>
                                <span className="text-slate-500 block text-[10px] uppercase">Cyclomatic Complexity</span>
                                <span className="text-indigo-400 font-bold">{metrics.complexity}</span>
                            </div>
                            <div>
                                <span className="text-slate-500 block text-[10px] uppercase">Est. Tech Debt</span>
                                <span className="text-amber-400 font-bold">~{metrics.techDebtMinutes} min</span>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: AI Analysis Results with Tabs */}
                    <div className="flex flex-col space-y-3">
                        <div className="flex justify-between items-center">
                            {/* Tab Navigation */}
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setActiveTab('findings')}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                                        activeTab === 'findings' ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-slate-400 hover:text-white'
                                    }`}
                                >
                                    Findings & Score
                                </button>
                                <button
                                    onClick={() => setActiveTab('diff')}
                                    disabled={!reviewData}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors disabled:opacity-40 ${
                                        activeTab === 'diff' ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-slate-400 hover:text-white'
                                    }`}
                                >
                                    Diff View (Before / After)
                                </button>
                            </div>

                            {reviewData && (
                                <div className="flex gap-3">
                                    <button
                                        onClick={handleExportReport}
                                        className="text-xs font-medium text-indigo-400 hover:underline cursor-pointer"
                                    >
                                        📥 Export Report (.md)
                                    </button>
                                    <button
                                        onClick={handleCopy}
                                        className="text-xs font-medium text-slate-400 hover:text-white transition-colors cursor-pointer"
                                    >
                                        {copied ? '✓ Copied!' : '📋 Copy Refactor'}
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className={`w-full h-[420px] ${themeStyles.panel} rounded-xl p-5 overflow-y-auto font-mono text-sm text-slate-300 border`}>
                            {isLoading ? (
                                <div className="flex flex-col items-center justify-center h-full text-slate-500 space-y-3">
                                    <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                                    <span>Running CodePulse security & performance analysis...</span>
                                </div>
                            ) : reviewData ? (
                                activeTab === 'findings' ? (
                                    <div className="space-y-5">

                                        {/* Score Dashboard & Security Risk Badge */}
                                        <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                                            <div className="flex items-center gap-3">
                                                <span className="text-emerald-400 font-bold text-lg">Score: {reviewData.score}/100</span>

                                                {/* Security Risk Badge */}
                                                <span className={`px-2.5 py-0.5 rounded text-[11px] font-bold ${
                                                    reviewData.riskLevel === 'HIGH' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                                                        reviewData.riskLevel === 'MEDIUM' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                                                            'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                                }`}>
                          Risk: {reviewData.riskLevel}
                        </span>
                                            </div>
                                            <span className="text-xs text-slate-500">Execution: {reviewData.reviewTime}</span>
                                        </div>

                                        {/* Findings Section */}
                                        <div>
                                            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Findings & Issues:</h4>
                                            {reviewData.findings.map((f, i) => (
                                                <div key={i} className="mb-3 p-3 rounded-lg bg-slate-900/80 border border-slate-800/80">
                                                    <div className="text-amber-400 font-semibold text-xs flex justify-between">
                                                        <span>{f.title}</span>
                                                        <span className="text-slate-500">{f.line}</span>
                                                    </div>
                                                    <div className="text-slate-300 text-xs mt-1.5 leading-relaxed">{f.text}</div>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Refactor Suggestion */}
                                        <div>
                                            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Suggested Refactor:</h4>
                                            <pre className="p-4 rounded-lg bg-slate-950 text-xs text-indigo-300 overflow-x-auto border border-slate-800/60 leading-relaxed">
                        {reviewData.suggestedRefactor}
                      </pre>
                                        </div>

                                    </div>
                                ) : (
                                    /* Diff View Tab */
                                    <div className="space-y-4">
                                        <div>
                                            <h4 className="text-xs font-semibold text-red-400 uppercase tracking-wider mb-2">--- Original Code (Before)</h4>
                                            <pre className="p-3 rounded-lg bg-red-950/20 border border-red-900/40 text-xs text-red-300 overflow-x-auto">
                        {reviewData.originalCodeSnippet || 'Original code unavailable'}
                      </pre>
                                        </div>
                                        <div>
                                            <h4 className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-2">+++ Refactored Code (After)</h4>
                                            <pre className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-900/40 text-xs text-emerald-300 overflow-x-auto">
                        {reviewData.suggestedRefactor}
                      </pre>
                                        </div>
                                    </div>
                                )
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full text-slate-500 space-y-2">
                                    <p>Paste code or click '+ Load Example', then hit 'Audit & Review Code'</p>
                                </div>
                            )}
                        </div>
                    </div>

                </div>

                {/* History Panel */}
                {history.length > 0 && (
                    <div className={`p-4 rounded-xl border ${themeStyles.panel} space-y-3`}>
                        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Recent Audit History:</h3>
                        <div className="flex flex-wrap gap-3">
                            {history.map((item, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setReviewData(item)}
                                    className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300 hover:border-indigo-500 transition-colors flex items-center gap-2 cursor-pointer"
                                >
                                    <span className="text-emerald-400 font-bold">{item.score}/100</span>
                                    <span>{item.language}</span>
                                    <span className="text-slate-500">({item.timestamp})</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

            </div>
        </div>
    )
}