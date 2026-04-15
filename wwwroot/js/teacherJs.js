$(document).ready(function () {
    let currentPage = 1;
    let limit = 50;
    let searchString = $("#searchInput").val();
    const studentDirectory = {};
    let currentResultStudent = null;
    let currentResultDetail = null;
    let lastRadarCategories = [];
    let lastRadarChartData = [];
    $(document).on("click", ".btn_chitiet", function (e) {
        console.log("[DEBUG] Click Chi tiết thành công!");
        const id = $(this).attr("data-id");
        if (id) {
            window.location.href = "/gv/xem-ket-qua?studentId=" + encodeURIComponent(id);
        }
    });
    function loadStudents() {
        $("#studentTable").html("<tr><td colspan=8 class='text-center'>Đang tải dữ liệu, vui lòng đợi trong giây lát ...</td></tr>");
        $.ajax({
            url: "/GetListStudents",
            type: "GET",
            data: {
                limit: limit,
                offset: (currentPage - 1) * limit,
                search: $("#searchInput").val(),
                fromDate: $("#fromDate").val(),
                toDate: $("#toDate").val()
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
        const pageElem = document.getElementById("currentPage");
        if (pageElem) {
            pageElem.textContent = "Trang " + currentPage;
        }
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
        const id = $(this).data("id");
        window.AppStudentPrint.printResult(id, studentDirectory[id]);
    });

    $(document).on("click", ".btn_chitiet", function (e) {
        const target = $(this);
        const idFromData = target.data("id");
        const idFromAttr = target.attr("data-id");

        const studentId = idFromAttr || idFromData;

        if (!studentId) {
            console.error("[ERROR] Không tìm thấy Student ID! Hãy kiểm tra lại HTML của nút.");
            alert("Lỗi: Không tìm thấy ID học viên.");
            return;
        }

        const targetUrl = "/gv/xem-ket-qua?studentId=" + encodeURIComponent(studentId);

        window.location.href = targetUrl;
    });

    $(document).on("click", ".btn_indethi", function (e) {
        e.preventDefault();
        const id = $(this).attr("data-id"); // Lấy ID từ attribute
        if (id) {
            window.AppStudentPrint.printExam(id); 
        } else {
            console.error("Không tìm thấy ID để in đề");
        }
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
                    let totalMaxPoint = 0;
                    $.each(response.data, function (index, item) {
                        totalMaxPoint += item.maxPoint;
                        const existingPoint = existingMap[String(item.id)];
                        const valueAttr = (existingPoint !== undefined && existingPoint !== null && !isNaN(parseInt(existingPoint)))
                            ? ` value="${parseInt(existingPoint)}"`
                            : "";
                        html += `<div class="d-flex justify-content-between pb-3 mb-3 align-items-center" style="width:100%;border-bottom: 1px dashed #f1f1f1">
                                    <span class="text-success">Câu ${index + 1} (${item.maxPoint} điểm): ${item.name}</span>
                                    <div class="d-flex align-items-center gap-2">
                                        <input type="number" id="point-${item.id}" class="form-control text-center paper-question-input" data-id="${item.id}" data-maxpoint="${item.maxPoint}" data-categoryid="${item.categoryId}" placeholder="0" style="max-width:70px;width:70px;"${valueAttr}>
                                        <span class="fw-bold">/${item.maxPoint}</span>
                                    </div>
                                </div>`;
                    });
                    html += `<div class="mt-4 p-3 bg-light rounded">
                                <div class="d-flex justify-content-between align-items-center fw-bold">
                                    <span>Tổng điểm:</span>
                                    <span><span id="totalEarnedScore">0</span>/<span id="totalMaxScore">${totalMaxPoint}</span></span>
                                </div>
                            </div>`;
                    $("#sessionId").val(response.sessionId);
                    $("#showlist_input").html(html);
                    $("#generalComment").val((response.generalComment || "").toString());
                    
                    updateTotalScore();
                    
                    $(document).on("input", ".paper-question-input", function () {
                        updateTotalScore();
                    });
                    
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
    
    function updateTotalScore() {
        let totalEarned = 0;
        $('#showlist_input .paper-question-input').each(function () {
            const point = parseInt($(this).val());
            if (!isNaN(point)) {
                totalEarned += point;
            }
        });
        $('#totalEarnedScore').text(totalEarned);
    }
    
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

    $("#fromDate, #toDate").on("change", function () {
        currentPage = 1;
        loadStudents();
    });

    $(document).on("click", "#btnReset", function () {
        $("#fromDate, #toDate, #searchInput").val("");
        syncDateInputs(); // MODIFIED HERE: Cập nhật trạng thái hiển thị
        currentPage = 1;
        loadStudents();
    });

    const handleDateChange = function() {
        if (this.value) {
            $(this).addClass('has-value');
        } else {
            $(this).removeClass('has-value');
        }
    };

    $(document).on("change input", ".date-input-custom", handleDateChange);

    function syncDateInputs() {
        $(".date-input-custom").each(function() {
            handleDateChange.call(this);
        });
    }

    $(document).on("click", "input[type='date']", function() {
        if (typeof this.showPicker === 'function') {
            this.showPicker();
        }
    });
});

function debounce(func, delay) {
    let timeout;
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), delay);
    };
}