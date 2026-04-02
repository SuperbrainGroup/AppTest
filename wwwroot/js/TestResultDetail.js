$(document).ready(function () {
    function loadStudents() {
        $.ajax({
            url: "/GetProfile",
            type: "GET",
            data: {
                userId: $("#userId").val()
            },
            success: function (response) {
                if (response.success) {
                    $("#inputname").val(response.data.ten);
                    $("#inputEmailAddress").val(response.data.email);
                    $("#inputPhone").val(response.data.phhS_dienthoai);
                    $("#inputMaHS").val(response.data.mahs);
                    $("#inputUsername").val(response.data.userLog);
                    if (response.data.sex == "Nam" || response.data.sex == "nam") {
                        $("#imgprofile").attr("src", "https://demos.wrappixel.com/premium-admin-templates/react/elite-react/dark/static/media/user5.847ea5a9e28e437d4624.jpg");
                    }
                    else {
                        $("#imgprofile").attr("src", "https://angular.hibootstrap.com/daxa/images/users/user2.jpg");
                    }
                } else {
                    showNotification("Lỗi khi tải danh sách học viên!");
                }
            },
            error: function () {
                console.log("Không thể kết nối đến server!");
            }
        });
    } loadStudents();

    function loadTestResults() {
        $.ajax({
            url: "/GetTestResults",
            type: "GET",
            data: {
                userId: $("#userId").val()
            },
            success: function (response) {
                if (response.success) {
                    const categories = response.data[0].labels;
                    const series = response.data.map((test, index) => ({
                        name: `Lần test ${index + 1}`,
                        data: test.percentages
                    }));

                    let options = {
                        labels: ["Kiến thức", "So sánh", "Ma trận", "Từ vựng", "Superbrain"],
                        series: series,
                        chart: { height: 350, type: "radar" },
                        title: { text: "" },
                        xaxis: { categories: categories }
                    };

                    let chart = new ApexCharts(document.querySelector("#radar-chart"), options);
                    chart.render();
                } else {
                    showNotification("Lỗi khi tải danh sách học viên!");
                }
            },
            error: function () {
                console.log("Không thể kết nối đến server!");
            }
        });
    } loadTestResults();

});
