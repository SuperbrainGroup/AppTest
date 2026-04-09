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
        const id = $(this).data("id");
        window.AppStudentPrint.printResult(id, studentDirectory[id]);
    });

    $(document).on("click", ".btn_indethi", function () {
        window.AppStudentPrint.printExam($(this).data("id"));
    });
});

function debounce(func, delay) {
    let timeout;
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), delay);
    };
}
