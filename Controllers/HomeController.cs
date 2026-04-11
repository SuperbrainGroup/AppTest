using AppTest.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Diagnostics;
using System.Linq;
using Microsoft.AspNetCore.Http;
using System.IO;
using Microsoft.AspNetCore.Authorization;
using Newtonsoft.Json.Linq;
using Newtonsoft.Json;
using System.Net.Http;
using System.Security.Cryptography;
using AppTest.Helper;
using AppTest.Areas.Admin.Controllers;

namespace AppTest.Controllers
{
    [Authorize(Policy = AppPolicies.StudentOnly)]
    public class HomeController : Controller
    {
        ModelDbContext _context;

        private readonly IHttpClientFactory _httpClientFactory;
        private readonly CheckUser _checkUser;
        public HomeController(IHttpClientFactory httpClientFactory, ModelDbContext context,CheckUser checkUser)
        {
            _httpClientFactory = httpClientFactory;
            _context = context;
            _checkUser = checkUser;
        }
        [AllowAnonymous]
        public IActionResult Error()
        {
            return View();
        }
        [ResponseCache(Duration = 0, Location = ResponseCacheLocation.None, NoStore = true)]
        public async Task<IActionResult> Index()
        {
            int userId = _checkUser.GetUserId();
            var user = await GetProfile(userId);
            
            if (user != null) TempData["name"] = user.ten; 

            var bg = await _context.AppSettings.FirstOrDefaultAsync(x => x.SettingKey == "StudentBackground");
            ViewBag.StudentBackground = bg?.SettingValue;
            return View();
        }
        [AllowAnonymous]
        [Route("dang-nhap")]
        public async Task<IActionResult> Login()
        {
            // MODIFIED HERE: Lấy ảnh nền từ DB gửi qua View
            var bg = await _context.AppSettings.FirstOrDefaultAsync(x => x.SettingKey == "StudentBackground");
            ViewBag.StudentBackground = bg?.SettingValue;
            
            return View();
        }

        [Route("bai-kiem-tra")]
        public async Task<IActionResult> TestPage()
        {
            int userId = _checkUser.GetUserId();
            var user = await GetProfile(userId);

            // MODIFIED HERE: Bảo vệ luồng dữ liệu
            if (user == null) return RedirectToAction("Error");
            TempData["name"] = user.ten;

            var bg = await _context.AppSettings.FirstOrDefaultAsync(x => x.SettingKey == "StudentBackground");
            ViewBag.StudentBackground = bg?.SettingValue;
            return View();
        }

        [Route("Stats")]
        public async Task<IActionResult> Stats()
        {
            int userId = _checkUser.GetUserId();
            var user = await GetProfile(userId);
            TempData["name"] = user.ten;
            var bg = await _context.AppSettings.FirstOrDefaultAsync(x => x.SettingKey == "StudentBackground");
            ViewBag.StudentBackground = bg?.SettingValue;
            return View();
        }
        public IActionResult Privacy()
        {
            return View();
        }

        [HttpGet]
        [Route("GetRandomQuestions")]
        public async Task<IActionResult> GetRandomQuestions()
        {
            int userId = _checkUser.GetUserId();
            var user = await GetProfile(userId);
            if (user == null)
            {
                return Json(new { success = false, message = "Không tải được hồ sơ học viên." });
            }

            int lop = user.lop;
            if (lop < 1 || lop > 12)
            {
                return Json(new { success = false, message = "Lớp học viên không hợp lệ (cần 1–12). Vui lòng kiểm tra dữ liệu trên hệ thống." });
            }

            var questions = await _context.Questions
                 .Include(q => q.Category)
                 .Where(q =>
                     q.Category.Enable == true &&
                     q.OnPaper == false &&
                     q.Lop == lop
                 )
                 .OrderBy(q => q.Category!.DisplayOrder ?? 0)
                 .ThenBy(q => q.Id)
                 .Select(q => new
                 {
                     q.Id,
                     q.Name,
                     q.CategoryId,
                     lop = q.Lop,
                     CategoryOrderBy = q.Category!.DisplayOrder,
                     CategoryName = q.Category != null ? q.Category.Name : "Unknown",
                    categoryColor = q.Category != null ? q.Category.Color : "#198754",
                     maxPointCategory = _context.Questions
                         .Where(x => x.CategoryId == q.CategoryId && x.Lop == lop)
                         .Sum(x => x.MaxPoint),
                     hasImage = q.Image != null,
                     q.Image,
                     hasAudio = q.Audio != null,
                     q.Audio,
                     Answers = q.Answers.Select(a => new
                     {
                         a.Id,
                         a.AnswerText,
                         hasImage = a.Image != null,
                         a.Image,
                         a.Point
                     }).ToList()
                 }).ToListAsync();

            return Json(new
            {
                success = true,
                data = questions,
                totalQuestion = questions.Count,
                lop
            });
        }

