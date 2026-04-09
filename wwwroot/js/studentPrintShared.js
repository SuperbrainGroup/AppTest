/**
 * Shared print HTML builders and print window for student exam / result (admin + teacher)
 * Placeholder '            <style>\n                @import url(\'https://fonts.googleapis.com/css2?family=Nunito+Sans:ital,opsz,wght@0,6..12,200..1000;1,6..12,200..1000&display=swap\');\n                @page { size: A4; margin: 12mm 10mm 12mm 10mm; }\n                * { box-sizing: border-box; }\n                body {\n                    margin: 0;\n                    padding: 0;\n                    font-family: "Nunito Sans", Arial, sans-serif;\n                    color: #172033;\n                    background: #ffffff;\n                    -webkit-print-color-adjust: exact;\n                    print-color-adjust: exact;\n                }\n                .print-page {\n                    width: 100%;\n                    max-width: 190mm;\n                    margin: 0 auto;\n                }\n                .print-wireframe {\n                    background: #ffffff;\n                    border: 1px solid #cfd8e6;\n                    border-radius: 10px;\n                    padding: 5mm 6mm 5mm 6mm;\n                }\n                .wf-header {\n                    text-align: center;\n                    margin-bottom: 8px;\n                }\n                .wf-logo-wrap {\n                    margin-bottom: 6px;\n                }\n                .wf-logo {\n                    max-height: 56px;\n                    width: auto;\n                    max-width: 220px;\n                    object-fit: contain;\n                }\n                .wf-logo-placeholder {\n                    font-size: 11px;\n                    font-weight: 800;\n                    letter-spacing: 2px;\n                    color: #94a3b8;\n                    padding: 12px 0;\n                }\n                .wf-title {\n                    margin: 0 0 6px 0;\n                    font-size: 15px;\n                    line-height: 1.25;\n                    font-weight: 900;\n                    text-transform: uppercase;\n                    color: #132238;\n                    letter-spacing: 0.5px;\n                }\n                .wf-title-rule {\n                    height: 2px;\n                    width: 72%;\n                    margin: 0 auto 4px auto;\n                    background: linear-gradient(90deg, transparent, #315a8a, transparent);\n                }\n                .wf-section {\n                    margin-top: 8px;\n                }\n                .wf-section-label {\n                    font-size: 10.5px;\n                    font-weight: 800;\n                    letter-spacing: 1.2px;\n                    color: #183153;\n                    margin-bottom: 6px;\n                }\n                .wf-section-num {\n                    font-size: 10.5px;\n                    font-weight: 800;\n                    letter-spacing: 0.6px;\n                    color: #183153;\n                    margin-bottom: 6px;\n                }\n                .wf-student-grid {\n                    display: grid;\n                    grid-template-columns: 1fr 1fr;\n                    gap: 6px 14px;\n                    font-size: 11px;\n                    line-height: 1.45;\n                    color: #253247;\n                }\n                .wf-student-cell {\n                    border: 1px solid #e2e8f0;\n                    border-radius: 8px;\n                    padding: 7px 9px;\n                    background: #f8fafc;\n                }\n                .wf-divider {\n                    border: none;\n                    border-top: 1px solid #cbd5e1;\n                    margin: 8px 0;\n                }\n                .wf-divider-strong {\n                    border-top: 2px solid #94a3b8;\n                    margin-top: 10px;\n                }\n                .wf-radar-wrap {\n                    text-align: center;\n                    padding: 4px 0;\n                }\n                .wf-radar-img {\n                    max-width: 100%;\n                    max-height: 200px;\n                    object-fit: contain;\n                }\n                .wf-caption {\n                    margin: 6px 0 0 0;\n                    font-size: 9.5px;\n                    font-style: italic;\n                    color: #64748b;\n                    line-height: 1.4;\n                }\n                .wireframe-muted {\n                    margin: 0;\n                    font-size: 11px;\n                    color: #64748b;\n                    text-align: center;\n                }\n                .wf-scores {\n                    border: 1px solid #e2e8f0;\n                    border-radius: 10px;\n                    padding: 8px 10px;\n                    background: #fcfdff;\n                }\n                .score-row {\n                    margin-bottom: 8px;\n                }\n                .score-row:last-child {\n                    margin-bottom: 0;\n                }\n                .score-row-label {\n                    font-size: 10.5px;\n                    font-weight: 700;\n                    color: #1e293b;\n                    margin-bottom: 3px;\n                }\n                .score-row-meta {\n                    display: flex;\n                    flex-wrap: wrap;\n                    align-items: center;\n                    gap: 8px;\n                    font-size: 10px;\n                }\n                .score-num {\n                    font-weight: 800;\n                    color: #183153;\n                    min-width: 52px;\n                }\n                .score-bar-wrap {\n                    flex: 1 1 140px;\n                    min-width: 120px;\n                }\n                .score-bar-track {\n                    display: block;\n                    height: 10px;\n                    border-radius: 6px;\n                    background: #e7eef5;\n                    overflow: hidden;\n                    border: 1px solid #d0dbe8;\n                }\n                .score-bar-fill {\n                    display: block;\n                    height: 100%;\n                    border-radius: 6px;\n                    background: linear-gradient(90deg, #315a8a, #1e4d7a);\n                }\n                .score-tier {\n                    font-size: 10px;\n                    color: #475569;\n                    font-weight: 600;\n                }\n                .wf-quote {\n                    border: 1px solid #e2e8f0;\n                    border-radius: 4px;\n                                       padding: 10px 12px;\n                    font-size: 10.5px;\n                    line-height: 1.55;\n                    color: #253247;\n                }\n                .wf-quote p {\n                    margin: 0 0 6px 0;\n                }\n                .wf-quote p:last-child {\n                    margin-bottom: 0;\n                }\n                .wf-rec-block {\n                    font-size: 10.5px;\n                    line-height: 1.55;\n                    color: #253247;\n                }\n                .rec-line {\n                    display: flex;\n                    gap: 8px;\n                    align-items: flex-start;\n                    margin-bottom: 8px;\n                    padding: 8px 10px;\n                    border: 1px solid #e8edf4;\n                    border-radius: 8px;\n                    background: #ffffff;\n                }\n                .rec-line:last-child {\n                    margin-bottom: 0;\n                }\n                .rec-icon {\n                    flex: 0 0 auto;\n                }\n                .rec-text {\n                    flex: 1 1 auto;\n                }\n                .wf-footer {\n                    display: flex;\n                    justify-content: space-between;\n                    align-items: flex-end;\n                    gap: 16px;\n                    margin-top: 8px;\n                    padding-top: 8px;\n                }\n                .wf-footer-left {\n                    font-size: 10px;\n                    color: #475569;\n                }\n                .wf-qr-label {\n                    font-weight: 700;\n                    margin-bottom: 4px;\n                    color: #183153;\n                }\n                .wf-qr {\n                    width: 96px;\n                    height: 96px;\n                    display: block;\n                    margin-bottom: 6px;\n                    border: 1px solid #e2e8f0;\n                    border-radius: 6px;\n                }\n                .wf-contact {\n                    margin-top: 2px;\n                }\n                .wf-footer-right {\n                    text-align: center;\n                    min-width: 160px;\n                }\n                .wf-sig-title {\n                    font-size: 10.5px;\n                    font-weight: 700;\n                    color: #1e293b;\n                }\n                .wf-sig-spacer {\n                    height: 40px;\n                }\n                .wf-sig-hint {\n                    font-size: 10px;\n                    color: #64748b;\n                }\n                .wf-footer-note {\n                    margin: 8px 0 0 0;\n                    font-size: 9px;\n                    color: #94a3b8;\n                    text-align: center;\n                }\n                .print-appendix {\n                    margin-top: 0;\n                    padding: 6mm 6mm;\n                    background: #f8fafc;\n                    border: 1px dashed #cbd5e1;\n                    border-radius: 10px;\n                }\n                .appendix-heading {\n                    font-size: 13px;\n                    font-weight: 800;\n                    color: #183153;\n                    margin-bottom: 12px;\n                    letter-spacing: 0.5px;\n                }\n                .appendix-chart {\n                    max-width: 100%;\n                }\n                .print-report {\n                    background:\n                        radial-gradient(circle at top right, rgba(49, 90, 138, 0.08), transparent 24%),\n                        linear-gradient(180deg, #ffffff 0%, #f7f9fc 100%);\n                    border: 1px solid #d8e0ea;\n                    padding: 8mm 7mm 7mm 7mm;\n                }\n                .print-report.print-wireframe {\n                    background: #ffffff;\n                }\n                .report-header {\n                    display: flex;\n                    justify-content: space-between;\n                    align-items: flex-start;\n                    gap: 12px;\n                    padding-bottom: 10px;\n                    margin-bottom: 12px;\n                    border-bottom: 2px solid #183153;\n                    page-break-inside: avoid;\n                    break-inside: avoid;\n                }\n                .report-brand {\n                    max-width: 68%;\n                }\n                .report-eyebrow {\n                    margin-bottom: 3px;\n                    font-size: 10px;\n                    font-weight: 800;\n                    letter-spacing: 1.6px;\n                    text-transform: uppercase;\n                    color: #315a8a;\n                }\n                .report-title {\n                    margin: 0 0 4px 0;\n                    font-size: 24px;\n                    line-height: 1.1;\n                    font-weight: 900;\n                    text-transform: uppercase;\n                    color: #132238;\n                }\n                .report-subtitle {\n                    margin: 0;\n                    font-size: 11px;\n                    line-height: 1.45;\n                    color: #526074;\n                }\n                .report-meta {\n                    min-width: 155px;\n                    border: 1px solid #d7deea;\n                    border-radius: 12px;\n                    background: #f8fafc;\n                    padding: 8px 10px;\n                }\n                .report-meta-row + .report-meta-row {\n                    margin-top: 8px;\n                    padding-top: 8px;\n                    border-top: 1px dashed #cbd5e1;\n                }\n                .report-meta-label {\n                    margin-bottom: 2px;\n                    font-size: 10px;\n                    letter-spacing: 1.1px;\n                    text-transform: uppercase;\n                    color: #64748b;\n                }\n                .report-meta-value {\n                    font-size: 12px;\n                    font-weight: 800;\n                    color: #132238;\n                    line-height: 1.4;\n                }\n                .report-section {\n                    margin-top: 12px;\n                }\n                .avoid-break {\n                    page-break-inside: avoid;\n                    break-inside: avoid;\n                }\n                .page-break-before {\n                    page-break-before: always;\n                    break-before: page;\n                }\n                .report-section-title {\n                    display: flex;\n                    align-items: center;\n                    gap: 8px;\n                    margin-bottom: 8px;\n                    font-size: 12px;\n                    font-weight: 800;\n                    letter-spacing: 1px;\n                    text-transform: uppercase;\n                    color: #183153;\n                }\n                .report-section-title::before {\n                    content: "";\n                    width: 22px;\n                    height: 2px;\n                    background: #315a8a;\n                    flex: 0 0 auto;\n                }\n                .student-summary {\n                    display: grid;\n                    grid-template-columns: repeat(2, minmax(0, 1fr));\n                    gap: 8px;\n                }\n                .student-card {\n                    min-height: 60px;\n                    border: 1px solid #d7deea;\n                    border-radius: 12px;\n                    background: #f8fafc;\n                    padding: 9px 10px;\n                    page-break-inside: avoid;\n                    break-inside: avoid;\n                }\n                .student-card-label {\n                    margin-bottom: 4px;\n                    font-size: 10px;\n                    letter-spacing: 1px;\n                    text-transform: uppercase;\n                    color: #64748b;\n                }\n                .student-card-value {\n                    font-size: 13px;\n                    line-height: 1.35;\n                    font-weight: 800;\n                    color: #16253b;\n                    word-break: break-word;\n                }\n                .report-note {\n                    border: 1px solid #d7deea;\n                    border-radius: 12px;\n                    background: #fcfdff;\n                    padding: 10px 12px;\n                }\n                .report-note p {\n                    margin: 0 0 6px 0;\n                    font-size: 18px;\n                    line-height: 1.55;\n                    color: #253247;\n                }\n                .report-note p:last-child {\n                    margin-bottom: 0;\n                }\n                .result-table-wrap {\n                    border: 1px solid #d7deea;\n                    border-radius: 12px;\n                    overflow: hidden;\n                }\n                table {\n                    width: 100%;\n                    border-collapse: collapse;\n                }\n                thead {\n                    display: table-header-group;\n                }\n                th, td {\n                    border: 1px solid #d7deea;\n                    padding: 7px 8px;\n                    font-size: 10.5px;\n                    line-height: 1.35;\n                    vertical-align: top;\n                }\n                th {\n                    background: #183153;\n                    color: #fff;\n                    text-align: center;\n                    font-weight: 700;\n                }\n                tr, img, .chart-panel {\n                    page-break-inside: avoid;\n                    break-inside: avoid;\n                }\n                .chart-grid {\n                    display: grid;\n                    grid-template-columns: repeat(2, minmax(0, 1fr));\n                    gap: 10px;\n                }\n                .chart-panel {\n                    border: 1px solid #d7deea;\n                    border-radius: 12px;\n                    background: #ffffff;\n                    padding: 10px;\n                }\n                .chart-panel-title {\n                    margin-bottom: 8px;\n                    font-size: 11px;\n                    font-weight: 800;\n                    letter-spacing: 0.8px;\n                    text-transform: uppercase;\n                    color: #183153;\n                }\n                .chart-image {\n                    width: 100%;\n                    max-height: 240px;\n                    object-fit: contain;\n                    display: block;\n                }\n                .report-footer {\n                    display: flex;\n                    justify-content: space-between;\n                    align-items: flex-end;\n                    gap: 12px;\n                    margin-top: 14px;\n                    padding-top: 10px;\n                    border-top: 1px solid #d7deea;\n                }\n                .report-footer-note {\n                    font-size: 10.5px;\n                    line-height: 1.5;\n                    color: #64748b;\n                }\n                .report-signature {\n                    min-width: 180px;\n                    text-align: center;\n                }\n                .report-signature-title {\n                    margin-bottom: 54px;\n                    font-size: 11px;\n                    font-weight: 700;\n                    color: #1f2937;\n                }\n                .report-signature-name {\n                    border-top: 1px solid #c9d4e2;\n                    padding-top: 6px;\n                    font-size: 11px;\n                    font-weight: 800;\n                    color: #132238;\n                }\n                #showlist_dethi > div {\n                    margin-bottom: 6px;\n                    border-bottom: 1px dashed #f1f1f1;\n                    padding-bottom: 4px;\n                    font-size: 12px;\n                }\n                #showlist_dethi input {\n                    width: 50px;\n                    max-width: 50px;\n                    padding: 6px 8px;\n                    border: 1px solid #dadada;\n                    border-radius: 5px;\n                }\n                @media print {\n                    .print-report {\n                        border: none;\n                        padding: 0;\n                        background: #fff;\n                    }\n                }\n                @media (max-width: 768px) {\n                    .report-header,\n                    .report-footer {\n                        flex-direction: column;\n                    }\n                    .report-brand,\n                    .report-meta {\n                        width: 100%;\n                        max-width: none;\n                    }\n                    .student-summary,\n                    .chart-grid {\n                        grid-template-columns: 1fr;\n                    }\n                }\n                .exam-paper { page-break-inside: avoid; }\n                .exam-section-title { font-size: 10.5px; font-weight: 800; letter-spacing: 0.5px; color: #183153; margin: 10px 0 0 0; text-transform: uppercase; }\n                .exam-q-list { margin-top: 8px; }\n                .exam-q-item { page-break-inside: avoid; border: 1px solid #e2e8f0; border-radius: 10px; padding: 10px 12px; margin-bottom: 10px; background: #fcfdff; border-left: 4px solid #315a8a; }\n                .exam-q-head { display: flex; justify-content: space-between; align-items: baseline; flex-wrap: wrap; gap: 8px; margin-bottom: 6px; }\n                .exam-q-num { font-weight: 800; color: #183153; font-size: 11px; }\n                .exam-q-pts { font-size: 10px; color: #64748b; }\n                .exam-q-text { font-size: 11px; line-height: 1.45; color: #253247; }\n                .exam-q-img { max-width: 100%; max-height: 280px; object-fit: contain; display: block; margin-top: 6px; }\n                .exam-footer-note { margin-top: 12px; font-size: 9px; color: #94a3b8; text-align: center; }\n' replaced by tools/gen_student_print_shared.py
 */
