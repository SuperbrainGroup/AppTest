$(document).ready(function () {
    let currentPage = 1;
    let limit = 50;
    let searchString = $("#searchInput").val();
    const studentDirectory = {};
    let currentResultStudent = null;
    let currentResultDetail = null;
    let lastRadarCategories = [];
    let lastRadarChartData = [];
    function loadStudents() {
        $("#studentTable").html("<tr><td colspan=8 class='text-center'>Đang tải dữ liệu, vui lòng đợi trong giây lát ...</td></tr>");
        $.ajax({
            url: "/GetListStudents",
            type: "GET",
            data: {
                limit: limit,
                offset: (currentPage - 1) * limit,
                search: $("#searchInput").val()
            },
            success: function (response) {
                if (response.success) {
                    if (response.data.length == 0) {
                        $("#studentTable").html(`<tr><td colspan=8 class="text-center">Không tìm thấy dữ liệu học viên!</td></tr>`);
                        $("#nextPage").attr("disabled",true);
                    }
                    else {
                        let students = response.data;
                        let tableBody = $("#studentTable");
                        tableBody.empty(); // Xóa dữ liệu cũ
                        $.each(response.data, function (index, student) {
                            studentDirectory[student.id] = student;
                            let date = new Date(student.namsinh);
                            let formatted = date.toLocaleDateString('vi-VN');
                            let status = "",btn="";
                            if (student.hasTestResult) {
                                let dateTest = new Date(student.dateTest);
                                let formattedTest = dateTest.toLocaleDateString('vi-VN');
                                status = `<td class="text-center"><span class="text-success"><div class="hover-hide">Đã làm bài ${student.numberTest} lần</div></span></td><td class="text-center"><div class="hover-hide">${formattedTest}</div></td>`;
                                btn = `
                                    <button class="btn btn-sm btn-icon btn-success fs-10 btn_ketqua" data-id="${student.id}">
                                        <i class="ti ti-eye"></i> Kết quả
                                    </button>
                                    <button class="btn btn-sm btn-icon btn-outline-primary fs-10 btn_chitiet" data-id="${student.id}" style="margin-left:6px;">
                                        <i class="ti ti-list-details"></i> Chi tiết
                                    </button>
                                `;
                            }
                            else {
                                status = '<td class="text-center"><span class="text-danger"><div class="hover-hide">Chưa làm bài</div></span></td><td class="text-center text-danger"><div class="hover-hide">-</div></td>'
                            }
                            tableBody.append(`
                                <tr class="hover-actions-trigger btn-reveal-trigger position-static">
                                    <td class="text-center">${index+1}</td>
                                    <td class="text-center">${student.mahs}</td>
                                    <td>${student.ten}</td>
                                    <td class="text-center">${formatted}</td>
                                    <td class="text-center">${student.dienthoai}</td>
                                    ${status}
                                    <td class="text-end">
                                        <div class="position-relative">
                                            <div class="hover-actions">
                                                <button class="btn btn-sm btn-icon btn-outline-dark fs-10 me-1 btn_indethi" data-id="${student.id}"><i class="ti ti-printer"></i> In đề</button>
                                                <button class="btn btn-sm btn-icon btn-outline-success fs-10 me-1 btn_nhapdiem" data-id="${student.id}"><i class="ti ti-edit"></i> Nhập điểm</button>
                                                ${btn}
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            `);
                        });
                    }
                    $("#counts").text(response.data.length);
                } else {
                    showNotification("Lỗi khi tải danh sách học viên!");
                }
            },
            error: function () {
                alert("Không thể kết nối đến server!");
            }
        });
        document.getElementById("currentPage").textContent ="Trang "+ currentPage;
    } loadStudents();
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
    let radarChartInstance = null;
    let columnChartInstance = null;

    $(document).on("click", ".btn_ketqua", function () {
        printResultForStudent($(this).data("id"));
    });

    $(document).on("click", ".btn_chitiet", function () {
        const studentId = $(this).data("id");
        window.location.href = "/gv/xem-ket-qua?studentId=" + encodeURIComponent(studentId);
    });

    $(document).on("click", ".btn_indethi", function () {
        printExamForStudent($(this).data("id"));
    });

    $(document).on("click", ".btn_nhapdiem", function () {
        const id = $(this).data("id");
        $("#studentId").val(id);
        $.ajax({
            url: '/GetListPaperQuestions',
            type: 'GET',
            data: { studentId: id },
            success: function (response) {
                if (response.success) {
                    const existingMap = {};
                    (response.existingResults || []).forEach(r => {
                        if (r && r.questionId != null) {
                            existingMap[String(r.questionId)] = r.pointEarned;
                        }
                    });

                    let html = ``;
                    $.each(response.data, function (index, item) {
                        const existingPoint = existingMap[String(item.id)];
                        const valueAttr = (existingPoint !== undefined && existingPoint !== null && !isNaN(parseInt(existingPoint)))
                            ? ` value="${parseInt(existingPoint)}"`
                            : "";
                        html += `<div class="d-flex justify-content-between pb-3 mb-3 align-content-center" style="width:100%;border-bottom: 1px dashed #f1f1f1">
                                    <span class="text-success">Câu ${index + 1} (${item.maxPoint} điểm): ${item.name}</span>
                                    <input type="number" id="point-${item.id}" class="form-control text-center" data-id="${item.id}" data-maxpoint="${item.maxPoint}" data-categoryid="${item.categoryId}" placeholder="..." style="max-width:70px;width:70px;"${valueAttr}>
                                </div>`;
                    });
                    $("#sessionId").val(response.sessionId);
                    $("#showlist_input").html(html);
                    $("#generalComment").val((response.generalComment || "").toString());
                    $("#nhapdiemModal").modal("show");
                } else {
                    showNotification("Không tìm thấy câu hỏi!");
                }
            },
            error: function (xhr, status, error) {
                console.error("Lỗi tải câu hỏi: " + error);
            }
        });
    });
    handleFormSubmit("#nhapdiemForm", function (form, submitButton, originalText) {
        const sessionId = parseInt($('#sessionId').val());
        const data = [];
        const generalComment = ($("#generalComment").val() || "").toString();

        $('#showlist_input input[type="number"]').each(function () {
            const point = parseInt($(this).val());
            const maxPoint = parseInt($(this).data('maxpoint'));
            const questionId = parseInt($(this).data('id'));
            const categoryId = parseInt($(this).data('categoryid'));
            if (!isNaN(point)) {
                data.push({
                    SessionId: sessionId,
                    QuestionId: questionId,
                    CategoryId: categoryId,
                    PointEarned: point,
                    MaxPoint: maxPoint
                });
            }
        });

        $.ajax({
            url: '/SubmitQuestionResults',
            type: "POST", 
            data: JSON.stringify({
                SessionId: sessionId,
                results: data,
                GeneralComment: generalComment
            }),
            processData: false,  // Không xử lý dữ liệu FormData
            contentType: 'application/json',  // Không đặt kiểu dữ liệu
            success: function (response) {
                if (response.success) {
                    $(".form-control").val();
                    $(".form-select").val();
                    $("#nhapdiemModal").modal("hide");
                    showNotification(response.message);
                } else {
                    showNotification(response.message);
                }
            },
            error: function () {
                showNotification("Lỗi hệ thống! vui lòng cập nhật lại");
            },
            complete: function () {
                submitButton.prop("disabled", false).html("Cập nhật"); // Khôi phục nút
            }
        });
    });
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
                                // tableHeadHtml: tableParts.head,
                                // tableBodyHtml: tableParts.body,
                                radarImg: radarImg,
                                columnImg: "",
                                categories: lastRadarCategories,
                                chartData: lastRadarChartData,
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
                    color: "#318C41"
                }
            },
            radar: {
                radius: "75%",
                indicator: categoryNames.map(name => ({
                    name: name,
                    max: 100
                })),
                splitArea: {
                    areaStyle: {
                        color: ["#f8fbf8", "#f1f7f0", "#e9f3e8", "#e2efe1", "#daebda"]
                    }
                },
                axisLine: {
                    lineStyle: {
                        color: "#00783c74"
                    }
                },
                axisName: {
                    color: "#318C41",
                    fontSize: 12
                },
                splitLine: {
                    lineStyle: {
                        color: "rgba(0, 120, 60, 0.05)"
                    }
                }
            },
            series: [{
                name: "Chi tiết kết quả",
                type: "radar",
                data: seriesData,
                itemStyle: {
                    color: "#00783C" // Màu xanh lá của các điểm mốc và chú thích (Legend)
                },
                lineStyle: {
                    width: 2,
                    color: "#00783C" // Màu xanh lá đậm cho đường viền biểu đồ
                },
                areaStyle: {
                    color: "rgba(106, 189, 69, 0.01)" // Màu xanh lá nhạt tô bên trong (độ trong suốt 0.2)
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

});

function debounce(func, delay) {
    let timeout;
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), delay);
    };
}