        [HttpGet]
        [Route("StartTest")]
        public async Task<IActionResult> StartTest()
        {
            int userId = _checkUser.GetUserId();
            var user = await GetProfile(userId);
            if (user == null)
            {
                return Ok(new { success = false, message = "Không tải được hồ sơ học viên." });
            }

            int lop = user.lop;
            if (lop < 1 || lop > 12)
            {
                return Ok(new { success = false, message = "Lớp học viên không hợp lệ (1–12)." });
            }

            int courseId = user.courseId;
            string courseName = user.courseName;

            var session = await _context.UserTests
                .Where(s => s.UserId == userId && s.CourseId == courseId)
                .OrderByDescending(s => s.DateCreate)
                .FirstOrDefaultAsync();

            if (session == null)
            {
                session = new UserTest
                {
                    UserId = userId,
                    DateCreate = DateTime.Now,
                    Lop = lop,
                    AgeGroup = lop,
                    CourseId = courseId,
                    CourseName = courseName,
                    idChiNhanh = user.idChiNhanh,
                    tenChiNhanh = user.tenChiNhanh
                };
                _context.UserTests.Add(session);
                await _context.SaveChangesAsync();
            }
            session.CourseName = courseName;
            session.CourseId = courseId;
            session.Lop = lop;
            session.AgeGroup = lop;
            session.idChiNhanh = user.idChiNhanh;
            session.tenChiNhanh = user.tenChiNhanh;
            await _context.SaveChangesAsync(); 
            return Ok(new { success = true, sessionId = session.Id, lop, agegroup = lop });
        }

