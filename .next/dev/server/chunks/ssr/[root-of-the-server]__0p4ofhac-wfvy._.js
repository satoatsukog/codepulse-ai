module.exports = [
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
"[project]/app/page.tsx [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {

const handleAudit = async ()=>{
    setIsLoading(true);
    // Имитируем реальную работу ИИ (пауза в 1.2 секунды для реалистичности)
    await new Promise((resolve)=>setTimeout(resolve, 1200));
    // Генерируем структурированный ответ прямо на фронтенде
    const mockReviewResult = {
        score: 88,
        issuesCount: 2,
        suggestionsCount: 3,
        reviewTime: "0.9s",
        findings: [
            {
                type: "warning",
                title: "Потенциальная уязвимость типов или отсутствие проверки",
                text: "Рекомендуется добавить строгую типизацию и проверку на null/undefined перед обработкой данных.",
                line: "Строка 12",
                color: "amber"
            },
            {
                type: "suggestion",
                title: "Оптимизация производительности",
                text: "Использование мемоизации (useMemo / useCallback) поможет избежать лишних рендеров.",
                line: "Строка 24",
                color: "blue"
            }
        ],
        suggestedRefactor: `// Оптимизированный вариант кода:\n// Все потенциальные ошибки обработаны\n\nexport function optimizedHandler(data: any) {\n  if (!data) return null;\n  // Ваша логика здесь\n  return processSafely(data);\n}`
    };
    setReviewData(mockReviewResult);
    setIsLoading(false);
};
}),
"[project]/app/page.tsx [app-rsc] (ecmascript, Next.js Server Component)", (function(__turbopack_context__){

__turbopack_context__.n(__turbopack_context__.i("[project]/app/page.tsx [app-rsc] (ecmascript)"));
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__0p4ofhac-wfvy._.js.map