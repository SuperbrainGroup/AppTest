using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.ViewComponents;
using AppTest.Helper;

namespace AppTest.ViewComponents
{
    public class UserInfoViewComponent : ViewComponent
    {
        private readonly CheckUser _checkUser;
        public UserInfoViewComponent(CheckUser checkUser)
        {
            _checkUser = checkUser;
        }
        public IViewComponentResult Invoke()
        {
            // Hệ thống auth mới dùng role claim thay vì decrypt cookie.
            var role = _checkUser.GetUserRole();
            return View("Default", role);
        }
    }
}
