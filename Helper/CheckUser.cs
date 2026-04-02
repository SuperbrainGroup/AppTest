using Microsoft.AspNetCore.Http;
using System;
using System.Security.Claims;

namespace AppTest.Helper
{
    public class CheckUser
    {
        private readonly IHttpContextAccessor _httpContextAccessor;
        private ClaimsPrincipal? Principal => _httpContextAccessor.HttpContext?.User;

        public CheckUser(IHttpContextAccessor httpContextAccessor)
        {
            _httpContextAccessor = httpContextAccessor;
        }

        public int GetUserId()
        {
            var userIdValue =
                Principal?.FindFirstValue("userId") ??
                Principal?.FindFirstValue(ClaimTypes.NameIdentifier);

            if (int.TryParse(userIdValue, out var userId))
            {
                return userId;
            }
            return 0;
        }

        public string GetUsername()
        {
            // UI (UserInfo) dùng role claim làm nhãn hiển thị.
            return GetUserRole();
        }

        public string GetUserRole()
        {
            return Principal?.FindFirstValue(ClaimTypes.Role) ?? "";
        }

        public bool IsInRole(string role)
        {
            return !string.IsNullOrEmpty(role) &&
                   string.Equals(GetUserRole(), role, StringComparison.OrdinalIgnoreCase);
        }

        public bool IsAdmin => IsInRole(AppRoles.Admin);
        public bool IsTeacher => IsInRole(AppRoles.Teacher);
        public bool IsStudent => IsInRole(AppRoles.Student);
    }
}
