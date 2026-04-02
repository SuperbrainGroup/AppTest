function escapeHtml(str) {
    return String(str ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function getDashboardConfig() {
    return window.dashboardConfig || {};
}

function renderCourseCategoryChart(payload) {
    const dom = document.getElementById("courseCategoryChart");
    if (!dom || typeof echarts === "undefined") return;

    const categories = payload?.categories || [];
    const courses = payload?.courses || [];
    const seriesByCategory = payload?.seriesByCategory || [];

    // Dispose old chart if exists
    const oldInstance = echarts.getInstanceByDom(dom);
    if (oldInstance) echarts.dispose(oldInstance);

    const chart = echarts.init(dom);

    const xAxisData = courses.map(c => c.label || String(c.key ?? ""));
    const series = (seriesByCategory || []).map(s => {
        return {
            name: s.name || "",
            type: "bar",
            data: s.data || [],
            barMaxWidth: 34,
            itemStyle: {
                color: s.color || "#198754"
            }
        };
    });

    chart.setOption({
        tooltip: {
            trigger: "axis",
            axisPointer: { type: "shadow" },
            textStyle: {
                fontFamily: '"Nunito Sans", sans-serif'
            },
            formatter: function (params) {
                if (!params || !params.length) return "";
                const courseLabel = params[0]?.axisValueLabel || "";
                let lines = `<div style="font-weight:800;margin-bottom:6px;">${escapeHtml(courseLabel)}</div>`;
                params.forEach(p => {
                    const seriesName = p.seriesName || "";
                    const val = p.data ?? 0;
                    lines += `<div><span style="display:inline-block;width:10px;height:10px;border-radius:3px;background:${escapeHtml(p.color || "#198754")};margin-right:8px;vertical-align:middle;"></span>${escapeHtml(seriesName)}: <b>${val}%</b></div>`;
                });
                return lines;
            }
        },
        legend: {
            type: "scroll",
            bottom: 0,
            data: series.map(s => s.name)
        },
        grid: {
            left: 28,
            right: 18,
            top: 44,
            bottom: 90,
            containLabel: true
        },
        xAxis: {
            type: "category",
            data: xAxisData,
            axisLabel: {
                fontFamily: '"Nunito Sans", sans-serif',
                interval: 0,
                rotate: 25
            }
        },
        yAxis: {
            type: "value",
            max: 100,
            name: "%",
            axisLabel: {
                fontFamily: '"Nunito Sans", sans-serif'
            },
            splitLine: {
                lineStyle: { color: "rgba(0,0,0,.08)" }
            }
        },
        series: series
    });
}

function renderTopBranchesTable(payload) {
    const $body = $("#topBranchesTableBody");
    if (!$body.length) return;

    const list = payload?.topBranches || [];
    $body.empty();

    if (!list.length) {
        $body.append(`<tr><td colspan="4" class="text-center text-muted py-4">Không có dữ liệu</td></tr>`);
        return;
    }

    list.forEach((b, idx) => {
        const id = b.idChiNhanh ?? b.id ?? "";
        const name = b.tenChiNhanh ?? b.ten ?? b.name ?? "";
        const count = b.testedStudentCount ?? b.testedCount ?? b.count ?? 0;

        $body.append(`
            <tr>
                <td class="text-center">${idx + 1}</td>
                <td>${escapeHtml(name)}</td>
                <td class="text-center fw-bold">${escapeHtml(count)}</td>
            </tr>
        `);
    });
}

$(document).ready(function () {
    const cfg = getDashboardConfig();
    const courseCategoryUrl = cfg.courseCategoryUrl || "/admin/api/dashboard/course-category";
    const topBranchesUrl = cfg.topBranchesUrl || "/admin/api/dashboard/top-branches?top=10";

    $.ajax({
        url: courseCategoryUrl,
        type: "GET",
        success: function (resp) {
            renderCourseCategoryChart(resp || {});
        },
        error: function () {
            const dom = document.getElementById("courseCategoryChart");
            if (dom) dom.innerHTML = "<div class='text-center text-muted py-5'>Lỗi tải dữ liệu chart</div>";
        }
    });

    $.ajax({
        url: topBranchesUrl,
        type: "GET",
        success: function (resp) {
            renderTopBranchesTable(resp || {});
        },
        error: function () {
            renderTopBranchesTable({ topBranches: [] });
        }
    });
});