        [HttpPost]
        [Route("ResetTest")]
        public async Task<IActionResult> ResetTest(int sessionId)
        {
            try
            {
                return Json(new { success = true, sessionId = sessionId });
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = ex.Message });
            }
            
        }
        [HttpPost]
        [Route("FinishTest")]
        public async Task<IActionResult> FinishTest(int sessionId, int durationInSeconds)
        {
            try
            {
                var userTest = _context.UserTests.Find(sessionId);
                if (userTest == null)
                {
                    return Json(new { success = false, message ="Không tìm thấy bài kiểm tra "+ sessionId });
                }
                userTest.IsComplete = true;
                userTest.TimeToCompleted = durationInSeconds;
                await _context.SaveChangesAsync();
                return Json(new { success = true,message="Đã cập nhật hoàn thành bài kiểm tra!", sessionId = sessionId });
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = ex.Message });
            }
        }

        [HttpPost]
        [Route("SaveCategoryResult")]
        public async Task<IActionResult> SaveCategoryResult([FromBody] SaveCategoryResultRequest request)
        {
            try
            {
                // Tìm và cập nhật trạng thái session (nếu cần)
                var session = await _context.UserTests.FirstOrDefaultAsync(s => s.Id == request.SessionId);
                if (session != null)
                {
                    session.IsComplete = true; // Cập nhật trạng thái bài test đã hoàn thành tại đây nếu muốn
                }

                // Xóa các chi tiết bài kiểm tra cũ cho session này
                // Sử dụng ToList() để thực hiện truy vấn trước khi RemoveRange
                var responses = await _context.UserTestDetails
                                              .Where(r => r.ResultId == request.SessionId)
                                              .ToListAsync(); // Thực hiện truy vấn bất đồng bộ
                _context.UserTestDetails.RemoveRange(responses);
                // KHÔNG GỌI SaveChangesAsync() ở đây.
                // Các thay đổi sẽ được lưu cùng lúc ở cuối phương thức.

                // Lưu kết quả từng danh mục
                foreach (var result in request.CategoryResults)
                {
                    var detail = new UserTestDetail
                    {
                        ResultId = request.SessionId,
                        CategoryId = result.CategoryId,
                        PointEarned = result.EarnedPoints,
                        TotalPoint = result.MaxPoints,
                        AgeGroup = result.AgeGroup
                    };
                    _context.UserTestDetails.Add(detail);
                }

                // Chỉ gọi SaveChangesAsync() một lần duy nhất ở cuối
                // để lưu tất cả các thay đổi (cập nhật session, xóa cũ, thêm mới)
                await _context.SaveChangesAsync();
                return Json(new { success = true });
            }
            catch (Exception ex)
            {
                // Log lỗi để dễ dàng debug hơn
                Console.WriteLine($"Error in SaveCategoryResult: {ex.Message}");
                if (ex.InnerException != null)
                {
                    Console.WriteLine($"Inner Exception: {ex.InnerException.Message}");
                }
                return Json(new { success = false, message = ex.Message });
            }
        }

        [HttpPost]
        [Route("SaveQuestionResults")]
        public async Task<IActionResult> SaveQuestionResults([FromBody] List<QuestionResultInput> results)
        {
            if (results == null || results.Count == 0)
            {
                return BadRequest(new { success = false, message = "Không có dữ liệu câu trả lời được gửi lên." });
            }

            var sessionId = results.First().SessionId;
            if (sessionId <= 0)
            {
                return BadRequest(new { success = false, message = "SessionId không hợp lệ." });
            }

            // Clear kết quả cũ để tránh trùng khóa (SessionId, QuestionId).
            var existing = await _context.questionResults
                .Where(qr => qr.SessionId == sessionId)
                .ToListAsync();
            if (existing.Any())
            {
                _context.questionResults.RemoveRange(existing);
            }

            foreach (var item in results)
            {
                var question = await _context.Questions.FindAsync(item.QuestionId);
                if (question == null)
                {
                    continue;
                }

                _context.questionResults.Add(new QuestionResult
                {
                    SessionId = sessionId,
                    QuestionId = item.QuestionId,
                    PointEarned = item.PointEarned ?? 0,
                    MaxPoint = item.MaxPoint ?? question.MaxPoint ?? 0,
                    CategoryId = question.CategoryId,
                    CreateAt = DateTime.Now
                });
            }

            await _context.SaveChangesAsync();
            return Ok(new { success = true });
        }

        [HttpGet("GetRadarData")]
        public async Task<IActionResult> GetRadarData()
        {
            int userId = _checkUser.GetUserId();
            var user = await GetProfile(userId);
            int lop = user?.lop ?? 0;
            // Lấy danh sách các lần test của user
            var userTests = _context.UserTests
                .Where(x => x.UserId == userId)
                .OrderByDescending(x => x.DateCreate)
                .ToList();

            var totalCategories = _context.QuestionCategories.Count(x=>x.Enable==true);
            var categories = _context.QuestionCategories
            .Where(x => x.Enable == true)
            .OrderBy(x => x.Id)
            .ToList();

            var categoryNames = categories.Select(c => c.Name).ToArray();

            var chartData = userTests.Select(test =>
            {
                // Tạo mảng điểm 0 cho tất cả category
                int[] data = new int[totalCategories];
                // Lấy điểm theo từng category
                var details = _context.UserTestDetails
                    .Where(d => d.ResultId == test.Id)
                    .ToList();

                foreach (var item in details)
                {
                    int index = categories.FindIndex(c => c.Id == item.CategoryId);
                    if (index != -1)
                    {
                        data[index] = (item.PointEarned * 100 / item.TotalPoint);
                    }
                }

                return new
                {
                    name = test.CourseName =="0"?"Chưa học Superbrain" : "Đã học Khóa "+test.CourseName,
                    testId = test.Id,
                    date = test.DateCreate?.ToString("yyyy-MM-dd"),
                    data
                };
            });

            return Ok(new
            {
                categories = categoryNames,
                chartData 
            });
        }
        [HttpGet("GetComparisonData")]
        public async Task<IActionResult> GetComparisonData()
        {
            try
            {
                int userId = _checkUser.GetUserId();
                var user = await GetProfile(userId);
                int lop = user?.lop ?? 0;

                // Lấy thông tin bài kiểm tra của người dùng
                var userTests = _context.UserTests.Where(x => x.UserId == userId).OrderByDescending(x => x.Id).ToList();
                var totalCategories = _context.QuestionCategories.Count(x => x.Enable == true);
                var categories = _context.QuestionCategories
                                .Where(x => x.Enable == true)
                                .OrderBy(x => x.Id)
                                .ToList();
                var categoryNames = categories.Select(c => c.Name).ToArray();

                // Lấy danh sách CategoryId hợp lệ để xử lý đúng
                var validCategoryIds = categories.Select(c => c.Id).ToList();

                // Tạo dữ liệu cho biểu đồ cột
                var comparisonData = userTests.Select(test =>
                {
                    int[] userData = new int[totalCategories];
                    int[] avgDataZero = new int[totalCategories];
                    int[] avgDataOther = new int[totalCategories];

                    var details = _context.UserTestDetails.Where(d => d.ResultId == test.Id).ToList();
                    foreach (var item in details)
                    {
                        Console.WriteLine($"CategoryId: {item.CategoryId}, PointEarned: {item.PointEarned}, TotalPoint: {item.TotalPoint}");
                        // Tính điểm của người dùng cho từng category
                        //if (item.CategoryId >= 1 && item.CategoryId <= totalCategories)
                        //{
                        //       userData[item.CategoryId - 1] = (int)((item.PointEarned / (double)item.TotalPoint) * 100);
                        //}
                        if (validCategoryIds.Contains(item.CategoryId) && item.TotalPoint > 0)
                        {
                            int index = validCategoryIds.IndexOf(item.CategoryId);
                            userData[index] = (int)((item.PointEarned / (double)item.TotalPoint) * 100);
                        }
                    }

                    // Tính trung bình điểm của người dùng có courseId = 0
                    for (int i = 0; i < validCategoryIds.Count; i++)
                    {
                        int catId = validCategoryIds[i];

                        var ratiosZero = _context.UserTestDetails
                                    .Where(d => d.CategoryId == catId && d.TotalPoint > 0)
                                    .Join(_context.UserTests.Where(ut => ut.CourseId == 0 && ut.UserId != userId && ut.Lop == lop), d => d.ResultId, ut => ut.Id, (d, ut) => (double)d.PointEarned / d.TotalPoint);
                        avgDataZero[i] = ratiosZero.Any() ? (int)(ratiosZero.Average() * 100) : 0;
                    }

                    // Tính trung bình điểm của người dùng có courseId khác 0
                    for (int i = 0; i < validCategoryIds.Count; i++)
                    {
                        int catId = validCategoryIds[i];
                        var ratiosOther = _context.UserTestDetails
                                        .Where(d => d.CategoryId == catId && d.TotalPoint > 0)
                                        .Join(_context.UserTests.Where(ut => ut.CourseId != 0 && ut.UserId != userId && ut.Lop == lop), d => d.ResultId, ut => ut.Id, (d, ut) => (double)d.PointEarned / d.TotalPoint);
                        avgDataOther[i] = ratiosOther.Any() ? (int)(ratiosOther.Average() * 100) : 0;
                    }

                    return new
                    {
                        userData,
                        avgDataZero,
                        avgDataOther
                    };
                }).ToList();

                return Ok(new { 
                    categories = categoryNames,
                    comparisonData
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { status = 500, message = $"Lỗi hệ thống: {ex.Message}" });
            }
        }
        [HttpGet]
        public async Task<User> GetProfile(int userId)
        {
            string apiUrl = $"http://45.119.82.38:6969/api/Students/ViewDetail/{userId}";
            try
            {
                using (var client = _httpClientFactory.CreateClient())
                {
                    client.DefaultRequestHeaders.Add("accept", "application/json");

                    var response = await client.GetAsync(apiUrl);

                    if (!response.IsSuccessStatusCode)
                    {
                        Console.WriteLine($"API trả về lỗi: {response.StatusCode}");
                        return null;
                    }

                    var responseData = await response.Content.ReadAsStringAsync();

                    if (string.IsNullOrWhiteSpace(responseData))
                    {
                        Console.WriteLine("Không tìm thấy response data");
                        return null;
                    }

                    var student = JsonConvert.DeserializeObject<StudentDto>(responseData);
                    if (student == null)
                    {
                        Console.WriteLine("Deserialize thất bại");
                        return null;
                    }

                    Console.WriteLine("Ngay sinh cua userId " + userId + ": " + student.namsinh);

                    // Kiểm tra ngaysinh hợp lệ
                    if (!DateTime.TryParse(student.namsinh, out DateTime birthDate))
                    {
                        Console.WriteLine("kiem tra namsinh hop le: "+userId+": "+student.namsinh);
                        return null;
                    }

                    int lop = Math.Clamp(student.lop, 1, 12);

                    var user = new User()
                    {
                        Id = student.idhocvien,
                        ten = student.tenhocvien,
                        Email = student.email,
                        phhs_dienthoai = student.phhs_dienthoai,
                        ngaysinh = student.namsinh,
                        mahs = student.mahocvien,
                        sex = student.sex,
                        UserLog = student.userLog,
                        courseId = student.idkhoahoc,
                        courseName = student.tenkhoahoc,
                        idChiNhanh = student.idChiNhanh ?? 0,
                        tenChiNhanh = student.tenChiNhanh,
                        lop = lop,
                        ageGroup = 0
                    };

                    return user;
                }
            }
            catch (HttpRequestException httpEx)
            {
                Console.WriteLine($"Lỗi HTTP: {httpEx.Message}");
                return null;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Lỗi khác: {ex.Message}");
                return null;
            }
        }

    }
}
