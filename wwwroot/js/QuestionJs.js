$(document).ready(function () {
    const $categorySelect = $("#categorySelect");
    const $createCategoryId = $("#createCategoryId");
    const $tblQuestion = $("#tblQuestion");
    const $createModal = $("#createModal");

    function LoadCategoryQuestions() {
        $tblQuestion.html("<div class='text-center text-muted py-4'>Đang tải dữ liệu câu hỏi, vui lòng đợi ...</div>");
        $.ajax({
            url: '/GetCategoryQuestions',
            type: 'GET',
            success: function (data) {
                $createCategoryId.empty().append('<option value="0">Chọn danh mục</option>');
                $categorySelect.empty().append('<option value="0">Chọn danh mục</option>');

                data.categories.forEach((item, index) => {
                    const selected = index === 0 ? 'selected' : '';
                    $categorySelect.append(`<option value="${item.id}" ${selected}>${item.name}</option>`);
                    $createCategoryId.append(`<option value="${item.id}">${item.name}</option>`);
                });
                LoadlistQuestion();
            },
            error: function (xhr, status, error) {
                console.error("Lỗi tải danh mục: " + error);
            }
        });
    }
    LoadCategoryQuestions();

    function LoadlistQuestion() {
        $tblQuestion.html("<div class='text-center text-muted py-4'>Đang tải dữ liệu câu hỏi, vui lòng đợi ...</div>");
        $.ajax({
            url: '/LoadListQuestion',
            type: 'GET',
            data: {
                categoryId: $categorySelect.val(),
                searchString: $("#searchString").val()
            },
            success: function (response) {
                if (response.success) {
                    let body = "";
                    let displayCount = 0; 
                    let filterLop = $("#classFilter").val(); 

                    $.each(response.data, function (index, q) {
                        let qLop = String(q.lop != null ? q.lop : (q.Lop != null ? q.Lop : ""));
                        
                        if (filterLop !== "" && filterLop !== qLop) {
                            return true; 
                        }

                        let displayLop = "-";
                        let lv = q.lop != null ? q.lop : q.Lop;
                        if (lv !== null && lv !== undefined) {
                            if (lv == -2) displayLop = "Mầm";
                            else if (lv == -1) displayLop = "Chồi";
                            else if (lv == 0) displayLop = "Lá";
                            else if (lv == 6) displayLop = "Lớp 5+";
                            else displayLop = "Lớp " + lv;
                        }

                        displayCount++; 
                        let count = 0;
                        q.answers.forEach(() => count++);
                        const imageQuestion = q.image ? `<img src="${q.image}" class="rounded-2" width="42" height="42" alt="">` : "";
                        const audioEl = q.audio
                            ? `<audio id="audio-question-${q.id}" preload="none" src="${q.audio}" style="display:none;"></audio>`
                            : "";

                        const replayBtn = q.audio
                            ? `<button type="button" class="btn btn-sm btn-outline-primary btn-replayAudio" data-id="${q.id}">
                                    <i class="ti ti-player-play-filled"></i> Nghe lại
                               </button>`
                            : "";

                        const status = q.onPaper
                            ? `<button class="btn-warning btn-toggle-onpaper" style="font-size: 0.875rem;" type="button" data-id="${q.id}">
                                    <span class="badge-label"><i class="fas fa-toggle-off"></i> Bài tập trên giấy</span>
                               </button>`
                            : `<button class="btn-success btn-toggle-onpaper" style="font-size: 0.875rem;" type="button" data-id="${q.id}">
                                    <i class="fas fa-toggle-on"></i> Bài tập trên máy
                               </button>`;

                        const answersHtml = q.answers.map(a => {
                            const imageAnswer = a.image ? `<img src="${a.image}" class="rounded-2" width="42" height="42" alt="">` : "";
                            return `
                                <div class="list-group-item d-flex align-items-center justify-content-between gap-3 mb-2 admin-answer-item"
                                     style="background:#20c99710; border:1px solid rgba(0,0,0,.08); border-radius:12px;">
                                    <div class="d-flex align-items-center gap-2" style="min-width:0;">
                                        ${imageAnswer}
                                        <div style="min-width:0">
                                            <div class="fw-semibold text-truncate">${a.answerText}</div>
                                            <div class="small text-success">${a.point} điểm</div>
                                        </div>
                                    </div>
                                    <div class="d-flex gap-1">
                                        <button type="button" class="btn btn-sm btn-primary btn-editAnswer" data-id="${a.id}"><i class="ti ti-edit"></i></button>
                                        <button type="button" class="btn btn-sm btn-outline-danger btn-deleteAnswer" data-id="${a.id}"><i class="ti ti-eraser"></i></button>
                                    </div>
                                </div>
                            `;
                        }).join("");

                        body += `
                            <div class="card admin-question-card question-toggle-card" data-id="${q.id}"
                                 style="border:1px solid rgba(0,0,0,.08); border-radius:14px; overflow:hidden; border-left:6px solid ${q.categoryColor || '#198754'}; cursor:pointer;">
                                <div class="card-body px-3 py-2">
                                    <div class="d-flex align-items-start justify-content-between gap-2">
                                        <div class="d-flex align-items-center gap-2" style="min-width:0;">
                                            <div class="text-center" style="width:44px;">
                                                <div class="fw-semibold">${displayCount}</div> </div>
                                            <div class="text-center" style="width:44px;">
                                                ${imageQuestion}
                                            </div>
                                            <div style="min-width:0;">
                                                <div class="d-flex align-items-center flex-wrap gap-2">
                                                    ${status}
                                                    <div class="fw-semibold text-truncate" style="max-width:520px;">${q.name}</div>
                                                </div>
                                                <div class="small opacity-75 mt-1">
                                                    <span class="me-3"><b>Lớp:</b> ${displayLop}</span>
                                                    <span class="me-3"><b>Điểm:</b> ${q.maxPoint}</span>
                                                    <span class="me-3">
                                                        <b>Danh mục:</b>
                                                        <span class="q-cat-pill"
                                                              style="display:inline-block; border:1px solid ${q.categoryColor || '#198754'}; background:${(q.categoryColor || '#198754')}20; color:${q.categoryColor || '#198754'}; padding:2px 8px; border-radius:999px; font-weight:700;">
                                                            ${q.categoryName}
                                                        </span>
                                                    </span>
                                                    <span class="me-3"><b>Đáp án:</b> ${count}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div class="d-flex flex-wrap justify-content-end align-items-center gap-2">
                                            ${replayBtn}
                                            <button type="button" class="btn btn-sm btn-primary btn-editQuestion" data-id="${q.id}">
                                                <i class="ti ti-edit"></i> Sửa
                                            </button>
                                            <button type="button" class="btn btn-sm btn-outline-danger btn-deleteQuestion" data-id="${q.id}">
                                                <i class="ti ti-eraser"></i> Xóa
                                            </button>
                                            ${audioEl}
                                        </div>
                                    </div>
                                </div>

                                <div class="collapse" id="collapse-answers-${q.id}">
                                    <div class="card-body pt-0">
                                        <div class="d-flex justify-content-between align-items-center mb-2">
                                            <div class="fw-semibold">Danh sách đáp án</div>
                                            <button type="button" class="btn btn-sm btn-success btn-addAnswer" data-id="${q.id}">
                                                + Thêm đáp án
                                            </button>
                                        </div>
                                        <div class="list-group">
                                            ${answersHtml}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        `;
                    });

                    $("#counts").text(displayCount);
                    
                    if (displayCount > 0) {
                        $tblQuestion.html(body);
                    } else {
                        $tblQuestion.html("<div class='text-center text-muted py-4'>Không có câu hỏi nào phù hợp với bộ lọc!</div>");
                    }

                } else {
                    $tblQuestion.html("<div class='text-center text-muted py-4'>Không tìm thấy dữ liệu câu hỏi!</div>");
                }
            },
            error: function (xhr, status, error) {
                console.error("Lỗi tải câu hỏi:" + error);
            }
        });
    }

    // Xử lý khi thay đổi Danh mục hoặc Lớp
    $("#categorySelect, #classFilter").change(function () {
        LoadlistQuestion();
    });

    $("#searchString").on("input", debounce(function () {
        LoadlistQuestion();
    }, 700));
    // 3️⃣ Xử lý khi thay đổi số lượng user mỗi trang
    $("#categorySelect").change(function () {
        LoadlistQuestion();
    });

    $("#searchString").on("input", debounce(function () {
        LoadlistQuestion();
    }, 700));

    function toggleAnswers(questionId) {
        const collapseEl = document.getElementById(`collapse-answers-${questionId}`);
        if (!collapseEl) return;

        const isOpen = collapseEl.classList.contains("show");

        // Bootstrap 5: dùng Collapse để animation đúng.
        if (window.bootstrap && window.bootstrap.Collapse) {
            // Đóng các câu hỏi đang mở khác để đảm bảo chỉ 1 lần 1 câu hỏi.
            if (!isOpen) {
                $tblQuestion.find('.collapse.show').each(function () {
                    if (this.id !== collapseEl.id) {
                        window.bootstrap.Collapse.getOrCreateInstance(this, { toggle: false }).hide();
                    }
                });
            }

            const instance = window.bootstrap.Collapse.getOrCreateInstance(collapseEl, { toggle: false });
            if (isOpen) instance.hide();
            else instance.show();

            // Đồng bộ aria-expanded cho nút toggle (nếu có).
            const $btn = $tblQuestion.find(`.btn-toggle-answers[data-question-id="${questionId}"]`);
            $tblQuestion.find(".btn-toggle-answers").each(function () {
                const qid = this.getAttribute("data-question-id");
                const el = document.getElementById(`collapse-answers-${qid}`);
                this.setAttribute("aria-expanded", el && el.classList.contains("show") ? "true" : "false");
            });
        } else {
            // fallback
            $tblQuestion.find('.collapse').removeClass('show');
            collapseEl.classList.toggle('show');
        }
    }

    // 1) Click card để toggle đáp án (thay vì chỉ click nút)
    $(document).on("click", ".question-toggle-card", function (e) {
        // Không toggle nếu người dùng click vào các nút/thành phần thao tác
        if ($(e.target).closest("button, a, input, select, textarea, label, .btn, .form-control, .form-select").length) {
            // nhưng vẫn cho phép nút .btn-toggle-answers chạy logic toggle bên dưới
            if ($(e.target).closest(".btn-toggle-answers").length) return;
            return;
        }
        toggleAnswers($(this).data("id"));
    });

    // 2) Nút "Đáp án" cũng chạy cùng 1 logic (không dùng data-bs-toggle nữa)
    $(document).on("click", ".btn-toggle-answers", function (e) {
        e.stopPropagation();
        const qid = $(this).data("questionId");
        toggleAnswers(qid);
    });

    $(document).on("click", "#btn-add", function () {
        $("#createId").val(0);
        $(".form-control").val("");
        $("#createLop").val("1");
        $createModal.modal("show");
        $("#audioPreviewPlayer").attr("src", "");
        $("#audioPreviewContainer").hide();
    });

    // Preview audio ngay khi người dùng chọn file mới (chưa cần bấm lưu)
    $(document).on("change", "#createAudio", function () {
        const file = this.files && this.files.length > 0 ? this.files[0] : null;
        if (!file) {
            $("#audioPreviewPlayer").attr("src", "");
            $("#audioPreviewContainer").hide();
            return;
        }
        const url = URL.createObjectURL(file);
        $("#audioPreviewPlayer").attr("src", url);
        $("#audioPreviewContainer").show();
    });

    $(document).on("click", ".btn-editQuestion", function () {
        const id = $(this).data("id");
        $.ajax({
            url: '/Admin/Question/GetQuestionById',
            type: 'GET',
            data: { id: id },
            success: function (data) {
                if (data.success) {
                    $("#createId").val(data.question.id);
                    $("#createName").val(data.question.name);
                    $("#createCategoryId").val(data.question.categoryId);
                    var lv = data.question.lop != null ? data.question.lop : data.question.Lop;
                    $("#createLop").val(lv != null ? String(lv) : "1");
                    $("#maxPoint").val(data.question.maxPoint);
                    if (data.question.audio) {
                        $("#audioPreviewPlayer").attr("src", data.question.audio);
                        $("#audioPreviewContainer").show();
                    } else {
                        $("#audioPreviewPlayer").attr("src", "");
                        $("#audioPreviewContainer").hide();
                    }
                    $createModal.modal("show");
                }
            },
            error: function (xhr, status, error) {
                console.error("Lỗi tải câu hỏi để chỉnh sửa:" + error);
            }
        });
    });

    handleFormSubmit("#createQuestionForm", function (form, submitButton, originalText) {
        let formData = new FormData(form[0]);
        $.ajax({
            url: '/Admin/Question/SaveChange',
            type: "POST",
            data: formData,
            processData: false,  // Không xử lý dữ liệu FormData
            contentType: false,  // Không đặt kiểu dữ liệu
            success: function (response) {
                if (response.success) {
                    LoadlistQuestion();
                    $(".form-control").val();
                    $(".form-select").val();
                    $("#createModal").modal("hide");
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

    $(document).on("click", ".btn-deleteQuestion", function () {
        var id = $(this).data("id");
        var el = this;
        showConfirm('Bạn có chắc chắn muốn xóa câu hỏi này?', function () {
            $.ajax({
                url: "/SubmitDeleteQuestion",
                type: "POST",
                data: { id: id },
                success: function (response) {
                    if (response.success) {
                        LoadlistQuestion();
                        showNotification(response.message);
                    } else {
                        showNotification(response.message);
                    }
                },
                complete: function () {
                    // Bật lại nút sau khi xử lý xong
                    $(el).prop("disabled", false);
                }
            });
        }, el);
    });

    $(document).on("click", ".btn-toggle-onpaper", function () {
        var id = $(this).data("id");
        var el = this;
        showConfirm('Bạn có chắc chắn muốn cập nhật trạng thái câu hỏi này?', function () {
            $.ajax({
                url: "/Admin/Question/ToggleOnPaper",
                type: "POST",
                data: { id: id },
                success: function (response) {
                    if (response.success) {
                        LoadlistQuestion();
                        showNotification(response.message);
                    } else {
                        showNotification(response.message);
                    }
                },
                complete: function () {
                    // Bật lại nút sau khi xử lý xong
                    $(el).prop("disabled", false);
                }
            });
        }, el);
    });

    $(document).on("click", ".btn-replayAudio", function () {
        const id = $(this).data("id");
        const audio = document.getElementById(`audio-question-${id}`);
        if (!audio) return;
        audio.currentTime = 0;
        audio.play();
    });

    $(document).on("click", ".btn-addAnswer", function () {
        const id = $(this).data("id");
        $("#questionId").val(id);
        $("#answerId").val(0);
        $(".form-control").val("");
        $("#exampleModal").modal("show");
    });

    $(document).on("click", ".btn-editAnswer", function () {
        const id = $(this).data("id");
        $.ajax({
            url: '/Admin/Question/GetAnswerById',
            type: 'GET',
            data: { id: id },
            success: function (data) {
                if (data.success) {
                    $("#answerId").val(data.answer.id);
                    $("#questionId").val(data.answer.questionId);
                    $("#floatingText").val(data.answer.answerText);
                    $("#floatingPoint").val(data.answer.point);
                    $("#exampleModal").modal("show");
                }
            },
            error: function (xhr, status, error) {
                console.error("Lỗi tải đáp án để chỉnh sửa:" + error);
            }
        });
    });

    handleFormSubmit("#createAnswerForm", function (form, submitButton, originalText) {
        let formData = new FormData(form[0]);
        $.ajax({
            url: '/Admin/Question/SaveChangeAnswer',
            type: "POST",
            data: formData,
            processData: false,  // Không xử lý dữ liệu FormData
            contentType: false,  // Không đặt kiểu dữ liệu
            success: function (response) {
                if (response.success) {
                    LoadlistQuestion();
                    $(".form-control").val();
                    $(".form-select").val();
                    $("#exampleModal").modal("hide");
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

    $(document).on("click", ".btn-deleteAnswer", function () {
        var id = $(this).data("id");
        var el = this;
        showConfirm('Bạn có chắc chắn muốn xóa đáp án này?', function () {
            $.ajax({
                url: "/SubmitDeleteAnswer",
                type: "POST",
                data: { id: id },
                success: function (response) {
                    if (response.success) {
                        LoadlistQuestion();
                        showNotification(response.message);
                    } else {
                        showNotification(response.message);
                    }
                },
                complete: function () {
                    $(el).prop("disabled", false);
                }
            });
        }, el);
    });
});

function debounce(func, delay) {
    let timeout;
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), delay);
    };
}