(function (window) {
    "use strict";

    function escapeHtml(value) {
        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }

    function formatDateVi(value) {
        if (!value) {
            return "-";
        }
        const date = new Date(value);
        return Number.isNaN(date.getTime()) ? "-" : date.toLocaleDateString("vi-VN");
    }

    function safeValue(value) {
        return value && String(value).trim() ? String(value).trim() : "-";
    }

    function calculateAgeYears(dateValue) {
        if (dateValue === undefined || dateValue === null || dateValue === "") {
            return "-";
        }
        const d = dateValue instanceof Date ? dateValue : new Date(dateValue);
        if (Number.isNaN(d.getTime())) {
            return "-";
        }
        const today = new Date();
        let age = today.getFullYear() - d.getFullYear();
        const m = today.getMonth() - d.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < d.getDate())) {
            age--;
        }
        return age >= 0 ? String(age) : "-";
    }

    function parseRadarDate(dateStr) {
        if (!dateStr) {
            return 0;
        }
        const t = Date.parse(dateStr);
        return Number.isNaN(t) ? 0 : t;
    }

    function getLatestRadarRow(chartData) {
        if (!chartData || chartData.length === 0) {
            return null;
        }
        let best = chartData[0];
        let bestTs = parseRadarDate(best.date);
        for (let i = 1; i < chartData.length; i++) {
            const ts = parseRadarDate(chartData[i].date);
            if (ts >= bestTs) {
                bestTs = ts;
                best = chartData[i];
            }
        }
        return best;
    }

    function percentToScore10(pct) {
        const n = Number(pct);
        if (Number.isNaN(n)) {
            return 0;
        }
        const clamped = Math.min(100, Math.max(0, n));
        return Math.round((clamped / 10) * 10) / 10;
    }

    function tierLabel(score10) {
        if (score10 >= 9) {
            return "Xuất sắc";
        }
        if (score10 >= 8) {
            return "Tốt";
        }
        if (score10 >= 7) {
            return "Khá";
        }
        if (score10 >= 6) {
            return "Trung bình";
        }
        return "Cần cải thiện";
    }

    function categoryEmoji(categoryName) {
        const s = String(categoryName || "").toLowerCase();
        if (s.includes("logic") || s.includes("tư duy")) {
            return "🧠";
        }
        if (s.includes("tập trung")) {
            return "👁️";
        }
        if (s.includes("ghi nhớ") || s.includes("nhớ")) {
            return "🐘";
        }
        if (s.includes("phản xạ")) {
            return "⚡";
        }
        if (s.includes("tự tin")) {
            return "🌟";
        }
        return "📌";
    }

    function getMergedReportConfig(student, cfg) {
        cfg = cfg || {};
        const sid = student && student.id;
        const origin = typeof window.location !== "undefined" ? window.location.origin : "";
        const qrData = cfg.reportQrDataUrl || (sid ? `${origin}/?studentReport=${encodeURIComponent(String(sid))}` : origin);
        return {
            logoUrl: cfg.reportLogoUrl || "/images/logo.png",
            reportTitle: cfg.reportTitle || "PHIẾU ĐÁNH GIÁ NĂNG LỰC TOÀN DIỆN CHO BÉ",
            subtitle: cfg.reportSubtitle || "Báo cáo tổng hợp từ hệ thống đánh giá năng lực",
            hotline: (cfg.reportHotline != null && String(cfg.reportHotline).trim() !== "")
                ? String(cfg.reportHotline).trim()
                : "1900 xxxx",
            website: (cfg.reportWebsite != null && String(cfg.reportWebsite).trim() !== "")
                ? String(cfg.reportWebsite).trim()
                : (typeof window.location !== "undefined" ? String(window.location.host || "") : ""),
            qrDataUrl: qrData,
            signatureLabel: cfg.reportSignatureLabel || "Chữ ký Chuyên gia",
            signedHint: cfg.reportSignedHint || "(Đã ký)",
            recommendations: cfg.reportRecommendations || {},
            unitName: cfg.reportUnitName || "Superbrain"
        };
    }

    function buildScoreRowsHtml(categories, latestRow) {
        if (!categories || !latestRow || !latestRow.data) {
            return "<p class=\"wireframe-muted\">Chưa có điểm chi tiết theo từng năng lực.</p>";
        }
        const rows = [];
        categories.forEach((cat, i) => {
            const pct = Number(latestRow.data[i]);
            const score10 = percentToScore10(pct);
            const tier = tierLabel(score10);
            const pctClamped = Math.min(100, Math.max(0, Number.isNaN(pct) ? 0 : pct));
            const emoji = categoryEmoji(cat);
            const label = escapeHtml(String(cat).toUpperCase());
            rows.push(`
                <div class="score-row avoid-break">
                    <div class="score-row-label">${emoji} ${label}:</div>
                    <div class="score-row-meta">
                        <span class="score-num">${score10.toFixed(1)}/10</span>
                        <span class="score-bar-wrap" aria-hidden="true"><span class="score-bar-track"><span class="score-bar-fill" style="width:${pctClamped}%"></span></span></span>
                        <span class="score-tier">(${escapeHtml(tier)})</span>
                    </div>
                </div>
            `);
        });
        return rows.join("");
    }

    function buildRecommendationsHtml(cfg) {
        const rec = cfg.recommendations || {};
        const home = rec.home || "Ba mẹ có thể đồng hành cùng bé qua các trò chơi rèn phản xạ và trí nhớ phù hợp độ tuổi.";
        const course = rec.course || "Tham khảo các khóa học tại trung tâm phù hợp với lộ trình của bé.";
        return `
            <div class="rec-line avoid-break"><span class="rec-icon">🎯</span> <span class="rec-text">${escapeHtml(home)}</span></div>
            <div class="rec-line avoid-break"><span class="rec-icon">🚀</span> <span class="rec-text">${escapeHtml(course)}</span></div>
        `;
    }

    function buildQrImageUrl(dataUrl) {
        return "https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=" + encodeURIComponent(dataUrl);
    }

    function toAbsoluteAssetUrl(path) {
        const p = String(path || "").trim();
        if (!p) {
            return "";
        }
        if (/^https?:\/\//i.test(p)) {
            return p;
        }
        if (typeof window.location !== "undefined" && window.location.origin) {
            return window.location.origin + (p.startsWith("/") ? p : `/${p}`);
        }
        return p;
    }

    function buildResultTableParts(categories, chartData) {
        const cats = categories || [];
        if (!chartData || chartData.length === 0) {
            const colspan = cats.length + 3;
            return {
                head: "",
                body: `<tr><td class="text-center" colspan="${colspan}">Không có dữ liệu chi tiết.</td></tr>`
            };
        }
        let headRow = "<tr><th class=\"text-center\">Ngày kiểm tra</th>";
        cats.forEach((c) => {
            headRow += `<th class="text-center">${escapeHtml(c)}</th>`;
        });
        headRow += "</tr>";
        let body = "";
        chartData.forEach((item, index) => {
            body += `<tr><td class="text-center">${escapeHtml(item.date)}</td>`;
            item.data.forEach((point) => {
                body += `<td class="text-center">${escapeHtml(String(point))}</td>`;
            });
            body += "</tr>";
        });
        return { head: headRow, body: body };
    }

    function buildResultPrintHtml(state) {
        const s = state.student || {};
        const categories = state.categories || [];
        const chartData = state.chartData || [];
        const detailHtml = state.detailHtml || "";
        const radarImg = state.radarImg || "";
        const handwritingComment = state.handwritingComment || ""; // Nhận xét mới

        const tableParts = buildResultTableParts(categories, chartData);
        
        // Khung nhận xét cầm bút (chỉ hiện nếu có nội dung)
        const handwritingSection = handwritingComment ? `
            <div class="report-section">
                <div class="report-section-title">Nhận xét phần cầm bút</div>
                <div class="report-note" style="font-size: 16px !important;">
                    ${handwritingComment}
                </div>
            </div>
        ` : "";

        return `
            <div class="print-report print-wireframe result-print-a4 exam-paper">
                <div class="exam-print-top">
                    <div class="exam-print-title">PHIẾU ĐÁNH GIÁ NĂNG LỰC</div>
                    <div class="exam-student-row-3">
                        <div><span class="exam-info-lbl">Họ và tên</span><strong>${escapeHtml(safeValue(s.ten))}</strong></div>
                        <div><span class="exam-info-lbl">Ngày sinh</span><strong>${escapeHtml(formatDateVi(s.ngaysinh))}</strong></div>
                        <div><span class="exam-info-lbl">Tên đăng nhập</span><strong>${escapeHtml(safeValue(s.userLog))}</strong></div>
                    </div>
                </div>

                <div class="report-section">
                    <div class="report-section-title">Kết quả kiểm tra</div>
                    <div class="result-table-wrap">
                        <table>
                            <thead>${tableParts.head}</thead>
                            <tbody>${tableParts.body}</tbody>
                        </table>
                    </div>
                </div>

                <div class="report-section">
                    <div class="report-section-title">Đánh giá chung</div>
                    <div class="report-note" style="font-size: 16px !important;">
                        ${detailHtml}
                    </div>
                </div>

                <div class="report-section">
                    <div class="report-section-title">Sơ đồ năng lực</div>
                    <div class="result-radar-print">
                        ${radarImg ? `<img src="${radarImg}" class="wf-radar-img" alt="Biểu đồ radar" />` : `<p class="wireframe-muted">Chưa có dữ liệu biểu đồ.</p>`}
                    </div>
                </div>

                ${handwritingSection}
            </div>
        `;
    }

    function buildExamPrintHtml(response, cfg) {
        const s = response.student || {};
        const merged = getMergedReportConfig(s, cfg || window.studentOverviewConfig || {});
        const today = formatDateVi(new Date());
        const data = response.data || [];
        let questionsHtml = "";
        data.forEach((item, index) => {
            let img = "";
            if (item.hasImage && item.image) {
                img = `<img class="exam-q-img" src="${escapeHtml(item.image)}" alt="" />`;
            }
            const n = index + 1;
            questionsHtml += `
                <div class="exam-q-compact">
                    <div class="exam-q-line">
                        <div class="exam-q-main"><span class="exam-q-prefix">Câu ${n}. </span><span class="exam-q-text">${escapeHtml(item.name)}</span></div>
                        <span class="exam-q-pts">..../${escapeHtml(String(item.maxPoint))}</span>
                    </div>
                    ${img}
                </div>
            `;
        });
        return `
            <div class="print-report print-wireframe exam-paper exam-print-a4 exam-print-layout">
                <div class="exam-print-top">
                    <div class="exam-print-title">PHIẾU KIỂM TRA NĂNG LỰC</div>
                    <div class="exam-student-row-3">
                        <div><span class="exam-info-lbl">Họ và tên</span><strong>${escapeHtml(safeValue(s.ten))}</strong></div>
                        <div><span class="exam-info-lbl">Ngày sinh</span><strong>${escapeHtml(formatDateVi(s.ngaysinh))}</strong></div>
                        <div><span class="exam-info-lbl">Tên đăng nhập</span><strong>${escapeHtml(safeValue(s.userLog))}</strong></div>
                    </div>
                    <div class="exam-section-title">NỘI DUNG CÂU HỎI</div>
                </div>
                <div class="exam-q-compact-wrap">${questionsHtml}</div>
                <p class="exam-footer-note">Phiếu đề được xuất từ hệ thống · ${escapeHtml(merged.unitName)} · ${escapeHtml(today)}</p>
            </div>
        `;
    }

    const PRINT_STYLES = '            <style>\n                @import url(\'https://fonts.googleapis.com/css2?family=Nunito+Sans:ital,opsz,wght@0,6..12,200..1000;1,6..12,200..1000&display=swap\');\n                @page { size: A4; margin: 12mm 10mm 12mm 10mm; }\n                * { box-sizing: border-box; }\n                body {\n                    margin: 0;\n                    padding: 0;\n                    font-family: "Nunito Sans", Arial, sans-serif;\n                    color: #172033;\n                    background: #ffffff;\n                    -webkit-print-color-adjust: exact;\n                    print-color-adjust: exact;\n                }\n                .print-page {\n                    width: 100%;\n                    max-width: 190mm;\n                    margin: 0 auto;\n                }\n                .print-wireframe {\n                    background: #ffffff;\n                    border: 1px solid #cfd8e6;\n                    border-radius: 10px;\n                    padding: 5mm 6mm 5mm 6mm;\n                }\n                .wf-header {\n                    text-align: center;\n                    margin-bottom: 8px;\n                }\n                .wf-logo-wrap {\n                    margin-bottom: 6px;\n                }\n                .wf-logo {\n                    max-height: 56px;\n                    width: auto;\n                    max-width: 220px;\n                    object-fit: contain;\n                }\n                .wf-logo-placeholder {\n                    font-size: 11px;\n                    font-weight: 800;\n                    letter-spacing: 2px;\n                    color: #94a3b8;\n                    padding: 12px 0;\n                }\n                .wf-title {\n                    margin: 0 0 6px 0;\n                    font-size: 15px;\n                    line-height: 1.25;\n                    font-weight: 900;\n                    text-transform: uppercase;\n                    color: #132238;\n                    letter-spacing: 0.5px;\n                }\n                .wf-title-rule {\n                    height: 2px;\n                    width: 72%;\n                    margin: 0 auto 4px auto;\n                    background: linear-gradient(90deg, transparent, #315a8a, transparent);\n                }\n                .wf-section {\n                    margin-top: 8px;\n                }\n                .wf-section-label {\n                    font-size: 10.5px;\n                    font-weight: 800;\n                    letter-spacing: 1.2px;\n                    color: #183153;\n                    margin-bottom: 6px;\n                }\n                .wf-section-num {\n                    font-size: 10.5px;\n                    font-weight: 800;\n                    letter-spacing: 0.6px;\n                    color: #183153;\n                    margin-bottom: 6px;\n                }\n                .wf-student-grid {\n                    display: grid;\n                    grid-template-columns: 1fr 1fr;\n                    gap: 6px 14px;\n                    font-size: 11px;\n                    line-height: 1.45;\n                    color: #253247;\n                }\n                .wf-student-cell {\n                    border: 1px solid #e2e8f0;\n                    border-radius: 8px;\n                    padding: 7px 9px;\n                    background: #f8fafc;\n                }\n                .wf-divider {\n                    border: none;\n                    border-top: 1px solid #cbd5e1;\n                    margin: 8px 0;\n                }\n                .wf-divider-strong {\n                    border-top: 2px solid #94a3b8;\n                    margin-top: 10px;\n                }\n                .wf-radar-wrap {\n                    text-align: center;\n                    padding: 4px 0;\n                }\n                .wf-radar-img {\n                    max-width: 100%;\n                    max-height: 200px;\n                    object-fit: contain;\n                }\n                .wf-caption {\n                    margin: 6px 0 0 0;\n                    font-size: 9.5px;\n                    font-style: italic;\n                    color: #64748b;\n                    line-height: 1.4;\n                }\n                .wireframe-muted {\n                    margin: 0;\n                    font-size: 11px;\n                    color: #64748b;\n                    text-align: center;\n                }\n                .wf-scores {\n                    border: 1px solid #e2e8f0;\n                    border-radius: 10px;\n                    padding: 8px 10px;\n                    background: #fcfdff;\n                }\n                .score-row {\n                    margin-bottom: 8px;\n                }\n                .score-row:last-child {\n                    margin-bottom: 0;\n                }\n                .score-row-label {\n                    font-size: 10.5px;\n                    font-weight: 700;\n                    color: #1e293b;\n                    margin-bottom: 3px;\n                }\n                .score-row-meta {\n                    display: flex;\n                    flex-wrap: wrap;\n                    align-items: center;\n                    gap: 8px;\n                    font-size: 10px;\n                }\n                .score-num {\n                    font-weight: 800;\n                    color: #183153;\n                    min-width: 52px;\n                }\n                .score-bar-wrap {\n                    flex: 1 1 140px;\n                    min-width: 120px;\n                }\n                .score-bar-track {\n                    display: block;\n                    height: 10px;\n                    border-radius: 6px;\n                    background: #e7eef5;\n                    overflow: hidden;\n                    border: 1px solid #d0dbe8;\n                }\n                .score-bar-fill {\n                    display: block;\n                    height: 100%;\n                    border-radius: 6px;\n                    background: linear-gradient(90deg, #315a8a, #1e4d7a);\n                }\n                .score-tier {\n                    font-size: 10px;\n                    color: #475569;\n                    font-weight: 600;\n                }\n                .wf-quote {\n                    border: 1px solid #e2e8f0;\n                    border-radius: 4px;\n                    padding: 10px 12px;\n                    font-size: 10.5px;\n                    line-height: 1.55;\n                    color: #253247;\n                }\n                .wf-quote p {\n                    margin: 0 0 6px 0;\n                }\n                .wf-quote p:last-child {\n                    margin-bottom: 0;\n                }\n                .wf-rec-block {\n                    font-size: 10.5px;\n                    line-height: 1.55;\n                    color: #253247;\n                }\n                .rec-line {\n                    display: flex;\n                    gap: 8px;\n                    align-items: flex-start;\n                    margin-bottom: 8px;\n                    padding: 8px 10px;\n                    border: 1px solid #e8edf4;\n                    border-radius: 8px;\n                    background: #ffffff;\n                }\n                .rec-line:last-child {\n                    margin-bottom: 0;\n                }\n                .rec-icon {\n                    flex: 0 0 auto;\n                }\n                .rec-text {\n                    flex: 1 1 auto;\n                }\n                .wf-footer {\n                    display: flex;\n                    justify-content: space-between;\n                    align-items: flex-end;\n                    gap: 16px;\n                    margin-top: 8px;\n                    padding-top: 8px;\n                }\n                .wf-footer-left {\n                    font-size: 10px;\n                    color: #475569;\n                }\n                .wf-qr-label {\n                    font-weight: 700;\n                    margin-bottom: 4px;\n                    color: #183153;\n                }\n                .wf-qr {\n                    width: 96px;\n                    height: 96px;\n                    display: block;\n                    margin-bottom: 6px;\n                    border: 1px solid #e2e8f0;\n                    border-radius: 6px;\n                }\n                .wf-contact {\n                    margin-top: 2px;\n                }\n                .wf-footer-right {\n                    text-align: center;\n                    min-width: 160px;\n                }\n                .wf-sig-title {\n                    font-size: 10.5px;\n                    font-weight: 700;\n                    color: #1e293b;\n                }\n                .wf-sig-spacer {\n                    height: 40px;\n                }\n                .wf-sig-hint {\n                    font-size: 10px;\n                    color: #64748b;\n                }\n                .wf-footer-note {\n                    margin: 8px 0 0 0;\n                    font-size: 9px;\n                    color: #94a3b8;\n                    text-align: center;\n                }\n                .print-appendix {\n                    margin-top: 0;\n                    padding: 6mm 6mm;\n                    background: #f8fafc;\n                    border: 1px dashed #cbd5e1;\n                    border-radius: 10px;\n                }\n                .appendix-heading {\n                    font-size: 13px;\n                    font-weight: 800;\n                    color: #183153;\n                    margin-bottom: 12px;\n                    letter-spacing: 0.5px;\n                }\n                .appendix-chart {\n                    max-width: 100%;\n                }\n                .print-report {\n                    background:\n                        radial-gradient(circle at top right, rgba(49, 90, 138, 0.08), transparent 24%),\n                        linear-gradient(180deg, #ffffff 0%, #f7f9fc 100%);\n                    border: 1px solid #d8e0ea;\n                    padding: 8mm 7mm 7mm 7mm;\n                }\n                .print-report.print-wireframe {\n                    background: #ffffff;\n                }\n                .report-header {\n                    display: flex;\n                    justify-content: space-between;\n                    align-items: flex-start;\n                    gap: 12px;\n                    padding-bottom: 10px;\n                    margin-bottom: 12px;\n                    border-bottom: 2px solid #183153;\n                    page-break-inside: avoid;\n                    break-inside: avoid;\n                }\n                .report-brand {\n                    max-width: 68%;\n                }\n                .report-eyebrow {\n                    margin-bottom: 3px;\n                    font-size: 10px;\n                    font-weight: 800;\n                    letter-spacing: 1.6px;\n                    text-transform: uppercase;\n                    color: #315a8a;\n                }\n                .report-title {\n                    margin: 0 0 4px 0;\n                    font-size: 24px;\n                    line-height: 1.1;\n                    font-weight: 900;\n                    text-transform: uppercase;\n                    color: #132238;\n                }\n                .report-subtitle {\n                    margin: 0;\n                    font-size: 11px;\n                    line-height: 1.45;\n                    color: #526074;\n                }\n                .report-meta {\n                    min-width: 155px;\n                    border: 1px solid #d7deea;\n                    border-radius: 12px;\n                    background: #f8fafc;\n                    padding: 8px 10px;\n                }\n                .report-meta-row + .report-meta-row {\n                    margin-top: 8px;\n                    padding-top: 8px;\n                    border-top: 1px dashed #cbd5e1;\n                }\n                .report-meta-label {\n                    margin-bottom: 2px;\n                    font-size: 10px;\n                    letter-spacing: 1.1px;\n                    text-transform: uppercase;\n                    color: #64748b;\n                }\n                .report-meta-value {\n                    font-size: 12px;\n                    font-weight: 800;\n                    color: #132238;\n                    line-height: 1.4;\n                }\n                .report-section {\n                    margin-top: 12px;\n                }\n                .avoid-break {\n                    page-break-inside: avoid;\n                    break-inside: avoid;\n                }\n                .page-break-before {\n                    page-break-before: always;\n                    break-before: page;\n                }\n                .report-section-title {\n                    display: flex;\n                    align-items: center;\n                    gap: 8px;\n                    margin-bottom: 8px;\n                    font-size: 12px;\n                    font-weight: 800;\n                    letter-spacing: 1px;\n                    text-transform: uppercase;\n                    color: #183153;\n                }\n                .report-section-title::before {\n                    content: "";\n                    width: 22px;\n                    height: 2px;\n                    background: #315a8a;\n                    flex: 0 0 auto;\n                }\n                .student-summary {\n                    display: grid;\n                    grid-template-columns: repeat(2, minmax(0, 1fr));\n                    gap: 8px;\n                }\n                .student-card {\n                    min-height: 60px;\n                    border: 1px solid #d7deea;\n                    border-radius: 12px;\n                    background: #f8fafc;\n                    padding: 9px 10px;\n                    page-break-inside: avoid;\n                    break-inside: avoid;\n                }\n                .student-card-label {\n                    margin-bottom: 4px;\n                    font-size: 10px;\n                    letter-spacing: 1px;\n                    text-transform: uppercase;\n                    color: #64748b;\n                }\n                .student-card-value {\n                    font-size: 13px;\n                    line-height: 1.35;\n                    font-weight: 800;\n                    color: #16253b;\n                    word-break: break-word;\n                }\n                .report-note {\n                    border: 1px solid #d7deea;\n                    border-radius: 12px;\n                    background: #fcfdff;\n                    padding: 10px 12px;\n                }\n                .report-note p {\n                    margin: 0 0 6px 0;\n                    font-size: 18px;\n                    line-height: 1.55;\n                    color: #253247;\n                }\n                .report-note p:last-child {\n                    margin-bottom: 0;\n                }\n                .result-table-wrap {\n                    border: 1px solid #d7deea;\n                    border-radius: 12px;\n                    overflow: hidden;\n                }\n                table {\n                    width: 100%;\n                    border-collapse: collapse;\n                }\n                thead {\n                    display: table-header-group;\n                }\n                th, td {\n                    border: 1px solid #d7deea;\n                    padding: 7px 8px;\n                    font-size: 10.5px;\n                    line-height: 1.35;\n                    vertical-align: top;\n                }\n                th {\n                    background: #183153;\n                    color: #fff;\n                    text-align: center;\n                    font-weight: 700;\n                }\n                tr, img, .chart-panel {\n                    page-break-inside: avoid;\n                    break-inside: avoid;\n                }\n                .chart-grid {\n                    display: grid;\n                    grid-template-columns: repeat(2, minmax(0, 1fr));\n                    gap: 10px;\n                }\n                .chart-panel {\n                    border: 1px solid #d7deea;\n                    border-radius: 12px;\n                    background: #ffffff;\n                    padding: 10px;\n                }\n                .chart-panel-title {\n                    margin-bottom: 8px;\n                    font-size: 11px;\n                    font-weight: 800;\n                    letter-spacing: 0.8px;\n                    text-transform: uppercase;\n                    color: #183153;\n                }\n                .chart-image {\n                    width: 100%;\n                    max-height: 240px;\n                    object-fit: contain;\n                    display: block;\n                }\n                .report-footer {\n                    display: flex;\n                    justify-content: space-between;\n                    align-items: flex-end;\n                    gap: 12px;\n                    margin-top: 14px;\n                    padding-top: 10px;\n                    border-top: 1px solid #d7deea;\n                }\n                .report-footer-note {\n                    font-size: 10.5px;\n                    line-height: 1.5;\n                    color: #64748b;\n                }\n                .report-signature {\n                    min-width: 180px;\n                    text-align: center;\n                }\n                .report-signature-title {\n                    margin-bottom: 54px;\n                    font-size: 11px;\n                    font-weight: 700;\n                    color: #1f2937;\n                }\n                .report-signature-name {\n                    border-top: 1px solid #c9d4e2;\n                    padding-top: 6px;\n                    font-size: 11px;\n                    font-weight: 800;\n                    color: #132238;\n                }\n                #showlist_dethi > div {\n                    margin-bottom: 6px;\n                    border-bottom: 1px dashed #f1f1f1;\n                    padding-bottom: 4px;\n                    font-size: 12px;\n                }\n                #showlist_dethi input {\n                    width: 50px;\n                    max-width: 50px;\n                    padding: 6px 8px;\n                    border: 1px solid #dadada;\n                    border-radius: 5px;\n                }\n                @media print {\n                    .print-report {\n                        border: none;\n                        padding: 0;\n                        background: #fff;\n                    }\n                }\n                @media (max-width: 768px) {\n                    .report-header,\n                    .report-footer {\n                        flex-direction: column;\n                    }\n                    .report-brand,\n                    .report-meta {\n                        width: 100%;\n                        max-width: none;\n                    }\n                    .student-summary,\n                    .chart-grid {\n                        grid-template-columns: 1fr;\n                    }\n                }\n                .exam-paper { page-break-inside: avoid; }\n                .exam-section-title { font-size: 10.5px; font-weight: 800; letter-spacing: 0.5px; color: #183153; margin: 10px 0 0 0; text-transform: uppercase; }\n                .exam-q-list { margin-top: 8px; }\n                .exam-q-item { page-break-inside: avoid; border: 1px solid #e2e8f0; border-radius: 10px; padding: 10px 12px; margin-bottom: 10px; background: #fcfdff; border-left: 4px solid #315a8a; }\n                .exam-q-head { display: flex; justify-content: space-between; align-items: baseline; flex-wrap: wrap; gap: 8px; margin-bottom: 6px; }\n                .exam-q-num { font-weight: 800; color: #183153; font-size: 11px; }\n                .exam-q-pts { font-size: 10px; color: #64748b; }\n                .exam-q-text { font-size: 11px; line-height: 1.45; color: #253247; }\n                .exam-q-img { max-width: 100%; max-height: 280px; object-fit: contain; display: block; margin-top: 6px; }\n                .exam-footer-note { margin-top: 12px; font-size: 9px; color: #94a3b8; text-align: center; }\n';

    const PRINT_STYLES_A4 = `
        @page { size: A4; margin: 0; } 
        
        /* KHUNG TRANG: */
        .print-wireframe.exam-print-a4,
        .print-wireframe.result-print-a4 { 
            border: none !important; 
            padding: 10mm 12mm 2mm 12mm !important; 
            background: #fff !important;
        }
        
        /* =========================================
           PHẦN KẾT QUẢ
           ========================================= */
        .report-section-title { 
            display: flex !important; align-items: center !important; gap: 10px !important;
            margin: 10px 0 !important;
            font-size: 16px !important; /* Khớp .exam-section-title */
            font-weight: 800 !important; 
            text-transform: uppercase !important; 
            color: #183153 !important; 
        }
        .report-section-title::before { content: ""; width: 22px; height: 2px; background: #315a8a; flex: 0 0 auto; }

        /* Bảng điểm */
        .result-table-wrap { border: 1px solid #dee2e6 !important; border-radius: 8px !important; overflow: hidden !important; margin-bottom: 10px !important; }
        .result-table-wrap table { width: 100% !important; border-collapse: collapse !important; }
        .result-table-wrap th { 
            background: #198754 !important; color: white !important; 
            padding: 12px 8px !important; 
            font-size: 14px !important; 
            font-weight: 700 !important; 
            border: 1px solid #146c43 !important; 
        }
        .result-table-wrap td { 
            border: 1px solid #dee2e6 !important; padding: 10px 8px !important; 
            font-size: 14px !important; 
            text-align: center !important; 
        }

        /* Nhận xét */
        .report-note { 
            border: 1px solid #d7deea !important; border-radius: 12px !important; 
            background: #fcfdff !important; padding: 15px 20px !important; 
            font-size: 18px !important; 
            line-height: 1.5 !important; 
            color: #253247 !important; 
        }
        
        .result-radar-print { text-align: center !important; padding: 0px 0 !important; }
        .result-print-a4 .wf-radar-img { max-height: 95mm !important; width: auto; max-width: 100%; object-fit: contain; }

        /* =========================================
           PHẦN ĐỀ THI
           ========================================= */
        .exam-print-layout { display: block; box-sizing: border-box; } 
        .exam-print-top { margin-bottom: 10px; }
        .exam-print-title { text-align: center; font-size: 24px; font-weight: 800; color: #183153; margin-bottom: 10px; letter-spacing: 0.5px; }
        .exam-student-row-3 { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 15px; font-size: 14px; margin-bottom: 0px; }
        .exam-student-row-3 > div { border: 1px solid #e2e8f0; padding: 10px 12px; border-radius: 6px; background: #f8fafc; }
        .exam-info-lbl { display: block; font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 4px; }
        .exam-print-a4 .exam-section-title { font-size: 16px; margin: 10px 0 15px 0; font-weight: 800; color: #183153; text-transform: uppercase; }
        .exam-q-compact-wrap { display: flex; flex-direction: column; gap: 15px; }
        .exam-q-compact { border: 1px solid #e5e7eb; padding: 15px; border-radius: 8px; background: #fcfdff; page-break-inside: avoid; }
        .exam-q-line { display: flex; flex-direction: row; align-items: baseline; justify-content: space-between; gap: 10px; }
        .exam-q-main { flex: 1 1 auto; min-width: 0; font-size: 18px; line-height: 1.5; color: #253247; }
        .exam-q-prefix { font-weight: 800; color: #183153; }
        .exam-q-compact .exam-q-text { font-weight: 500; color: #253247; font-size: 18px !important; }
        .exam-q-compact .exam-q-pts { flex: 0 0 auto; font-size: 14px; color: #64748b; white-space: nowrap; }
        .exam-q-compact .exam-q-img { width: 100% !important; max-width: 100%; height: auto; max-height: 350px; object-fit: contain; display: block; margin-top: 10px; }
        .exam-print-a4 .exam-footer-note { padding-top: 15px; margin-top: 30px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8; text-align: center; }
    `;

    function openPrintWindow(title, contentHtml) {
        const printWindow = window.open("", "_blank");
        if (!printWindow) {
            return;
        }
        const cssBundle = String(PRINT_STYLES).replace(/^\s*<style>\s*/i, "") + PRINT_STYLES_A4;
        printWindow.document.write("<html><head><title>" + title + "</title>");
        printWindow.document.write("<style>" + cssBundle + "</style>");
        printWindow.document.write("</head><body>");
        printWindow.document.write('<div class="print-page">' + contentHtml + "</div>");
        printWindow.document.write("</body></html>");
        printWindow.document.close();
        printWindow.focus();
        setTimeout(function () {
            printWindow.print();
        }, 700);
    }

    window.AppStudentPrint = {
        openPrintWindow: openPrintWindow,
        buildResultPrintHtml: buildResultPrintHtml,
        buildExamPrintHtml: buildExamPrintHtml,
        buildResultTableParts: buildResultTableParts,
        escapeHtml: escapeHtml,
        formatDateVi: formatDateVi,
        safeValue: safeValue
    };
    /* --- LOGIC IN ẤN HỢP NHẤT --- */

    function drawRadarShared(domId, categories, chartData) {
        const chartDom = document.getElementById(domId || "radarChartPrint");
        if (!chartDom) return null;

        // Dispose để đảm bảo instance sạch
        let instance = echarts.getInstanceByDom(chartDom);
        if (instance) instance.dispose();

        // Khởi tạo ECharts
        instance = echarts.init(chartDom, null, { width: 600, height: 320 });

        const seriesData = chartData.map(item => ({
            value: item.data,
            name: item.name
        }));

        instance.setOption({
            title: { text: "", left: "center" },
            tooltip: {},
            legend: {
                data: seriesData.map(x => x.name),
                bottom: 25,
                textStyle: {
                    fontFamily: '"Nunito Sans", sans-serif',
                    fontSize: 14,
                    color: "#318C41" // Màu xanh GV
                }
            },
            radar: {
                radius: "70%",
                center: ['50%', '45%'],
                indicator: categories.map(name => ({
                    name: name,
                    max: 100
                })),
                splitArea: {
                    areaStyle: {
                        color: ["#f8fbf8", "#f1f7f0", "#f8fbf8", "#f1f7f0", "#f8fbf8"]
                    }
                },
                axisLine: { lineStyle: { color: "#00783c74" } },
                axisName: { color: "#318C41", fontSize: 16 },
                splitLine: { lineStyle: { color: "rgba(0, 120, 60, 0.05)" } }
            },
            series: [{
                name: "Chi tiết kết quả",
                type: "radar",
                data: seriesData,
                itemStyle: { color: "#00783C" },
                lineStyle: { width: 3, color: "#00783C" },
                areaStyle: { color: "rgba(106, 189, 69, 0.01)" }
            }]
        });

        instance.resize();

        return instance;
    }

    // Hàm thực hiện In Đề Thi
    async function printExam(studentId) {
        const cfg = window.studentOverviewConfig || {};
        try {
            const response = await $.get(cfg.printExamUrl || "/LoadPrintExam", { studentId });
            if (!response.success) { alert("Không tìm thấy câu hỏi!"); return; }
            const html = window.AppStudentPrint.buildExamPrintHtml(response, cfg);
            window.AppStudentPrint.openPrintWindow("In đề thi", html);
        } catch (e) { alert("Lỗi tải đề thi!"); }
    }

    // Hàm thực hiện In Kết Quả
    async function printResult(studentId, baseInfo) {
        const cfg = window.studentOverviewConfig || {};
        if (window.showNotification) window.showNotification("Đang chuẩn bị bản in...");

        try {
            const [rDetail, rRadar] = await Promise.all([
                $.get(cfg.resultDetailUrl, { studentId }),
                $.get(cfg.radarChartUrl, { studentId })
            ]);

            if (!rDetail.success) { alert("Không có dữ liệu kết quả!"); return; }

            // --- PHẦN ĐIỀU CHỈNH ĐỂ 2 BẢN IN GIỐNG NHAU ---
            const student = { ...baseInfo, ...(rDetail.student || {}), id: studentId };
            const studentName = window.AppStudentPrint.escapeHtml(student.ten || "Học viên");
            
            // Lấy nội dung mô tả chi tiết từ hệ thống
            const systemDescription = rDetail.description || "Hiện không có nhận xét chi tiết kết quả của học viên.";

            // Hợp nhất thành một cấu trúc chuẩn duy nhất
            const finalDetailHtml = `
                <div class="system-desc">${systemDescription}</div>
            `;
            // ----------------------------------------------

            let radarImg = "";
            if (rRadar && rRadar.categories) {
                const instance = drawRadarShared("radarChartPrint", rRadar.categories, rRadar.chartData);
                await new Promise(res => setTimeout(res, 700));
                radarImg = instance.getDataURL({ type: "png", pixelRatio: 2, backgroundColor: "#fff" });
                instance.dispose();
            }

            const html = window.AppStudentPrint.buildResultPrintHtml({
                student: student,
                categories: rRadar.categories || [],
                chartData: rRadar.chartData || [],
                detailHtml: finalDetailHtml, // Dùng nội dung đã chuẩn hóa ở trên
                handwritingComment: rDetail.handwritingComment,
                radarImg: radarImg,
                cfg: cfg
            });
            window.AppStudentPrint.openPrintWindow("In Kết Quả", html);
        } catch (e) { alert("Lỗi chuẩn bị bản in!"); }
    }

    // Public API
    window.AppStudentPrint.printExam = printExam;
    window.AppStudentPrint.printResult = printResult;
})(window);
