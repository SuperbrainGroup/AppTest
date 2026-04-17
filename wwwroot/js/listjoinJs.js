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

                    // Disable nút Chi tiết nếu chưa có bài test
                    let btnDetailClass = student.hasTestResult ? "btn-outline-primary" : "btn-outline-secondary disabled";
                    let btnDetailDisabled = student.hasTestResult ? "" : "disabled";
                    let btnDetail = `<button class="btn btn-sm btn-icon ${btnDetailClass} fs-10 btn_chitiet" data-id="${student.id}" style="margin-left:6px;" ${btnDetailDisabled}><i class="ti ti-list-details"></i> Chi tiết</button>`;

                    // Luôn hiển thị nút Kết quả, nhưng disable nếu chưa có bài test
                    let btnKetquaClass = student.hasTestResult ? "btn-success" : "btn-outline-secondary disabled";
                    let btnKetquaDisabled = student.hasTestResult ? "" : "disabled";
                    let btn = `<button class="btn btn-sm btn-icon ${btnKetquaClass} fs-10 btn_ketqua" data-id="${student.id}" ${btnKetquaDisabled}><i class="ti ti-eye"></i> Kết quả</button>`;

                    if (student.hasTestResult) {
                        testCount = `<td class="text-center"><span class="text-success">${student.numberTest}</span></td>`;
                        testDate = `<td class="text-center">${formatDateVi(student.dateTest)}</td>`;
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
                                    ${btnDetail}
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

    $(document).on("click", ".btn_ketqua", function (e) {
        // Check nếu nút bị disabled thì không cho click
        if ($(this).prop("disabled")) {
            e.preventDefault();
            return false;
        }
        
        const id = $(this).data("id");
        window.AppStudentPrint.printResult(id, studentDirectory[id]);
    });

    $(document).on("click", ".btn_indethi", function () {
        window.AppStudentPrint.printExam($(this).data("id"));
    });

    $(document).on("click", ".btn_chitiet", function (e) {
        // Check nếu nút bị disabled thì không cho click
        if ($(this).prop("disabled")) {
            e.preventDefault();
            return false;
        }
        
        // Xử lý chuyển hướng cho admin riêng biệt
        const studentId = $(this).attr("data-id"); 
        if (studentId) {
            // Kiểm tra xem là admin hay giáo viên
            if (window.location.pathname.includes("/admin/")) {
                window.location.href = "/admin/student-overview/result-detail?studentId=" + encodeURIComponent(studentId);
            } else {
                window.location.href = "/gv/xem-ket-qua?studentId=" + encodeURIComponent(studentId);
            }
        } else {
            console.error("Không tìm thấy ID học viên");
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
