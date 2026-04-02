$(document).ready(function () {
    let currentResultStudent = null;
    let currentResultDetail = null;
    let currentPage = 1;
    const limit = 50;
    const studentDirectory = {};
    let radarChartInstance = null;
    let columnChartInstance = null;
    let lastRadarCategories = [];
    let lastRadarChartData = [];

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

    function formatBirthYear(value) {
        if (!value) {
            return "-";
        }

        const date = new Date(value);
        return Number.isNaN(date.getTime()) ? "-" : date.getFullYear();
    }

    function safeValue(value) {
        return value && String(value).trim() ? String(value).trim() : "-";
    }

    function loadStudents() {
        $("#studentTable").html("<tr><td colspan=8 class='text-center'>Đang tải dữ liệu, vui lòng đợi trong giây lát ...</td></tr>");

        $.ajax({
            url: (window.studentOverviewConfig && window.studentOverviewConfig.listUrl) || "/GetListStudents",
            type: "GET",
            data: {
                limit: limit,
                offset: (currentPage - 1) * limit,
                search: $("#searchInput").val()
            },
            success: function (response) {
                if (!response.success) {
                    showNotification("Lỗi khi tải danh sách học viên!");
                    return;
                }

                const tableBody = $("#studentTable");
                tableBody.empty();
                $("#counts").text(response.data.length);

                $.each(response.data, function (index, student) {
                    studentDirectory[student.id] = student;

                    const birthYear = formatBirthYear(student.namsinh);
                    let testCount = `<td class="text-center text-danger">-</td>`;
                    let testDate = `<td class="text-center text-danger">-</td>`;
                    let btn = "";

                    if (student.hasTestResult) {
                        testCount = `<td class="text-center"><span class="text-success">${student.numberTest}</span></td>`;
                        testDate = `<td class="text-center">${formatDateVi(student.dateTest)}</td>`;
                        btn = `<button class="btn btn-sm btn-icon btn-success fs-10 btn_ketqua" data-id="${student.id}"><i class="ti ti-eye"></i> Kết quả</button>`;
                    }

                    tableBody.append(`
                        <tr>
                            <td class="text-center">${index + 1}</td>
                            <td class="text-center">${student.mahs}</td>
                            <td>${student.ten}</td>
                            <td class="text-center">${birthYear}</td>
                            <td>${student.courseName || "-"}</td>
                            ${testCount}
                            ${testDate}
                            <td class="text-end">
                                <div class="action-buttons">
                                    <button class="btn btn-sm btn-icon btn-outline-dark fs-10 btn_indethi" data-id="${student.id}"><i class="ti ti-printer"></i> In đề</button>
                                    ${btn}
                                </div>
                            </td>
                        </tr>
                    `);
                });
            },
            error: function () {
                alert("Không thể kết nối đến server!");
            }
        });

        document.getElementById("currentPage").textContent = currentPage;
    }

    function printExamForStudent(studentId) {
        const cfg = window.studentOverviewConfig || {};
        const printUrl = cfg.printExamUrl || "/LoadPrintExam";
        $.ajax({
            url: printUrl,
            type: "GET",
            data: { studentId: studentId },
            success: function (response) {
                if (!response.success) {
                    showNotification("Không tìm thấy câu hỏi!");
                    return;
                }
                if (!window.AppStudentPrint) {
                    showNotification("Thiếu studentPrintShared.js.");
                    return;
                }
                window.AppStudentPrint.openPrintWindow(
                    "In đề thi",
                    window.AppStudentPrint.buildExamPrintHtml(response, cfg)
                );
            },
            error: function () {
                showNotification("Lỗi tải đề thi.");
            }
        });
    }

    function printResultForStudent(studentId) {
        if (!window.AppStudentPrint) {
            showNotification("Thiếu studentPrintShared.js.");
            return;
        }
        const cfg = window.studentOverviewConfig || {};
        const resultUrl = cfg.resultDetailUrl || "/Teacher/LoadResultTestById";
        const radarUrl = cfg.radarChartUrl || "/GetRadarChartData";
        lastRadarCategories = [];
        lastRadarChartData = [];
        currentResultStudent = { ...(studentDirectory[studentId] || {}), id: studentId };
        currentResultDetail = null;
        showNotification("Đang chuẩn bị bản in...");
        $.ajax({
            url: resultUrl,
            type: "GET",
            data: { studentId: studentId },
            success: function (rDetail) {
                if (!rDetail || !rDetail.success) {
                    showNotification("Không có dữ liệu kết quả.");
                    return;
                }
                currentResultStudent = {
                    ...(studentDirectory[studentId] || {}),
                    ...(rDetail.student || {}),
                    id: studentId
                };
                currentResultDetail = rDetail;
                $.ajax({ url: radarUrl, type: "GET", data: { studentId: studentId } }).done(function (rRadar) {
                    if (rRadar && rRadar.categories && rRadar.chartData) {
                        lastRadarCategories = rRadar.categories;
                        lastRadarChartData = rRadar.chartData;
                        drawRadarChart("radarChartPrint", rRadar.categories, rRadar.chartData);
                    } else {
                        lastRadarCategories = [];
                        lastRadarChartData = [];
                        if (radarChartInstance) {
                            radarChartInstance.dispose();
                        }
                        radarChartInstance = null;
                    }
                    const tableParts = window.AppStudentPrint.buildResultTableParts(lastRadarCategories, lastRadarChartData);
                    const detailHtml = currentResultDetail.description
                        ? currentResultDetail.description
                        : "<p>Hiện chưa có nhận xét chi tiết cho học viên này.</p>";
                    setTimeout(function () {
                        const radarImg = radarChartInstance ? radarChartInstance.getDataURL({
                            type: "png",
                            pixelRatio: 3,
                            backgroundColor: "#ffffff"
                        }) : "";
                        window.AppStudentPrint.openPrintWindow(
                            "In Kết Quả",
                            window.AppStudentPrint.buildResultPrintHtml({
                                student: currentResultStudent,
                                detailHtml: detailHtml,
                                tableHeadHtml: tableParts.head,
                                tableBodyHtml: tableParts.body,
                                radarImg: radarImg,
                                columnImg: "",
                                lastRadarCategories: lastRadarCategories,
                                lastRadarChartData: lastRadarChartData,
                                cfg: cfg
                            })
                        );
                    }, 450);
                }).fail(function () {
                    showNotification("Không thể tải biểu đồ để in.");
                });
            },
            error: function () {
                showNotification("Không thể kết nối đến server để lấy kết quả!");
            }
        });
    }

    function drawRadarChart(domId, categoryNames, chartData) {
        const chartDom = document.getElementById(domId || "radarChartPrint");
        if (!chartDom) {
            return;
        }

        if (radarChartInstance) {
            radarChartInstance.dispose();
        }

        radarChartInstance = echarts.init(chartDom);
        const seriesData = chartData.map(item => ({
            value: item.data,
            name: item.name
        }));

        radarChartInstance.setOption({
            title: {
                text: "",
                left: "center"
            },
            tooltip: {},
            legend: {
                data: seriesData.map(x => x.name),
                bottom: 0,
                textStyle: {
                    fontFamily: '"Nunito Sans", sans-serif',
                    fontSize: 12,
                    color: "#253247"
                }
            },
            radar: {
                radius: "62%",
                indicator: categoryNames.map(name => ({
                    name: name,
                    max: 100
                })),
                splitArea: {
                    areaStyle: {
                        color: ["#fbfcfe", "#f5f8fc", "#eef3f9", "#e7eef7", "#dfe8f4"]
                    }
                },
                axisName: {
                    color: "#253247",
                    fontSize: 12
                }
            },
            series: [{
                name: "Chi tiết kết quả",
                type: "radar",
                data: seriesData,
                itemStyle: {
                    color: "#1e4d7a"
                },
                areaStyle: {
                    color: "rgba(30, 77, 122, 0.38)"
                },
                lineStyle: {
                    width: 2,
                    color: "#183153"
                }
            }]
        });

        radarChartInstance.resize();
    }

    function drawColumnChart(domId, categoryNames, chartData) {
        const chartDom = document.getElementById(domId || "columnChartPrint");
        if (!chartDom) {
            return;
        }

        if (columnChartInstance) {
            columnChartInstance.dispose();
        }

        columnChartInstance = echarts.init(chartDom);
        const dataToChart = {
            userData: chartData.userData || [],
            avgDataZero: chartData.avgDataZero || [],
            avgDataOther: chartData.avgDataOther || []
        };

        columnChartInstance.setOption({
            title: {
                text: "",
                left: "center"
            },
            tooltip: {
                trigger: "axis",
                axisPointer: {
                    type: "shadow"
                },
                formatter: function (params) {
                    let tooltipContent = params[0].name + "<br/>";
                    params.forEach(function (item) {
                        tooltipContent += `${item.marker} ${item.seriesName}: <b>${item.value}%</b><br/>`;
                    });
                    return tooltipContent;
                }
            },
            legend: {
                data: ["Điểm của bạn", "Trung bình chưa học", "Trung bình đã học"],
                bottom: 0,
                textStyle: {
                    fontFamily: '"Nunito Sans", sans-serif',
                    fontSize: 12
                }
            },
            grid: {
                left: "4%",
                right: "4%",
                top: "10%",
                bottom: "18%",
                containLabel: true
            },
            xAxis: {
                type: "category",
                data: categoryNames,
                axisLabel: {
                    interval: 0,
                    rotate: 28,
                    fontFamily: '"Nunito Sans", sans-serif',
                    fontSize: 12,
                    color: "#555"
                }
            },
            yAxis: {
                type: "value",
                name: "Điểm (%)",
                max: 100,
                axisLabel: {
                    formatter: "{value}%",
                    fontFamily: '"Nunito Sans", sans-serif',
                    fontSize: 12,
                    color: "#555"
                }
            },
            series: [
                {
                    name: "Điểm của bạn",
                    type: "bar",
                    data: dataToChart.userData,
                    barGap: "10%",
                    itemStyle: {
                        color: "#315a8a"
                    },
                    label: {
                        show: true,
                        position: "top",
                        formatter: "{c}%",
                        fontFamily: '"Nunito Sans", sans-serif',
                        fontSize: 11
                    }
                },
                {
                    name: "Trung bình chưa học",
                    type: "bar",
                    data: dataToChart.avgDataZero,
                    itemStyle: {
                        color: "#8eb69b"
                    },
                    label: {
                        show: true,
                        position: "top",
                        formatter: "{c}%",
                        fontFamily: '"Nunito Sans", sans-serif',
                        fontSize: 11
                    }
                },
                {
                    name: "Trung bình đã học",
                    type: "bar",
                    data: dataToChart.avgDataOther,
                    itemStyle: {
                        color: "#d97757"
                    },
                    label: {
                        show: true,
                        position: "top",
                        formatter: "{c}%",
                        fontFamily: '"Nunito Sans", sans-serif',
                        fontSize: 11
                    }
                }
            ]
        });

        columnChartInstance.resize();
    }

    loadStudents();

    $("#searchInput").on("input", debounce(function () {
        currentPage = 1;
        loadStudents();
    }, 700));

    document.getElementById("prevPage").addEventListener("click", () => {
        if (currentPage > 1) {
            currentPage--;
            loadStudents();
        }
    });

    document.getElementById("nextPage").addEventListener("click", () => {
        currentPage++;
        loadStudents();
    });

    $(document).on("click", ".btn_ketqua", function () {
        printResultForStudent($(this).data("id"));
    });

    $(document).on("click", ".btn_indethi", function () {
        printExamForStudent($(this).data("id"));
    });
});

function debounce(func, delay) {
    let timeout;
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), delay);
    };
}
