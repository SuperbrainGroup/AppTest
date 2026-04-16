$(document).ready(function () {
    let chartDataCache = [];

    function loadStudentName() {
        const studentId = $("#studentId").val();
        if (!studentId) return;
        $.ajax({
            url: "/admin/api/student-overview/result-detail",
            type: "GET",
            data: { studentId: studentId },
            success: function (res) {
                const name = res && res.student ? (res.student.ten || res.student.tenhocvien || res.student.name || "") : "";
                if (name) {
                    $("#studentNameLabel").text(name);
                } else {
                    $("#studentNameLabel").text(String(studentId));
                }
            },
            error: function () {
                $("#studentNameLabel").text(String(studentId));
            }
        });
    }

    function loadStudents() {
        $("#showlist").html("<tr><td colspan=6 class='text-center'>Đang tải dữ liệu, vui lòng đợi trong giây lát ...</td></tr>");
        $.ajax({
            url: "/admin/api/student-overview/radar-chart",
            type: "GET",
            data: {
                studentId: $("#studentId").val()
            },
            success: function (response) {
                if (response) {
                    console.log("dữ liệu được tải: " + response.chartData);
                    const categories = response.categories ?? [];
                    const chartData = response.chartData ?? [];
                    chartDataCache = chartData;

                    // Vẽ biểu đồ radar
                    drawRadarChart(categories, chartData);

                    // Hiển thị bảng chi tiết
                    displayResultTable(categories, chartData);

                    // Init dropdown + load chi tiết lần làm bài gần nhất
                    initAttemptDropdown(chartDataCache);
                    const defaultTestId = chartDataCache.length ? chartDataCache[chartDataCache.length - 1].testId : null;
                    if (defaultTestId) {
                        loadAttemptDetails(defaultTestId);
                    }
                } else {
                    $("#showlist").html("<tr><td colspan=6 class='text-center'>Không có dữ liệu.</td></tr>");
                    // Xóa biểu đồ nếu không có dữ liệu
                    const radarChartDom = document.getElementById('radarChart');
                    if (radarChartDom) {
                        echarts.dispose(radarChartDom);
                    }
                    const resultTableBody = $("#resultTableBody");
                    if (resultTableBody) {
                        resultTableBody.empty();
                    }
                }
            },
            error: function () {
                alert("Không thể kết nối đến server!");
                $("#showlist").html("<tr><td colspan=6 class='text-center text-danger'>Lỗi kết nối đến server.</td></tr>");
                // Xóa biểu đồ khi có lỗi
                const radarChartDom = document.getElementById('radarChart');
                if (radarChartDom) {
                    echarts.dispose(radarChartDom);
                }
                const resultTableBody = $("#resultTableBody");
                if (resultTableBody) {
                    resultTableBody.empty();
                }
            }
        });
    }

    loadStudents();
    loadStudentName();

    function loadComparison() {
        $.ajax({
            url: "/admin/api/student-overview/comparison-chart",
            type: "GET",
            data: {
                studentId: $("#studentId").val()
            },
            success: function (response) {
                if (response) {
                    console.log("dữ liệu được tải: " + response.currentUserData);
                    const categories = response.categories ?? [];
                    const comparisonData = [
                        {
                            userData: response.currentUserData,
                            avgDataZero: response.avgDataZero,
                            avgDataOther: response.avgDataOther
                        }
                    ];
                    // Vẽ biểu đồ so sánh
                    drawComparisonChart(categories, comparisonData);
                } else {
                    const columnChart = document.getElementById('columnChart');
                    if (columnChart) {
                        echarts.dispose(columnChart);
                    }
                }
            },
            error: function () {
                alert("Không thể kết nối đến server!");
                const columnChart = document.getElementById('columnChart');
                if (columnChart) {
                    echarts.dispose(columnChart);
                }
            }
        });
    }

    loadComparison();

    function displayResultTable(categories, chartData) {
        const resultTableBody = $("#showlist");
        resultTableBody.empty(); // Xóa dữ liệu cũ nếu có

        if (chartData && chartData.length > 0) {
            const headerRow = $("<tr class='bg-success text-white'></tr>");
            headerRow.append("<th>Khóa học</th>");
            headerRow.append("<th>Ngày kiểm tra</th>");
            categories.forEach(category => {
                headerRow.append(`<th>${category}</th>`);
            });
            resultTableBody.append(headerRow);

            chartData.forEach(item => {
                const dataRow = $("<tr></tr>");
                dataRow.append(`<td>${item.name}</td>`);
                dataRow.append(`<td>${item.date}</td>`);
                item.data.forEach(point => {
                    dataRow.append(`<td>${point}</td>`);
                });
                resultTableBody.append(dataRow);
            });
        } else {
            resultTableBody.html("<tr><td colspan='" + (categories.length + 2) + "' class='text-center'>Không có dữ liệu chi tiết.</td></tr>");
        }
    }

    function escapeHtml(str) {
        return String(str ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/\"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }

    function initAttemptDropdown(chartData) {
        const $sel = $("#attemptSelect");
        if (!$sel.length) {
            return;
        }

        $sel.empty();
        (chartData || []).forEach((item) => {
            const testId = item.testId;
            const date = item.date ? String(item.date) : "";
            const name = item.name ? String(item.name) : "";
            const label = [date, name].filter(Boolean).join(" - ");
            $sel.append(`<option value="${escapeHtml(testId)}">${escapeHtml(label) || escapeHtml(testId)}</option>`);
        });

        $sel.off("change");
        $sel.on("change", function () {
            const v = parseInt($(this).val(), 10);
            if (!isNaN(v)) {
                loadAttemptDetails(v);
            }
        });
    }

    function loadAttemptDetails(testId) {
        $("#attemptQuestionsBody").html(`<tr><td colspan="4" class="text-center text-muted">Đang tải chi tiết...</td></tr>`);
        $("#attemptCategoryTotals").html("");
        $("#attemptGeneralComment").html("");

        $.ajax({
            url: "/admin/api/student-overview/attempt-details",
            type: "GET",
            data: { testId: testId },
            success: function (res) {
                if (!res || !res.success) {
                    $("#attemptQuestionsBody").html(`<tr><td colspan="5" class="text-center text-danger">Không có dữ liệu phiên làm bài.</td></tr>`);
                    return;
                }

                const attempt = res.attempt || {};
                const generalComment = attempt.generalComment ? String(attempt.generalComment) : "";
                if (generalComment.trim()) {
                    const safe = escapeHtml(generalComment).replace(/\n/g, "<br/>");
                    $("#attemptGeneralComment").html(`<div class="fw-bolder mb-1">Nhận xét của giáo viên</div><div>${safe}</div>`);
                } else {
                    $("#attemptGeneralComment").html(`<div class="text-muted">Chưa có nhận xét chung.</div>`);
                }

                const questions = res.questions || [];
                if (questions.length) {
                    let rows = "";
                    questions.forEach((q, i) => {
                        const badge = q.isCorrect
                            ? `<span class="badge text-bg-success">Đúng</span>`
                            : `<span class="badge text-bg-danger">Sai</span>`;
                        const earned = q.earnedPoints ?? 0;
                        const max = q.maxPoint ?? 0;
                        const categoryDot = q.categoryColor
                            ? `<span style="display:inline-block;width:10px;height:10px;border-radius:3px;background:${escapeHtml(q.categoryColor)};margin-right:6px;vertical-align:middle;"></span>`
                            : "";
                        rows += `<tr>
                                    <td class="text-center">${i + 1}</td>
                                    <td class="small text-start">${categoryDot}${escapeHtml(q.categoryName || "")}</td>
                                    <td class="small text-start">${escapeHtml(q.questionName || "")}</td>
                                    <td class="text-center">${escapeHtml(String(earned))}/${escapeHtml(String(max))}</td>
                                    <td class="text-center">${badge}</td>
                                </tr>`;
                    });
                    $("#attemptQuestionsBody").html(rows);
                } else {
                    $("#attemptQuestionsBody").html(`<tr><td colspan="5" class="text-center text-muted">Chưa có dữ liệu câu hỏi.</td></tr>`);
                }

                const totals = res.categoryTotals || [];
                if (totals.length) {
                    let totalRows = "";
                    totals.forEach((t) => {
                        const dot = t.categoryColor
                            ? `<span style="display:inline-block;width:10px;height:10px;border-radius:3px;background:${escapeHtml(t.categoryColor)};margin-right:6px;vertical-align:middle;"></span>`
                            : "";
                        totalRows += `<tr>
                                        <td>${dot}${escapeHtml(t.categoryName || "")}</td>
                                        <td class="text-center">${escapeHtml(String(t.earnedPoints ?? 0))}/${escapeHtml(String(t.maxPoint ?? 0))}</td>
                                        <td class="text-center">${escapeHtml(String(t.percent ?? 0))}%</td>
                                    </tr>`;
                    });

                    $("#attemptCategoryTotals").html(`
                        <div class="fw-bolder mb-2">Tổng điểm theo danh mục</div>
                        <div class="table-responsive">
                            <table class="table table-sm table-bordered table-striped bg-white">
                                <thead class="table-light">
                                    <tr>
                                        <th>Danh mục</th>
                                        <th class="text-center">Điểm</th>
                                        <th class="text-center">%</th>
                                    </tr>
                                </thead>
                                <tbody>${totalRows}</tbody>
                            </table>
                        </div>
                    `);
                } else {
                    $("#attemptCategoryTotals").html(`<div class="text-muted">Chưa có dữ liệu tổng điểm.</div>`);
                }
            },
            error: function () {
                $("#attemptQuestionsBody").html(`<tr><td colspan="5" class="text-center text-danger">Lỗi tải chi tiết phiên.</td></tr>`);
            }
        });
    }

    function drawRadarChart(categories, chartData) {
        const radarChartDom = document.getElementById('radarChart');
        const myChart = echarts.init(radarChartDom);

        const seriesData = chartData.map((item) => ({
            value: item.data,
            name: item.name
        }));

        const option = {
            title: {
                text: '',
                left: 'center'
            },
            tooltip: {},
            legend: {
                data: seriesData.map(x => x.name),
                bottom: 0,
                textStyle: {
                    fontFamily: '"Nunito Sans", sans-serif',
                    fontSize: 13
                }
            },
            radar: {
                indicator: categories.map(name => ({
                    name: name,
                    max: 100,
                    textStyle: {
                        fontFamily: 'Arial',
                        fontSize: 12,
                        color: '#fff'
                    }
                })),

                axisName: {
                    color: '#5a6659',
                    fontFamily: '"Nunito Sans", sans-serif',
                    fontSize: 12
                }
            },
            series: [{
                name: 'Điểm theo danh mục',
                type: 'radar',
                data: seriesData
            }]
        };

        myChart.setOption(option);
    }

    function drawComparisonChart(categories, comparisonData) {
        const columnChartDom = document.getElementById('columnChart');
        const myChart = echarts.init(columnChartDom);

        const option = {
            title: {
                text: '',
                left: 'center'
            },
            tooltip: {
                trigger: 'axis',
                axisPointer: {
                    type: 'shadow'
                }
            },
            legend: {
                data: ['Điểm của bạn', 'Chưa học (Avg)', 'Đã học (Avg)'],
                bottom: 0,
                textStyle: {
                    fontFamily: '"Nunito Sans", sans-serif',
                    fontSize: 13
                }
            },
            grid: {
                left: '3%',
                right: '4%',
                bottom: '15%',
                containLabel: true
            },
            xAxis: {
                type: 'category',
                data: categories
            },
            yAxis: {
                type: 'value',
                name: 'Điểm (%)',
                max: 100,
                textStyle: {
                    fontFamily: '"Nunito Sans", sans-serif',
                    fontSize: 13
                }
            },
            series: [
                {
                    name: 'Điểm của bạn',
                    type: 'bar',
                    data: comparisonData[0].userData,
                    barGap: 0
                },
                {
                    name: 'Chưa học (Avg)',
                    type: 'bar',
                    data: comparisonData[0].avgDataZero
                },
                {
                    name: 'Đã học (Avg)',
                    type: 'bar',
                    data: comparisonData[0].avgDataOther
                }
            ]
        };

        myChart.setOption(option);
    }
});
