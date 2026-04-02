    $(document).ready(function () {
        let currentIndex = 0;
        let startTime = new Date(); // 🔥 Lưu thời gian bắt đầu
        let data = [];
        let sessionId = 0;
        let allowReload = false; // Cờ kiểm soát việc reload

        let userAnswers = {}; // Lưu câu trả lời người dùng
        let filteredQuestions = []; // Danh sách câu hỏi đã lọc
        let categoryResults = {}; // Lưu tổng điểm của từng categoryId
        let categoryIndex = 0;
        let agegroupCheck = false;
        let allCategories = [];
        let currentCategoryId;
        let currentQuestionAudio = null;
        let totalQuestions = 0;

        $(window).on("keydown", function (e) {
            if (e.which === 116 || (e.ctrlKey && e.which === 82)) { // 116 = F5, Ctrl+R
                e.preventDefault();
                confirmReload();
            }
        });

        // Kiểm tra khi đóng tab hoặc tải lại trang
        window.addEventListener("beforeunload", function (e) {
            if (!allowReload) {
                e.preventDefault();
                e.returnValue = ""; // Chỉ hiển thị cảnh báo mặc định của trình duyệt
            }
        });

        function confirmReload() {
            let confirmation = confirm("Bạn có chắc chắn muốn làm lại bài kiểm tra không?");
            if (confirmation) {
                resetSession();
            }
        }
        function resetSession() {
            $.ajax({
                url: "/ResetTest",
                type: "POST",
                data: { sessionId },
                success: function (response) {
                    if (response.success) {
                        allowReload = true; // Cho phép reload
                        setTimeout(() => {
                            window.location.reload();
                        }, 1000);
                    }
                }
            });
        }
        // Lấy SessionId khi bắt đầu
        function getSession() {
            $.ajax({
                url: '/StartTest',
                type: 'GET',
                success: function (response) {
                    if (response.success) {
                        sessionId = response.sessionId;
                        const lopVal = response.lop != null ? response.lop : response.agegroup;
                        $("#ageGroup").val(lopVal);
                        loadQuestions();
                    } else {
                        showNotification(response.message || "Không bắt đầu được bài kiểm tra.");
                    }
                }
            });
        }
        function loadQuestions() {
            $.ajax({
                url: '/GetRandomQuestions',
                type: 'GET',
                success: function (response) {
                    if (response.success) {
                        if (response.lop != null) {
                            $("#ageGroup").val(response.lop);
                        }
                        filterAndLoadQuestions(response.data || []);
                    } else {
                        showNotification(response.message || "Không tìm thấy câu hỏi!");
                    }
                },
                error: function (xhr, status, error) {
                    console.error("Lỗi tải câu hỏi: " + error);
                }
            });
        }

        function filterAndLoadQuestions(rawData) {
            if (!rawData || rawData.length === 0) {
                showNotification("Chưa cài đặt câu hỏi cho lớp của học viên. Vui lòng liên hệ quản trị.");
                data = [];
                totalQuestions = 0;
                return;
            }
            data = rawData;
            totalQuestions = data.length;
            currentIndex = 0;
            updateProgress();
            displayQuestion(currentIndex);
        }

        function maxPointForQuestion(question) {
            if (!question || !question.answers || !question.answers.length) {
                return 0;
            }
            return Math.max(0, ...question.answers.map((a) => Number(a.point) || 0));
        }

        function displayQuestion(index) {
            $("#next-btn").html(`Bỏ qua <i class="ti ti-arrow-narrow-right"></i>`);
            $("#next-btn").addClass("btn-outline-secondary");
            $("#next-btn").removeClass("btn-success");

            $("#cardQuestion").removeClass("col-md-4");
            $("#cardQuestion").addClass("col-md-12");
            $("#cardReview").addClass("d-none");

            // Kiểm tra xem đã hết câu hỏi chưa
            if (index >= data.length) {
                finishTest(); // 🔥 Kết thúc bài test
                return;
            }

            let question = data[index];
            // Đổi màu progress bar theo danh mục của câu hiện tại
            const bar = document.getElementById("quizProgressBar");
            if (bar && question && question.categoryColor) {
                bar.classList.remove("bg-success");
                bar.style.backgroundColor = question.categoryColor;
            }
            if (question.categoryId !== currentCategoryId) {
                currentCategoryId = question.categoryId;
            } else {
                // Ẩn tiêu đề category nếu vẫn trong category cũ
                $("#category-title-container").addClass('d-none');
            }

            // Câu hỏi: ảnh minh họa (nếu có)
            $("#questionImage").attr("src", question.image);
            if (question.hasImage) {
                $("#questionImage").removeClass("d-none");
            } else {
                $("#questionImage").addClass("d-none");
            }

            // Câu hỏi: text
            $("#question-text").text(question.name);

            // Audio câu hỏi (nếu có)
            const audioEl = document.getElementById("audio-player");
            const playBtn = $("#btnPlayAudio");
            if (audioEl) {
                audioEl.pause();
                audioEl.currentTime = 0;
            }
            if (question.hasAudio && question.audio) {
                if (audioEl) {
                    audioEl.src = question.audio;
                    currentQuestionAudio = audioEl;
                }
                playBtn.removeClass("d-none");
            } else {
                if (audioEl) {
                    audioEl.removeAttribute("src");
                    currentQuestionAudio = null;
                }
                playBtn.addClass("d-none");
            }

            // Đáp án: render dạng lưới card/button
            const $answersGrid = $("#answers-grid");
            $answersGrid.empty(); // Xóa các câu trả lời cũ

            question.answers.forEach(answer => {
                let stringAnswer = "";
                let answerText = "";
                let optionClass = "";
                if (answer.answerText != null) { // Kiểm tra null thay vì null hoặc rỗng
                    answerText = answer.answerText;
                    stringAnswer = answerText;
                }
                if (answer.hasImage) {
                    optionClass = "has-image";
                    stringAnswer = `
                        ${stringAnswer ? `<span class="answer-text">${stringAnswer}</span>` : ""}
                        <img src="${answer.image}" alt="" />
                    `;
                } else if (stringAnswer) {
                    stringAnswer = `<span class="answer-text">${stringAnswer}</span>`;
                }
                $answersGrid.append(`
                <button type="button"
                    class="answer-item ${optionClass}"
                    data-image="${answer.image || ''}"
                    data-textanswer="${answerText || ''}"
                    data-has-image="${optionClass ? 'true' : 'false'}"
                    data-answer-id="${answer.id}"
                    data-category-id="${question.categoryId}"
                    data-point="${answer.point}"
                    data-max-point-category="${question.maxPointCategory}">${stringAnswer}
                </button>
            `);
            });

            // Gắn sự kiện click cho các câu trả lời mới được tạo
            $(".answer-item").off("click").on("click", function () {
                $("#next-btn").removeClass("btn-outline-secondary");
                $("#next-btn").addClass("btn-success");
                $("#next-btn").html(`Câu tiếp theo <i class="ti ti-arrow-narrow-right"></i>`);
                $(".answer-item").removeClass("selected");
                $(this).addClass("selected");
            });

            questionStartTime = Date.now();
            $("#next-btn").show();
        }

        $("#next-btn").click(function () {
            let selectedAnswer = $(".answer-item.selected");
            let question = data[currentIndex];
            const studentLop = parseInt($("#ageGroup").val(), 10) || 0;

            if (selectedAnswer.length > 0) {
                let point = parseFloat(selectedAnswer.data("point"));
                let qCategoryId = question.categoryId;
                const maxCat = parseFloat(selectedAnswer.data("max-point-category")) || 0;

                if (!categoryResults[qCategoryId]) {
                    categoryResults[qCategoryId] = {
                        earnedPoints: 0,
                        maxPoints: maxCat,
                        lopActual: studentLop
                    };
                }
                categoryResults[qCategoryId].earnedPoints += point;
                if (!categoryResults[qCategoryId].maxPoints && maxCat) {
                    categoryResults[qCategoryId].maxPoints = maxCat;
                }

                const maxQ = maxPointForQuestion(question);
                const txt = (selectedAnswer.data("textanswer") || "").toString();
                userAnswers[question.id] = {
                    answerId: selectedAnswer.data("answer-id"),
                    point: point,
                    categoryId: qCategoryId,
                    label: txt,
                    maxPointQuestion: maxQ
                };
            }

            currentIndex++;
            updateProgress();

            if (currentIndex < data.length) {
                displayQuestion(currentIndex);
            } else {
                finishTest();
            }
        });

        $("#btn-restart").click(function () {
            resetSession();
        });

        function escapeHtml(str) {
            if (str == null || str === "") {
                return "";
            }
            return $("<div/>").text(str).html();
        }

        function buildReviewHtml() {
            let rows = "";
            data.forEach(function (q, i) {
                const ua = userAnswers[q.id];
                const maxQ = maxPointForQuestion(q);
                let statusHtml = "";
                let detail = "";
                if (!ua) {
                    statusHtml = '<span class="badge text-bg-secondary">Chưa trả lời</span>';
                    detail = "—";
                } else {
                    const ok = maxQ > 0 && ua.point >= maxQ;
                    statusHtml = ok
                        ? '<span class="badge text-bg-success">Đúng</span>'
                        : '<span class="badge text-bg-danger">Sai</span>';
                    detail = escapeHtml(ua.label || "(Có hình / không có chữ)");
                }
                rows +=
                    "<tr><td class=\"text-center\">" +
                    (i + 1) +
                    '</td><td class="small text-start">' +
                    escapeHtml(q.name || "") +
                    '</td><td class="small">' +
                    detail +
                    "</td><td>" +
                    statusHtml +
                    "</td></tr>";
            });
            $("#review-table-body").html(rows);
        }

        // Kết thúc bài test
        function finishTest() {
            $("#quiz-container").addClass("d-none");
            $("#header-question").addClass("d-none");
            $("#result").removeClass("d-none");

            let endTime = new Date();
            let durationInSeconds = Math.round((endTime - startTime) / 1000); // Thời gian tính bằng giây

            // Hiển thị tổng thời gian làm bài
            const minutesTotal = Math.floor(durationInSeconds / 60);
            const secondsTotal = durationInSeconds % 60;
            $("#totalTimeLabel").text(
                `Thời gian làm bài: ${minutesTotal} phút ${secondsTotal.toString().padStart(2, "0")} giây`
            );
            buildReviewHtml();

            const studentLop = parseInt($("#ageGroup").val(), 10) || 0;
            let categoryResultList = [];

            for (let catId in categoryResults) {
                const result = categoryResults[catId];
                categoryResultList.push({
                    categoryId: parseInt(catId, 10),
                    earnedPoints: result.earnedPoints || 0,
                    maxPoints: result.maxPoints || 0,
                    ageGroup: result.lopActual != null ? result.lopActual : studentLop
                });
            }
            // Gửi về server (lưu cả kết quả theo category và kết quả theo từng câu)
            const saveCategoryReq = $.ajax({
                url: '/SaveCategoryResult',
                type: 'POST',
                contentType: 'application/json',
                data: JSON.stringify({
                    sessionId: sessionId,
                    categoryResults: categoryResultList
                })
            });

            const questionResultsList = data.map((q) => {
                const ua = userAnswers[q.id];
                const maxQ = Math.max(0, maxPointForQuestion(q));
                const earned = ua ? Math.round(ua.point || 0) : 0;
                return {
                    SessionId: sessionId,
                    QuestionId: q.id,
                    PointEarned: earned,
                    MaxPoint: maxQ
                };
            });

            const saveQuestionReq = $.ajax({
                url: '/SaveQuestionResults',
                type: 'POST',
                contentType: 'application/json',
                data: JSON.stringify(questionResultsList)
            });

            $.when(saveCategoryReq, saveQuestionReq).done(function () {
                $.ajax({
                    url: "/FinishTest",
                    type: "POST",
                    data: {
                        sessionId,
                        durationInSeconds: durationInSeconds
                    },
                    success: function (response) {
                        if (response.success) {
                            console.log("Đã cập nhật hoàn thành bài kiểm tra.");
                        } else {
                            console.log("Lưu thất bại:", response.message);
                        }
                    }
                });
            }).fail(function (xhr) {
                console.log("⚠️ Không lưu được đầy đủ kết quả:", xhr && xhr.responseText ? xhr.responseText : xhr);
            });
        }

        function updateProgress() {
            const bar = document.getElementById("quizProgressBar");
            const $text = $("#quizProgressText");
            if (!bar || !totalQuestions) {
                return;
            }
            const answered = Math.min(currentIndex, totalQuestions);
            const pct = Math.round((answered / totalQuestions) * 100);
            bar.style.width = pct + "%";
            bar.setAttribute("aria-valuenow", pct.toString());
            if ($text.length) {
                $text.text(`Đã làm ${answered}/${totalQuestions}`);
            }
        }
        getSession();

        // Nút phát audio cho câu hỏi (chỉ khi có file audio upload)
        $("#btnPlayAudio").click(function () {
            const audioEl = document.getElementById("audio-player");
            if (!audioEl || !audioEl.src) {
                return;
            }
            try {
                audioEl.pause();
                audioEl.currentTime = 0;
                audioEl.play();
            } catch (e) {
                console.error("Không phát được audio câu hỏi:", e);
            }
        });

        //End Document
    });

    var sec = 0;
    function pad(val) { return val > 9 ? val : "0" + val; }
    setInterval(function () {
        document.getElementById("seconds").innerHTML = pad(++sec % 60);
        document.getElementById("minutes").innerHTML = pad(parseInt(sec / 60, 10));
    }, 1000);
