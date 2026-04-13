using AppTest.Helper;
using AppTest.Models;
using AppTest.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Newtonsoft.Json;
using System.Net.Http;
using System.Text.Json;
using static System.Net.Mime.MediaTypeNames;
using Microsoft.AspNetCore.Authorization;

namespace AppTest.Controllers
{
    [Authorize(Policy = AppPolicies.TeacherOnly)]
    public class TeacherController : Controller
    {
        private readonly ModelDbContext _context;
        private readonly HttpClient _httpClient;
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly CheckUser _checkUser;
        private readonly IStudentOverviewService _studentOverviewService;
        public TeacherController(ModelDbContext context, HttpClient httpClient, IHttpClientFactory httpClientFactory, CheckUser checkUser, IStudentOverviewService studentOverviewService)
        {
            _context = context;
            _httpClient = httpClient;
            _httpClientFactory = httpClientFactory;
            _checkUser = checkUser;
            _studentOverviewService = studentOverviewService;
        }
        [Route("/gv")]
        public async Task<IActionResult> Index()
        {
            int userId = _checkUser.GetUserId();
            var user = await GetProfile(userId);
            TempData["name"] = user.ten;
            return View();
        }

        [Route("/gv/xem-ket-qua")]
        public async Task<IActionResult> ResultDetail(int? studentId)
        {
            int userId = _checkUser.GetUserId();
            var user = await GetProfile(userId);
            TempData["name"] = user.ten;
            TempData["studentId"] = studentId;
            return View();
        }
        [Route("/gv/dang-nhap")]
        [AllowAnonymous]
        public async Task<IActionResult> Login()
        {
            var bg = await _context.AppSettings.FirstOrDefaultAsync(x => x.SettingKey == "StudentBackground");
            ViewBag.StudentBackground = bg?.SettingValue;
            
            return View();
        }
        [HttpGet]
        [Route("GetListStudents")]
        public async Task<IActionResult> GetStudents(int limit, int offset, string search, string? fromDate, string? toDate)
        {
            MD5Hash md5 = new MD5Hash();
            int userId = _checkUser.GetUserId();
            var user = await GetProfile(userId);
            int idChiNhanh = user.idChiNhanh;
            string apiUrl = $"http://45.119.82.38:6969/api/Students/GetStudentByChiNhanh/{idChiNhanh}?limit={limit}&offset={offset}&search={search}";

            var response = await _httpClient.GetAsync(apiUrl);
            if (!response.IsSuccessStatusCode)
            {
                return BadRequest(new { success = false, message = "Không thể tải danh sách học viên!" });
            }

            var jsonString = await response.Content.ReadAsStringAsync();
            var students = System.Text.Json.JsonSerializer.Deserialize<List<StudentByTeacherDto>>(jsonString, new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            });

            var listStudent = new List<StudentWithTestStatus>();

            var culture = new System.Globalization.CultureInfo("vi-VN");
            DateTime? fDate = string.IsNullOrEmpty(fromDate) ? null : DateTime.Parse(fromDate, culture);
            DateTime? tDate = string.IsNullOrEmpty(toDate) ? null : DateTime.Parse(toDate, culture).AddDays(1).AddSeconds(-1);

            if (students == null) return Ok(new { success = true, message = "không thấy danh sách", data = new List<StudentWithTestStatus>() });

            foreach (var s in students)
            {
                var stu = new StudentWithTestStatus()
                {
                    Id = s.id,
                    mahs = s.mahs,
                    ten = s.ten,
                    Email = s.email,
                    namsinh = s.namsinh,
                    dienthoai = s.phhS_dienthoai
                };

                var resultQuery = _context.UserTests.Where(x => x.UserId == s.id && x.IsComplete == true);

                if (fDate.HasValue)
                {
                    resultQuery = resultQuery.Where(x => x.DateCreate >= fDate.Value);
                }
                if (tDate.HasValue)
                {
                    resultQuery = resultQuery.Where(x => x.DateCreate <= tDate.Value);
                }

                if (resultQuery.Any())
                {
                    stu.HasTestResult = true;
                    stu.NumberTest = resultQuery.Count();
                    stu.DateTest = resultQuery.OrderByDescending(x => x.Id).FirstOrDefault().DateCreate;
                    listStudent.Add(stu);
                }
              
                else if (!fDate.HasValue && !tDate.HasValue)
                {
                    listStudent.Add(stu);
                }
            }

