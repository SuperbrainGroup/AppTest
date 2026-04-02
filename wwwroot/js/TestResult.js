$(document).ready(function () {
    let currentPage = 1;
    let limit = $("#limitSelect").val();
    function loadStudents() {
        $.ajax({
            url: "/ListStudentTestResult",
            type: "GET",
            data: {
                limit: $("#limitSelect").val(),
                offset: (currentPage - 1) * limit,
                search: $("#searchInput").val()
            },
            success: function (response) {
                if (response.success) {
                    let students = response.data;
                    let tableBody = $("#studentTable");
                    tableBody.empty(); // Xóa dữ liệu cũ
                    students.forEach(student => {
                        let status = student.hasTestResult
                            ? '<a href="/admin/test/resultdetail?userId=' + student.id + '"><span class="text-success fw-bold">Đã làm bài</span></a>'
                            : '<span class="text-danger fw-bold">Chưa làm bài</span>';
                        tableBody.append(`
                            <tr>
                                <td class="text-center">${student.id}</td>
                                <td>${student.ten}</td>
                                <td>${student.email}</td>
                                <td class="text-center">${student.dienthoai}</td>
                                <td class="text-center">${status}</td>
                                <td class="text-center">${student.numberTest}</td>
                                <td class="text-end me-3">
                                    <a href="/admin/test/resultdetail?userId=${student.id}" class="btn btn-sm btn-icon btn-outline-dark"><i class="ti ti-eye"></i></a>
                                </td>
                            </tr>
                        `);
                    });
                } else {
                    showNotification("Lỗi khi tải danh sách học viên!");
                }
            },
            error: function () {
                alert("Không thể kết nối đến server!");
            }
        });
        document.getElementById("currentPage").textContent = currentPage;
    }

    document.getElementById("searchInput").onblur = function () {
        loadStudents();
    }

    document.getElementById("limitSelect").onchange = function () {
        loadStudents();
    };
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

    loadStudents();
});
