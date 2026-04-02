$(document).ready(function () {
    LoadlistSettings();
});
function LoadlistSettings() {
    $.ajax({
        url: '/LoadTestSetting',
        type: 'GET',
        data: {},
        success: function (response) {
            if (response.success) {
                let html = "";
                response.data.forEach(q => {
                    html += `
                                <li>
                                    <span class="question" onclick="toggleAnswers(${q.ageGroup})">📌 ${q.ageText} </span>
                                    <ul id="answers-${q.ageGroup}" class="answers" style="display: none; margin-left: 15px;">
                            `;
                    q.categories.forEach(a => {
                        html += `<li> ${a.categoryName}  <span class="badge bg-light text-success">${a.questionCount} câu.</span></li>`;
                    });
                    html += `</ul></li>`;
                });
                $("#testsetting-list").html(html);
            } else {
                alert(response.message);
            }
        },
        error: function (xhr, status, error) {
            console.error("Lỗi đăng nhập:" + error);
        }
    });
}
function toggleAnswers(id) {
    $("#answers-" + id).toggle();
}