            return Ok(new { success = true, message = "đã lấy danh sách thành công", data = listStudent });
        }

        [HttpGet]
        [Route("GetListPaperQuestions")]
        public async Task<IActionResult> GetListPaperQuestions(int studentId)
        {
            var user = await GetProfileStudent(studentId);
            int lop = user.lop;
            int courseId = user.courseId;
            string courseName = user.courseName;

            var session = await _context.UserTests
               .Where(s => s.UserId == studentId && s.CourseId == courseId)
               .OrderByDescending(s => s.DateCreate)
               .FirstOrDefaultAsync();
            if (session == null)
            {
                session = new UserTest
                {
                    UserId = studentId,
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
            _context.SaveChanges();

            var questions = await _context.Questions
                .Where(q => q.OnPaper == true && (q.Lop == lop || q.Lop == lop - 3))
                .OrderBy(q => q.CategoryId)
                .Include(q => q.Category)
                .Select(q => new
                {
                    q.Id,
                    q.Name,
                    q.CategoryId,
                    q.MaxPoint,
                    maxPointCategory = _context.Questions.Where(x => x.CategoryId == q.CategoryId && (x.Lop == lop || x.Lop == lop - 3)).Sum(x => x.MaxPoint),
                    lop = q.Lop >= -2 && q.Lop <= 6 ? q.Lop + 3 : q.Lop,
                    CategoryName = q.Category != null ? q.Category.Name : "Unknown",
                    hasImage = q.Image != null,
                    q.Image
                }).ToListAsync();

            var existingResults = await _context.questionResults
                .Where(qr => qr.SessionId == session.Id)
                .Select(qr => new { qr.QuestionId, qr.PointEarned })
                .ToListAsync();

            return Json(new
            {
                success = true,
                data = questions,
                studentId,
                sessionId = session.Id,
                generalComment = session.GeneralComment ?? "",
                existingResults = existingResults
            });
        }
        [HttpGet]
        [Route("LoadPrintExam")]
        public async Task<IActionResult> PrintExam(int studentId)
        {
            var user = await GetProfileStudent(studentId);
            int lop = user.lop;

            var questions = await _context.Questions
                .Where(q => q.OnPaper == true && (q.Lop == lop || q.Lop == lop - 3))
                .OrderBy(q => q.CategoryId)
                .Include(q => q.Category)
                .Select(q => new
                {
                    q.Id,
                    q.Name,
                    q.CategoryId,
                    q.MaxPoint,
                    maxPointCategory = _context.Questions.Where(x => x.CategoryId == q.CategoryId && (x.Lop == lop || x.Lop == lop - 3)).Sum(x => x.MaxPoint),
                    lop = q.Lop >= -2 && q.Lop <= 6 ? q.Lop + 3 : q.Lop,
                    CategoryName = q.Category != null ? q.Category.Name : "Unknown",
                    hasImage = q.Image != null,
                    q.Image
                }).ToListAsync();

            return Json(new { success = true, data = questions, student = user });
        }
        [HttpPost]
        [Route("SubmitQuestionResults")]
        public async Task<IActionResult> SubmitQuestionResults([FromBody] SubmitPaperQuestionResultsRequest request)
        {
            if (request == null)
            {
                return BadRequest(new { success = false, message = "Không có dữ liệu nào được gửi lên." });
            }

            var sessionId = request.SessionId;
            if (sessionId <= 0 && request.Results != null && request.Results.Count > 0)
            {
                sessionId = request.Results.First().SessionId;
            }
            if (sessionId <= 0)
            {
                return BadRequest(new { success = false, message = "SessionId không hợp lệ." });
            }

            // Lưu nhận xét chung của giáo viên (nếu có)
            var userTest = await _context.UserTests.FirstOrDefaultAsync(s => s.Id == sessionId);
            if (userTest == null)
            {
                return BadRequest(new { success = false, message = "Không tìm thấy phiên làm bài để lưu." });
            }

            // Cho phép lưu nhận xét dù chưa nhập điểm.
            userTest.GeneralComment = request.GeneralComment;

            // Nếu không có điểm, chỉ lưu nhận xét là xong.
            if (request.Results == null || request.Results.Count == 0)
            {
                await _context.SaveChangesAsync();
                return Ok(new { success = true, message = "Đã lưu nhận xét thành công." });
            }

            // Xóa kết quả cũ cho phiên này để tránh trùng khóa (SessionId, QuestionId).
            var existing = await _context.questionResults
                .Where(qr => qr.SessionId == sessionId)
                .ToListAsync();
            if (existing.Any())
            {
                _context.questionResults.RemoveRange(existing);
            }

            foreach (var item in request.Results)
            {
                var question = await _context.Questions.FindAsync(item.QuestionId);
                if (question == null) continue;
                var result = new QuestionResult
                {
                    SessionId = sessionId,
                    QuestionId = item.QuestionId,
                    PointEarned = item.PointEarned,
                    MaxPoint = question.MaxPoint,
                    CategoryId = question.CategoryId,
                    CreateAt = DateTime.Now
                };

                _context.questionResults.Add(result);
            }

            await _context.SaveChangesAsync();
            return Ok(new { success = true, message = "Đã lưu điểm thành công." });
        }

        [HttpGet]

        // Nhận xét từ GV
        public async Task<IActionResult> LoadResultTestById(int studentId)
        {
            var user = await GetProfileStudent(studentId);
            string description = "";
            var userTest = _context.UserTests.Where(x => x.UserId == studentId && x.IsComplete ==true).OrderByDescending(x => x.Id).FirstOrDefault();
            if (userTest == null)
            {
                return Json(new { success = false, message = "Không tìm thấy bài kiểm tra đã hoàn thành cho học viên này." });
            }

            string handwritingComment = userTest.GeneralComment ?? "";
            var categories = await _context.QuestionCategories
                                           .Where(x => x.Enable == true)
                                           .OrderBy(x => x.DisplayOrder)
                                           .ToListAsync();
            var categoryNames = categories.Select(c => c.Name).ToArray();

            var allDetailsForSession = await _context.UserTestDetails
                                                     .Where(d => d.ResultId == userTest.Id)
                                                     .ToListAsync();

            int[] dataForChart = new int[categories.Count];
            // Danh sách các nhận xét riêng lẻ
            List<string> individualDescriptions = new List<string>();

            // Khởi tạo một HashSet để theo dõi các CategoryId đã có kết quả từ bài thi giấy
            HashSet<int> categoriesWithPaperResults = new HashSet<int>();

            // --- 1. XỬ LÝ KẾT QUẢ TỪ BÀI THI GIẤY (QuestionResult) ---
            // Giả định QuestionResult đã có CategoryId trực tiếp
            var paperResults = await _context.questionResults
                                             .Where(qr => qr.SessionId == userTest.Id)
                                             .ToListAsync();

            // Nhóm kết quả giấy theo CategoryId và tính tổng điểm
            var groupedPaperResults = paperResults.GroupBy(qr => qr.CategoryId)
                                                  .Select(g => new
                                                  {
                                                      CategoryId = g.Key,
                                                      TotalEarned = g.Sum(x => x.PointEarned ?? 0),
                                                      TotalMax = g.Sum(x => x.MaxPoint ?? 0)
                                                  })
                                                  .ToList();

            foreach (var paperResult in groupedPaperResults)
            {
                int categoryIndex = categories.FindIndex(c => c.Id == paperResult.CategoryId);
                if (categoryIndex != -1)
                {
                    double paperPercent = 0;
                    if (paperResult.TotalMax > 0)
                    {
                        paperPercent = (double)paperResult.TotalEarned / paperResult.TotalMax * 100;
                    }
                    paperPercent = Math.Min(100, Math.Max(0, paperPercent));

                    // Lưu kết quả phần trăm giấy vào dataForChart
                    dataForChart[categoryIndex] = (int)Math.Round(paperPercent);
                    // Đánh dấu category này đã được xử lý bởi kết quả giấy
                    categoriesWithPaperResults.Add(paperResult.CategoryId??0);

                    // Thêm nhận xét cho kết quả giấy
                    var res = await _context.categoryResultSettings
                                            .Where(x => x.FromPoint <= paperPercent &&
                                                        x.ToPoint >= paperPercent &&
                                                        x.CategoryId == paperResult.CategoryId)
                                            .FirstOrDefaultAsync();
                    if (res != null && !string.IsNullOrWhiteSpace(res.Description))
                    {
                        var categoryName = categories.FirstOrDefault(c => c.Id == paperResult.CategoryId)?.Name ?? $"Category {paperResult.CategoryId}";
                        individualDescriptions.Add($"• <b>{categoryName}:</b> {res.Description}.");
                    }
                }
            }

            foreach (var category in categories)
            {
                if (categoriesWithPaperResults.Contains(category.Id))
                {
                    continue;
                }
                int categoryIndex = categories.FindIndex(c => c.Id == category.Id);
                if (categoryIndex == -1)
                {
                    continue;
                }

                var catDetails = allDetailsForSession.Where(d => d.CategoryId == category.Id).ToList();
                int earned = catDetails.Sum(d => d.PointEarned);
                int total = catDetails.Sum(d => d.TotalPoint);
                double finalCategoryPercent = total > 0 ? (double)earned / total * 100 : 0;
                finalCategoryPercent = Math.Min(100, Math.Max(0, finalCategoryPercent));

                dataForChart[categoryIndex] = (int)Math.Round(finalCategoryPercent);

                var res = await _context.categoryResultSettings
                                        .Where(x => x.FromPoint <= finalCategoryPercent &&
                                                    x.ToPoint >= finalCategoryPercent &&
                                                    x.CategoryId == category.Id)
                                        .FirstOrDefaultAsync();
                if (res != null && !string.IsNullOrWhiteSpace(res.Description))
                {
                    individualDescriptions.Add($"• <b>{category.Name}:</b> {res.Description}.");
                }
            }

            // Xây dựng chuỗi description tổng thể
            if (individualDescriptions.Any())
            {
                description += string.Join("<br>", individualDescriptions);
            }
            else
            {
                description += "<p>Hiện không có nhận xét chi tiết kết quả của học viên.</p>";
            }
            return Json(new { success = true,testId= userTest.Id, student = user, data = dataForChart,categories = categoryNames, description, handwritingComment });
        }
        /// <summary>Ưu tiên điểm thi giấy; nếu không, trung bình điểm online theo danh mục.</summary>
        private async Task<int> CalculateCategoryPercentage(int sessionId, int categoryId)
        {
            double finalCategoryPercent = 0;

            var paperResult = await _context.questionResults
                                            .Where(qr => qr.SessionId == sessionId && qr.CategoryId == categoryId)
                                            .GroupBy(qr => qr.CategoryId)
                                            .Select(g => new
                                            {
                                                TotalEarned = g.Sum(x => x.PointEarned ?? 0),
                                                TotalMax = g.Sum(x => x.MaxPoint ?? 0)
                                            })
                                            .FirstOrDefaultAsync();

            if (paperResult != null && paperResult.TotalMax > 0)
            {
                finalCategoryPercent = (double)paperResult.TotalEarned / paperResult.TotalMax * 100;
            }
            else
            {
                var onlineDetails = await _context.UserTestDetails
                    .Where(d => d.ResultId == sessionId && d.CategoryId == categoryId)
                    .ToListAsync();
                double earned = onlineDetails.Sum(d => d.PointEarned);
                double total = onlineDetails.Sum(d => d.TotalPoint);
                if (total > 0)
                {
                    finalCategoryPercent = earned / total * 100;
                }
            }

            return (int)Math.Round(Math.Min(100, Math.Max(0, finalCategoryPercent)));
        }

        [HttpGet("GetComparisonChartData")]
        public async Task<IActionResult> GetComparisonData(int studentId)
        {
            try
            {
                var user = await GetProfileStudent(studentId);
                if (user == null)
                {
                    return Json(new { success = false, message = "Không tìm thấy thông tin học viên." });
                }
                // Đảm bảo thuộc tính AgeGroup trong model User là kiểu int và có giá trị
                

                // Lấy tất cả các Category đang hoạt động theo thứ tự
                var categories = await _context.QuestionCategories
                                               .Where(x => x.Enable == true)
                                               .OrderBy(x => x.DisplayOrder)
                                               .ToListAsync();
                var categoryNames = categories.Select(c => c.Name).ToArray();

                var validCategoryIds = categories.Where(x => x.Enable == true).OrderBy(x => x.DisplayOrder).Select(c => c.Id).ToList(); // Dùng để xác định index


                // --- Xử lý dữ liệu cho học viên hiện tại (user) ---
                var currentUserTest = await _context.UserTests
                                                    .Where(x => x.UserId == studentId && x.IsComplete == true)
                                                    .OrderByDescending(x => x.Id)
                                                    .FirstOrDefaultAsync();

                if (currentUserTest == null)
                {
                    return Json(new { success = false, message = "Không tìm thấy bài kiểm tra hoàn thành." });
                }

                int userLop = currentUserTest.Lop ?? currentUserTest.AgeGroup ?? user.lop;

                int[] currentUserData = new int[validCategoryIds.Count];
                for (int i = 0; i < validCategoryIds.Count; i++)
                {
                    int categoryId = validCategoryIds[i];
                    currentUserData[i] = await CalculateCategoryPercentage(currentUserTest.Id, categoryId);
                }

                // --- Xử lý dữ liệu trung bình cho CourseId = 0 (nhóm 0) ---
                int[] avgDataZero = new int[validCategoryIds.Count];
                var zeroCourseUserTests = await _context.UserTests
                                                        .Where(ut => ut.CourseId == 0 && (ut.Lop ?? ut.AgeGroup) == userLop && ut.UserId != studentId && ut.IsComplete == true)
                                                        .ToListAsync();

                if (zeroCourseUserTests.Any())
                {
                    var categoryTotalsZero = new Dictionary<int, (double Sum, int Count)>();

                    foreach (var test in zeroCourseUserTests)
                    {
                        int tl = test.Lop ?? test.AgeGroup ?? 0;
                        if (tl == 0)
                        {
                            continue;
                        }

                        for (int i = 0; i < validCategoryIds.Count; i++)
                        {
                            int categoryId = validCategoryIds[i];
                            int percentage = await CalculateCategoryPercentage(test.Id, categoryId);

                            if (!categoryTotalsZero.ContainsKey(categoryId))
                            {
                                categoryTotalsZero[categoryId] = (0, 0);
                            }
                            var current = categoryTotalsZero[categoryId];
                            categoryTotalsZero[categoryId] = (current.Sum + percentage, current.Count + 1);
                        }
                    }

                    // Tính trung bình cuối cùng cho từng category trong nhóm 0
                    for (int i = 0; i < validCategoryIds.Count; i++)
                    {
                        int categoryId = validCategoryIds[i];
                        if (categoryTotalsZero.TryGetValue(categoryId, out var totals) && totals.Count > 0)
                        {
                            avgDataZero[i] = (int)Math.Round(totals.Sum / totals.Count);
                        }
                        else
                        {
                            avgDataZero[i] = 0; // Đảm bảo giá trị mặc định nếu không có dữ liệu
                        }
                    }
                }


                // --- Xử lý dữ liệu trung bình cho CourseId != 0 (nhóm khác 0) ---
                int[] avgDataOther = new int[validCategoryIds.Count];
                // Lấy tất cả UserTests của các học viên khác có CourseId != 0 và đã hoàn thành
                var otherCourseUserTests = await _context.UserTests
                                                         .Where(ut => ut.CourseId != 0 && (ut.Lop ?? ut.AgeGroup) == userLop && ut.UserId != studentId && ut.IsComplete == true)
                                                         .ToListAsync();

                if (otherCourseUserTests.Any())
                {
                    var categoryTotalsOther = new Dictionary<int, (double Sum, int Count)>();

                    foreach (var test in otherCourseUserTests)
                    {
                        int tl = test.Lop ?? test.AgeGroup ?? 0;
                        if (tl == 0)
                        {
                            continue;
                        }

                        for (int i = 0; i < validCategoryIds.Count; i++)
                        {
                            int categoryId = validCategoryIds[i];
                            int percentage = await CalculateCategoryPercentage(test.Id, categoryId);

                            if (!categoryTotalsOther.ContainsKey(categoryId))
                            {
                                categoryTotalsOther[categoryId] = (0, 0);
                            }
                            var current = categoryTotalsOther[categoryId];
                            categoryTotalsOther[categoryId] = (current.Sum + percentage, current.Count + 1);
                        }
                    }

                    for (int i = 0; i < validCategoryIds.Count; i++)
                    {
                        int categoryId = validCategoryIds[i];
                        if (categoryTotalsOther.TryGetValue(categoryId, out var totals) && totals.Count > 0)
                        {
                            avgDataOther[i] = (int)Math.Round(totals.Sum / totals.Count);
                        }
                        else
                        {
                            avgDataOther[i] = 0;
                        }
                    }
                }

                // Trả về dữ liệu
                return Ok(new
                {
                    categories = categoryNames,
                    currentUserData = currentUserData, // Đổi tên từ userData để rõ ràng hơn
                    avgDataZero = avgDataZero,
                    avgDataOther = avgDataOther,
                    testId = currentUserTest.Id
                });
            }
            catch (Exception ex)
            {
                // Ghi log lỗi chi tiết
                Console.WriteLine($"Lỗi trong GetComparisonData: {ex.Message}");
                if (ex.InnerException != null)
                {
                    Console.WriteLine($"Inner Exception: {ex.InnerException.Message}");
                }
                return StatusCode(500, new { status = 500, message = $"Lỗi hệ thống: {ex.Message}" });
            }
        }

        [HttpGet("GetRadarChartData")]
        public async Task<IActionResult> GetRadarData(int studentId)
        {
            var user = await GetProfileStudent(studentId);

            // Lấy tất cả các bài kiểm tra đã hoàn thành của học viên, sắp xếp theo thời gian mới nhất
            var userTests = await _context.UserTests
                                          .Where(x => x.UserId == studentId && x.IsComplete == true)
                                          .OrderBy(x => x.DateCreate)
                                          .ToListAsync(); // Sử dụng ToListAsync() để lấy dữ liệu bất đồng bộ

            // Lấy tất cả các Category đang hoạt động theo thứ tự hiển thị
            var categories = await _context.QuestionCategories
                                           .Where(x => x.Enable == true)
                                           .OrderBy(x => x.DisplayOrder)
                                           .ToListAsync();

            var categoryNames = categories.Select(c => c.Name).ToArray();

            // Dùng List để thêm dữ liệu từng bài kiểm tra
            var chartDataList = new List<object>();

            foreach (var test in userTests)
            {
                // Tạo mảng điểm cho bài kiểm tra hiện tại, theo thứ tự của `categories`
                int[] dataForCurrentTest = new int[categories.Count];

                for (int i = 0; i < categories.Count; i++)
                {
                    var category = categories[i];
                    dataForCurrentTest[i] = await CalculateCategoryPercentage(test.Id, category.Id);
                }

                // Thêm dữ liệu của bài kiểm tra này vào danh sách
                chartDataList.Add(new
                {
                    name = test.CourseId == 0 ? "Chưa học Superbrain" : "Đã học Khóa " + test.CourseName, // Sử dụng CourseId để kiểm tra, CourseName để hiển thị
                    testId = test.Id,
                    date = test.DateCreate?.ToString("yyyy-MM-dd"), // Đảm bảo DateCreate là non-nullable hoặc xử lý null an toàn
                    data = dataForCurrentTest // Mảng điểm đã tính toán
                });
            }

            return Ok(new
            {
                categories = categoryNames,
                chartData = chartDataList
            });
        }

        [HttpGet("GetAttemptDetails")]
        public async Task<IActionResult> GetAttemptDetails(int testId)
        {
            var attempt = await _context.UserTests.FirstOrDefaultAsync(x => x.Id == testId);
            if (attempt == null)
            {
                return Json(new { success = false, message = "Không tìm thấy phiên làm bài." });
            }

            var categories = await _context.QuestionCategories
                .Where(x => x.Enable == true)
                .OrderBy(x => x.DisplayOrder)
                .ToListAsync();

            var results = await _context.questionResults
                .Where(qr => qr.SessionId == testId)
                .Include(qr => qr.Question)
                .ThenInclude(q => q.Category)
                .ToListAsync();

            var orderedResults = results
                .OrderBy(r => r.Question?.Category?.DisplayOrder ?? 0)
                .ThenBy(r => r.QuestionId)
                .ToList();

            var questionDetails = orderedResults.Select(r =>
            {
                var catId = r.CategoryId ?? r.Question?.CategoryId ?? 0;
                var cat = categories.FirstOrDefault(c => c.Id == catId);
                var maxPoint = r.MaxPoint ?? r.Question?.MaxPoint ?? 0;
                var earned = r.PointEarned ?? 0;
                var isCorrect = maxPoint > 0 && earned >= maxPoint;
                return new
                {
                    questionId = r.QuestionId,
                    questionName = r.Question?.Name ?? "",
                    categoryId = catId,
                    categoryName = cat?.Name ?? r.Question?.Category?.Name ?? "Unknown",
                    categoryColor = cat?.Color ?? r.Question?.Category?.Color ?? "",
                    earnedPoints = earned,
                    maxPoint = maxPoint,
                    isCorrect = isCorrect
                };
            }).ToList();

            var rawTotals = orderedResults
                .GroupBy(r =>
                {
                    var catId = r.CategoryId ?? r.Question?.CategoryId ?? 0;
                    return catId;
                })
                .Select(g => new
                {
                    categoryId = g.Key,
                    earnedPoints = g.Sum(x => x.PointEarned ?? 0),
                    maxPoint = g.Sum(x => x.MaxPoint ?? x.Question?.MaxPoint ?? 0)
                })
                .ToList();

            var totalsByCat = rawTotals.ToDictionary(x => x.categoryId, x => x);

            var categoryTotals = categories.Select(c =>
            {
                totalsByCat.TryGetValue(c.Id, out var row);
                var earned = row?.earnedPoints ?? 0;
                var max = row?.maxPoint ?? 0;
                var percent = max > 0 ? (int)Math.Round(Math.Min(100, Math.Max(0, (double)earned / max * 100))) : 0;
                return new
                {
                    categoryId = c.Id,
                    categoryName = c.Name ?? "",
                    categoryColor = c.Color ?? "",
                    earnedPoints = earned,
                    maxPoint = max,
                    percent = percent
                };
            }).ToList();

            return Json(new
            {
                success = true,
                attempt = new
                {
                    testId = attempt.Id,
                    dateCreate = attempt.DateCreate?.ToString("yyyy-MM-dd") ?? "",
                    courseName = attempt.CourseName ?? "",
                    generalComment = attempt.GeneralComment ?? ""
                },
                questions = questionDetails,
                categoryTotals = categoryTotals
            });
        }
        
        [HttpGet]
        public async Task<User> GetProfile(int userId)
        {
            string apiUrl = $"http://45.119.82.38:6969/api/Teachers/{userId}";
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

                    var userJson = JsonConvert.DeserializeObject<UserDto>(responseData);
                    if (userJson == null)
                    {
                        Console.WriteLine("Deserialize thất bại");
                        return null;
                    }

                    var user = new User()
                    {
                        Id = userJson.id,
                        idChiNhanh = userJson.idChiNhanh,
                        ten = userJson.hoten
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

        [HttpGet]
        public async Task<User> GetProfileStudent(int userId)
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
                        Console.WriteLine("kiem tra namsinh hop le: " + userId + ": " + student.namsinh);
                        return null;
                    }

                    if (!LopMapper.TryNormalizeLopCode(student.lop, out int lop))
                    {
                        Console.WriteLine("Lớp học viên không hợp lệ từ API quản lý: " + student.lop);
                        return null;
                    }
                    var user = new User()
                    {
                        Id = student.idhocvien,
                        ten = student.tenhocvien,
                        Email = student.email,
                        phhs_dienthoai = student.phhs_dienthoai,
                        ngaysinh = student.namsinh,
                        mahs = student.mahocvien,
                        sex = student.sex,
                        lop = lop,
                        idChiNhanh = student.idChiNhanh ?? 0,
                        tenChiNhanh = student.tenChiNhanh,
                        UserLog = student.userLog,
                        matkhau = student.matkhau,
                        courseId = student.idkhoahoc,
                        courseName = student.tenkhoahoc,
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
