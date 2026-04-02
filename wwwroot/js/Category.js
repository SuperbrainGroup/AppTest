$(document).ready(function () {
    function Loadlist() {
        $.ajax({
            url: "/GetListCategory",
            type: "GET",
            data: {},
            success: function (data) {
                var html = "";
                $.each(data.cat, function (index, item) {
                    const color = item.color || "#198754";
                    html += `<tr class="btn-toggle" data-id="${item.id}">
                                <td class="text-center align-content-center">${index + 1}</td>
                                <td class="align-content-center">
                                    <span class="cat-swatch" style="background:${color};"></span>
                                    ${item.name}
                                </td>
                                <td class="align-content-center">${item.description}</td>
                                <td class="text-center align-content-center">${item.count}</td>
                                <td class="text-center align-content-center">${item.status}</td>
                                <td class="text-end me-3 align-content-center">
                                    <a href="#!" class="btn btn-sm btn-primary btn-edit" 
                                        data-id="${item.id}" 
                                        data-name="${item.name}" 
                                        data-description="${item.description}" 
                                        data-displayorder="${item.displayOrder}" 
                                        data-enable="${item.enable}"
                                        data-color="${item.color || ''}"><i class="ti ti-edit"></i></a>
                                    <button type="button" class="btn btn-sm btn-outline-danger btn-delete" data-id="${item.id}"><i class="ti ti-eraser"></i></button>
                                </td>
                            </tr>`;

                    const settingsHtml = (item.settings || []).map(a => {
                        return `
                            <div class="cat-setting-row" style="background:${color}12; border-left:4px solid ${color};">
                                <div style="min-width:0; flex:1;">
                                    <span class="badge" style="background:${color}20; color:${color}; font-weight:700;">
                                        Từ ${a.fromPoint} - ${a.toPoint} điểm.
                                    </span>
                                    <div class="mt-2 small opacity-75">${a.description || ""}</div>
                                </div>
                                <div class="d-flex gap-1">
                                    <button type="button" class="btn btn-sm btn-primary btn-editSetting" data-id="${a.id}"><i class="ti ti-edit"></i></button>
                                    <button type="button" class="btn btn-sm btn-outline-danger btn-deleteSetting" data-id="${a.id}"><i class="ti ti-eraser"></i></button>
                                </div>
                            </div>
                        `;
                    }).join("");

                    html += `
                        <tr class="answers-row" data-id="${item.id}">
                            <td colspan="6" style="padding:0;">
                                <div class="cat-toggle-content" data-cat="${item.id}">
                                    ${settingsHtml}
                                    <div class="cat-add-row" style="border-left:4px solid ${color}; background:${color}10;">
                                        <button type="button" class="btn btn-sm btn-success btn-addSetting" data-id="${item.id}">
                                            + Thêm cài đặt
                                        </button>
                                    </div>
                                </div>
                            </td>
                        </tr>
                    `;
                });
                $("#catTable").html(html);
            }
        });
    }Loadlist();

    $("#btnAdd").click(function () {
        $("#catId").val(0); // Reset ID
        $("#name").val("");
        $("#displayOrder").val("");
        $("#description").val("");
        $("#enable").val("");
        $("#color").val("#198754");
        $("#categoryModal").modal("show");
    });

    $(document).on("click", ".btn-edit", function () {
        var id = $(this).data("id");
        var name = $(this).data("name");
        var enable = $(this).data("enable");
        var description = $(this).data("description");
        var displayorder = $(this).data("displayorder");
        var color = $(this).data("color");

        $("#catId").val(id);
        $("#name").val(name);
        $("#displayOrder").val(displayorder);
        $("#description").val(description);
        $("#enable").val(enable.toString());
        $("#color").val(color || "#198754");
        $("#categoryModal").modal("show");
    });

    $(document).on("click", ".btn-delete", function () {
        var id = $(this).data("id");
        var el = this;
        showConfirm('Bạn có chắc chắn muốn xóa danh mục này?', function () {
            $.ajax({
                url: "/DeleteCategory",
                type: "POST",
                data: { id: id },
                success: function (response) {
                    if (response.success) {
                        Loadlist();
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

    $(document).on("click", ".btn-toggle", function (e) {
        // Không toggle khi bấm nút thao tác trong hàng danh mục
        if ($(e.target).closest(".btn-edit, .btn-delete, .btn-editSetting, .btn-deleteSetting, .btn-addSetting").length) {
            return;
        }

        const id = $(this).data("id");
        const $content = $(`.cat-toggle-content[data-cat="${id}"]`);
        if ($content.length === 0) return;

        const isOpen = $content.hasClass("open");
        $(".cat-toggle-content").removeClass("open");
        if (!isOpen) $content.addClass("open");
    });


    handleFormSubmit("#categoryForm", function (form, submitButton, originalText) {
        let formData = new FormData(form[0]);
        $.ajax({
            url: '/SaveChangeCategory',
            type: "POST",
            data: formData,
            processData: false,  // Không xử lý dữ liệu FormData
            contentType: false,  // Không đặt kiểu dữ liệu
            success: function (response) {
                if (response.success) {
                    Loadlist();
                    $(".form-control").val();
                    $("#categoryModal").modal("hide");
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

    $(document).on("click", ".btn-addSetting", function () {
        const id = $(this).data("id");
        $("#categoryId").val(id);
        $("#settingId").val(0);
        $(".form-control").val("");
        $("#settingModal").modal("show");
    });

    $(document).on("click", ".btn-editSetting", function () {
        const id = $(this).data("id");
        $.ajax({
            url: '/Admin/Category/GetSettingById',
            type: 'GET',
            data: { id: id },
            success: function (data) {
                if (data.success) {
                    $("#settingId").val(data.setting.id);
                    $("#categoryId").val(data.setting.categoryId);
                    $("#settingFrom").val(data.setting.fromPoint);
                    $("#settingTo").val(data.setting.toPoint);
                    $("#settingDescription").val(data.setting.description);
                    $("#settingModal").modal("show");
                }
            },
            error: function (xhr, status, error) {
                console.error("Lỗi tải đáp án để chỉnh sửa:" + error);
            }
        });
    });

    handleFormSubmit("#createSettingForm", function (form, submitButton, originalText) {
        let formData = new FormData(form[0]);
        $.ajax({
            url: '/Admin/Category/SavechangeSetting',
            type: "POST",
            data: formData,
            processData: false,  // Không xử lý dữ liệu FormData
            contentType: false,  // Không đặt kiểu dữ liệu
            success: function (response) {
                if (response.success) {
                    Loadlist();
                    $(".form-control").val();
                    $("#settingModal").modal("hide");
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

    $(document).on("click", ".btn-deleteSetting", function () {
        var id = $(this).data("id");
        var el = this;
        showConfirm('Bạn có chắc chắn muốn xóa cài đặt danh mục này?', function () {
            $.ajax({
                url: "/Admin/Category/DeleteSetting",
                type: "POST",
                data: { id: id },
                success: function (response) {
                    if (response.success) {
                        Loadlist();
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
});