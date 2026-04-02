function debounce(func, delay) {
    let timeout;
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), delay);
    };
}
function showNotification(notificationText) {
    var toastEl = $(".toast");
    var toast = new bootstrap.Toast(toastEl, {
        animation: true,
        autohide: true,
        delay: 3000
    });
    $("#notificationText").html(notificationText);
    toast.show();
}
function showConfirm(message, callback, element = null) {
    // Nếu có truyền element thì kiểm tra và disable
    if (element && $(element).prop("disabled")) return;
    if (element) $(element).prop("disabled", true);

    $.confirm({
        icon: 'fas fa-circle-question',
        title: 'Xác nhận',
        content: message,
        type: 'orange',
        autoClose: 'cancel|15000',
        alignMiddle: false,

        boxWidth: '500px',
        useBootstrap: false, // để có thể dùng columnClass
        columnClass: 'top-confirm',
        theme: 'bootstrap',
        buttons: {
            ok: {
                text: 'Xác nhận',
                btnClass: 'btn-warning',
                action: function () {
                    if (typeof callback === 'function') {
                        callback();
                    }
                }
            },
            cancel: {
                text: 'Hủy bỏ',
                action: function () { }
            }
        },
        onClose: function () {
            if (element) $(element).prop("disabled", false);
        }
    });
}
function handleFormSubmit(formSelector, submitCallback) {
    $(document).on("submit", formSelector, function (e) {
        e.preventDefault(); // Ngăn chặn hành động submit mặc định

        const form = $(this);
        const submitButton = form.find('button[type="submit"], input[type="submit"]'); // Tìm nút submit bên trong form

        if (submitButton.prop("disabled")) {
            return; // Nếu nút đã bị vô hiệu hóa, không làm gì cả
        }

        const originalText = submitButton.html();
        submitButton.prop("disabled", true).html('<i class="fas fa-spinner fa-spin me-1"></i> Đang xử lý...');

        // Gọi callback function để xử lý logic submit AJAX
        submitCallback(form, submitButton, originalText);
    });
}

window.addEventListener('DOMContentLoaded', event => {
    // Toggle the side navigation
    const sidebarToggle = document.body.querySelector('#sidebarToggle');
    if (sidebarToggle) {
        // Uncomment Below to persist sidebar toggle between refreshes
        // if (localStorage.getItem('sb|sidebar-toggle') === 'true') {
        //     document.body.classList.toggle('sb-sidenav-toggled');
        // }
        sidebarToggle.addEventListener('click', event => {
            event.preventDefault();
            document.body.classList.toggle('sb-sidenav-toggled');
            localStorage.setItem('sb|sidebar-toggle', document.body.classList.contains('sb-sidenav-toggled'));
        });
    }
});
function signout() {
    if (confirm("Bạn có chắc chắn muốn đăng xuất không?")) {
        $.post("/Account/SignOut", function (data) {
            if (data.redirectUrl) {
                window.location.href = data.redirectUrl;
            }
        });
    }
}