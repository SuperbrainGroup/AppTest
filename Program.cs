using System;
using AppTest.Helper;
using AppTest.Models;
using AppTest.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
var builder = WebApplication.CreateBuilder(args);

builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<CheckUser>();
builder.Services.AddScoped<IStudentOverviewService, StudentOverviewService>();

// Add services to the container.
builder.Services.AddControllersWithViews();
builder.Services.AddHttpClient();
// Configure DbContext
builder.Services.AddDbContext<ModelDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services
    .AddAuthentication(CookieAuthenticationDefaults.AuthenticationScheme)
    .AddCookie(options =>
    {
        options.Cookie.Name = "app_auth";
        options.Cookie.HttpOnly = true;
        options.Cookie.SameSite = SameSiteMode.Lax;
        options.Cookie.SecurePolicy = builder.Environment.IsDevelopment()
            ? CookieSecurePolicy.SameAsRequest
            : CookieSecurePolicy.Always;

        options.ExpireTimeSpan = TimeSpan.FromDays(2);
        options.SlidingExpiration = true;

        // Mặc định login sẽ về trang đăng nhập cho "người học".
        options.LoginPath = "/dang-nhap";

        // Khi chưa login hoặc bị từ chối do thiếu quyền, redirect theo khu vực.
        options.Events = new CookieAuthenticationEvents
        {
            OnRedirectToLogin = context =>
            {
                var path = context.Request.Path.Value?.ToLower() ?? string.Empty;
                var isAjaxOrApi =
                    context.Request.Headers["X-Requested-With"] == "XMLHttpRequest" ||
                    context.Request.Headers["Accept"].ToString().Contains("application/json", StringComparison.OrdinalIgnoreCase);

                if (isAjaxOrApi)
                {
                    context.Response.StatusCode = StatusCodes.Status401Unauthorized;
                    return Task.CompletedTask;
                }

                if (path.StartsWith("/admin") || path.StartsWith("/gv"))
                    context.Response.Redirect("/gv/dang-nhap");
                else
                    context.Response.Redirect("/dang-nhap");
                return Task.CompletedTask;
            },
            OnRedirectToAccessDenied = context =>
            {
                var role = context.HttpContext.User.FindFirstValue(ClaimTypes.Role);
                if (string.Equals(role, AppRoles.Admin, StringComparison.OrdinalIgnoreCase))
                    context.Response.Redirect("/admin");
                else if (string.Equals(role, AppRoles.Teacher, StringComparison.OrdinalIgnoreCase))
                    context.Response.Redirect("/gv");
                else
                    context.Response.Redirect("/");
                return Task.CompletedTask;
            }
        };
    });

builder.Services.AddAuthorization(options =>
{
    options.AddPolicy(AppPolicies.AdminOnly, p => p.RequireRole(AppRoles.Admin));
    options.AddPolicy(AppPolicies.TeacherOnly, p => p.RequireRole(AppRoles.Teacher));
    options.AddPolicy(AppPolicies.StudentOnly, p => p.RequireRole(AppRoles.Student));
});

var app = builder.Build();

// Configure the HTTP request pipeline.
if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Home/Error");
}
app.UseStatusCodePages(async context =>
{
    if (context.HttpContext.Response.StatusCode == StatusCodes.Status404NotFound)
    {
        context.HttpContext.Response.Redirect("/Home/Error");
    }
});

app.UseHttpsRedirection();
app.UseStaticFiles();

app.UseRouting();
app.UseAuthentication();
app.UseAuthorization();

app.MapControllerRoute(
    name: "MyArea",
    pattern: "{area:exists}/{controller=Home}/{action=Index}/{id?}");
app.MapControllerRoute(
    name: "default",
    pattern: "{controller=Home}/{action=Index}/{id?}");

app.Run();
