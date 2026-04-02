using AppTest.Helper;
using AppTest.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using System.Net.Http;
using System.Security.Cryptography;
using System.Text;
using System.Security.Claims;

namespace AppTest.Controllers
{
    public class AccountController : Controller
    {
        private readonly IHttpClientFactory _httpClientFactory;
        public AccountController(IHttpClientFactory httpClientFactory)
        {
            _httpClientFactory = httpClientFactory;
        }
        public IActionResult Index()
        {
            return View();
        }
        [HttpPost]
        public async Task<IActionResult> Login(string username,string password)
        {
            var apiUrl = $"http://45.119.82.38:6969/api/Teachers/Checklogins?Username={username}&Password={password}";

            using (var client = _httpClientFactory.CreateClient())
            {
                client.DefaultRequestHeaders.Add("accept", "text/plain");
                try
                {
                    var response = await client.GetAsync(apiUrl);
                    var responseData = await response.Content.ReadAsStringAsync();
                    var jsonResponse = JsonConvert.DeserializeObject<JObject>(responseData);
                    int status = jsonResponse["status"]?.Value<int>() ?? 0;
                    string message = jsonResponse["message"]?.ToString() ?? "Không có thông báo";

                    if (response.IsSuccessStatusCode)
                    {
                        if (jsonResponse != null)
                        {
                            if (status == 200)
                            {
                                var nhansu = jsonResponse["nhansu"];
                                int idNhanSu = nhansu?["id"]?.Value<int>() ?? 0;
                                int idChiNhanh = nhansu?["idChiNhanh"]?.Value<int>() ?? 0;

                                var role = idChiNhanh == 1 ? AppRoles.Admin : AppRoles.Teacher;
                                var redirectUrl = idChiNhanh == 1 ? "/admin" : "/gv";

                                // Ghi nhận userId + role vào cookie auth theo chuẩn ASP.NET Core.
                                var claims = new List<Claim>
                                {
                                    new Claim("userId", idNhanSu.ToString()),
                                    new Claim(ClaimTypes.Role, role)
                                };
                                var identity = new ClaimsIdentity(claims, CookieAuthenticationDefaults.AuthenticationScheme);
                                var principal = new ClaimsPrincipal(identity);

                                await HttpContext.SignInAsync(
                                    CookieAuthenticationDefaults.AuthenticationScheme,
                                    principal,
                                    new AuthenticationProperties
                                    {
                                        IsPersistent = true,
                                        ExpiresUtc = DateTimeOffset.UtcNow.AddDays(2)
                                    });

                                // Dọn cookie legacy để tránh còn cơ chế kém an toàn.
                                Response.Cookies.Delete("check");

                                return Json(new { success = true, message = "Đăng nhập thành công!", redirectUrl = redirectUrl });
                            }
                            else
                            {
                                return Json(new { success = false, message });
                            }
                        }
                        return Json(new { success = false ,message="Lỗi đăng nhập, vui lòng thử lại sau!"});
                    }
                    else
                    {
                        return Json(new{ success = false,  message  });
                    }
                }
                catch (Exception ex)
                {
                    // Ghi log lỗi ngoại lệ// Ghi log lỗi ngoại lệ
                    return Json(new { success = false, message = "An error occurred.", details = ex.Message });
                }
            }
        }

        [HttpPost]
        [AllowAnonymous]
        public async Task<IActionResult> LoginForStudent(string username, string password)
        {
            var apiUrl = $"http://45.119.82.38:6969/api/Students/CheckLogin?Username={username}&Password={password}";

            using (var client = _httpClientFactory.CreateClient())
            {
                client.DefaultRequestHeaders.Add("accept", "text/plain");
                try
                {
                    var response = await client.GetAsync(apiUrl);
                    var responseData = await response.Content.ReadAsStringAsync();
                    var jsonResponse = JsonConvert.DeserializeObject<JObject>(responseData);
                    int status = jsonResponse["status"]?.Value<int>() ?? 0;
                    string message = jsonResponse["message"]?.ToString() ?? "Không có thông báo";
                    //int courseId = jsonResponse["courseId"]?.Value<int>() ?? 0;
                    //string courseName = jsonResponse["courseName"]?.ToString() ?? "0";

                    if (response.IsSuccessStatusCode)
                    {
                        if (jsonResponse != null)
                        {
                            if (status == 200)
                            {
                                var hocvien = jsonResponse["hv"];
                                int hocvienId = hocvien?["id"]?.Value<int>() ?? 0;

                                var role = AppRoles.Student;
                                var redirectUrl = "/";

                                var claims = new List<Claim>
                                {
                                    new Claim("userId", hocvienId.ToString()),
                                    new Claim(ClaimTypes.Role, role)
                                };
                                var identity = new ClaimsIdentity(claims, CookieAuthenticationDefaults.AuthenticationScheme);
                                var principal = new ClaimsPrincipal(identity);

                                await HttpContext.SignInAsync(
                                    CookieAuthenticationDefaults.AuthenticationScheme,
                                    principal,
                                    new AuthenticationProperties
                                    {
                                        IsPersistent = true,
                                        ExpiresUtc = DateTimeOffset.UtcNow.AddDays(2)
                                    });

                                Response.Cookies.Delete("check");
                                return Json(new { success = true, message = "Đăng nhập thành công!", redirectUrl = redirectUrl });
                            }
                            else
                            {
                                return Json(new { success = false, message });
                            }
                        }

                        Console.WriteLine("lỗi: không xác định");
                        return Json(new { success = false, message = "Lỗi đăng nhập, vui lòng thử lại sau!" });
                    }
                    else
                    {
                        return Json(new { success = false, message });
                    }
                }
                catch (Exception ex)
                {
                    Console.WriteLine("Lỗi: "+ex);
                    return Json(new { success = false, message = "An error occurred.", details = ex.Message });
                }
            }
        }

        public async Task<User> GetStudentById(int userId) 
        {
            var user = new User();
            return user;
        }
        [AllowAnonymous]
        [HttpPost]
        public new async Task<IActionResult> SignOut()
        {
            // Đăng xuất khỏi cookie auth chuẩn.
            await HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);

            // Xóa cookie legacy cũ (nếu còn).
            if (Request.Cookies.ContainsKey("check"))
                Response.Cookies.Delete("check");

            var path = Request.PathBase.ToString().ToLower();
            string redirectUrl = "/";

            if (path.StartsWith("/admin"))
                redirectUrl = "/admin/dang-nhap";
            else if (path.StartsWith("/gv"))
                redirectUrl = "/gv/dang-nhap";
            else
                redirectUrl = "/dang-nhap";
            return Json(new { redirectUrl });
        }
    }
}
