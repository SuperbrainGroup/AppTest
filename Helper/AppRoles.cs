namespace AppTest.Helper;

/// <summary>
/// Tên role thống nhất với claim <see cref="System.Security.Claims.ClaimTypes.Role"/>.
/// </summary>
public static class AppRoles
{
    public const string Admin = "admin";
    public const string Teacher = "teacher";
    public const string Student = "student";
}

/// <summary>
/// Tên policy ứng với từng role (đăng ký trong <c>Program.cs</c>).
/// </summary>
public static class AppPolicies
{
    public const string AdminOnly = nameof(AdminOnly);
    public const string TeacherOnly = nameof(TeacherOnly);
    public const string StudentOnly = nameof(StudentOnly);
}
