using AppTest.Models;
using AppTest.Helper;
using Microsoft.EntityFrameworkCore;
using Newtonsoft.Json;
using OfficeOpenXml;

namespace AppTest.Services
{
    public interface IStudentOverviewService
    {
        Task<User?> GetStudentProfileAsync(int userId);
        Task<User?> GetStaffProfileAsync(int userId);
        Task<List<StudentWithTestStatus>> GetAllTestedStudentsAsync(int idChiNhanh, string? search, int offset, int limit, string? fromDate = null, string? toDate = null);
        Task<PrintExamPayload> GetPrintExamPayloadAsync(int studentId);
        Task<ResultDetailPayload> GetResultDetailPayloadAsync(int studentId);
        Task<RadarChartPayload> GetRadarChartPayloadAsync(int studentId);
        Task<ComparisonChartPayload> GetComparisonChartPayloadAsync(int studentId);
        Task<AttemptDetailsPayload> GetAttemptDetailsPayloadAsync(int testId);
        Task<byte[]> ExportStudentListToExcelAsync(List<StudentWithTestStatus> students);
        Task<List<StudentWithTestDetailsForExport>> GetStudentTestDetailsForExportAsync(List<int> studentIds);
    }

    public class StudentOverviewService : IStudentOverviewService
    {
        private readonly ModelDbContext _context;
        private readonly IHttpClientFactory _httpClientFactory;

        public StudentOverviewService(ModelDbContext context, IHttpClientFactory httpClientFactory)
        {
            _context = context;
            _httpClientFactory = httpClientFactory;
        }

        public async Task<User?> GetStudentProfileAsync(int userId)
        {
            string apiUrl = $"http://45.119.82.38:6969/api/Students/ViewDetail/{userId}";
            try
            {
                using var client = _httpClientFactory.CreateClient();
                client.DefaultRequestHeaders.Add("accept", "application/json");

                var response = await client.GetAsync(apiUrl);
                if (!response.IsSuccessStatusCode)
                {
                    return null;
                }

                var responseData = await response.Content.ReadAsStringAsync();
                if (string.IsNullOrWhiteSpace(responseData))
                {
                    return null;
                }

                var student = JsonConvert.DeserializeObject<StudentDto>(responseData);
                if (student == null || !DateTime.TryParse(student.namsinh, out DateTime birthDate))
                {
                    return null;
                }

                if (!LopMapper.TryConvertManagementLopToAppLop(student.lop, out int lop))
                {
                    return null;
                }

                return new User
                {
                    Id = student.idhocvien,
                    ten = student.tenhocvien,
                    Email = student.email,
                    phhs_dienthoai = student.phhs_dienthoai,
                    ngaysinh = student.namsinh,
                    mahs = student.mahocvien,
                    sex = student.sex,
                    UserLog = student.userLog,
                    matkhau = student.matkhau,
                    courseId = student.idkhoahoc,
                    courseName = student.tenkhoahoc,
                    idChiNhanh = student.idChiNhanh ?? 0,
                    tenChiNhanh = student.tenChiNhanh,
                    lop = lop,
                    ageGroup = 0
                };
            }
            catch
            {
                return null;
            }
        }

        public async Task<User?> GetStaffProfileAsync(int userId)
        {
            string apiUrl = $"http://45.119.82.38:6969/api/Teachers/{userId}";
            try
            {
                using var client = _httpClientFactory.CreateClient();
                client.DefaultRequestHeaders.Add("accept", "application/json");
                var response = await client.GetAsync(apiUrl);
                if (!response.IsSuccessStatusCode) return null;

                var responseData = await response.Content.ReadAsStringAsync();
                var userJson = JsonConvert.DeserializeObject<UserDto>(responseData);
                if (userJson == null) return null;

                return new User { Id = userJson.id, idChiNhanh = userJson.idChiNhanh, ten = userJson.hoten };
            }
            catch { return null; }
        }

        // MODIFIED: Cập nhật chữ ký hàm thêm idChiNhanh và đổi logic sang Student-centric
        public async Task<List<StudentWithTestStatus>> GetAllTestedStudentsAsync(int idChiNhanh, string? search, int offset, int limit, string? fromDate = null, string? toDate = null)
        {
            // 1. Lấy danh sách học viên từ API theo chi nhánh
            string apiUrl = $"http://45.119.82.38:6969/api/Students/GetStudentByChiNhanh/{idChiNhanh}?limit={limit}&offset={offset}&search={search ?? ""}";
            
            using var client = _httpClientFactory.CreateClient();
            client.DefaultRequestHeaders.Add("accept", "application/json");

            var response = await client.GetAsync(apiUrl);
            if (!response.IsSuccessStatusCode) return new List<StudentWithTestStatus>();

            var jsonString = await response.Content.ReadAsStringAsync();
            var studentsApi = JsonConvert.DeserializeObject<List<StudentByTeacherDto>>(jsonString);

            if (studentsApi == null) return new List<StudentWithTestStatus>();

            var enriched = new List<StudentWithTestStatus>();

            // Parse date filters
            var culture = new System.Globalization.CultureInfo("vi-VN");
            DateTime? fDate = string.IsNullOrEmpty(fromDate) ? null : DateTime.Parse(fromDate, culture);
            DateTime? tDate = string.IsNullOrEmpty(toDate) ? null : DateTime.Parse(toDate, culture).AddDays(1).AddSeconds(-1);

            // 2. Duyệt danh sách từ API và kiểm tra bài test tại DB local
            foreach (var s in studentsApi)
            {
                var testQuery = _context.UserTests
                    .Where(x => x.UserId == s.id && x.IsComplete == true);

                // Apply date filters if provided
                if (fDate.HasValue)
                {
                    testQuery = testQuery.Where(x => x.DateCreate >= fDate.Value);
                }
                if (tDate.HasValue)
                {
                    testQuery = testQuery.Where(x => x.DateCreate <= tDate.Value);
                }

                testQuery = testQuery.OrderByDescending(x => x.DateCreate);

                var hasTest = await testQuery.AnyAsync();
                var latestTest = await testQuery.FirstOrDefaultAsync();
                int? lop = latestTest?.Lop ?? latestTest?.AgeGroup;
                string? courseName = latestTest?.CourseName;
                
                // Only add student if they have a test result matching the date filter
                if (hasTest)
                {
                    enriched.Add(new StudentWithTestStatus
                    {
                        Id = s.id,
                        mahs = s.mahs,
                        ten = s.ten ?? string.Empty,
                        Email = s.email ?? string.Empty,
                        dienthoai = s.phhS_dienthoai ?? string.Empty,
                        namsinh = s.namsinh,
                        CourseName = courseName ?? "Chưa học",
                        Lop = lop,
                        HasTestResult = true,
                        NumberTest = await testQuery.CountAsync(),
                        DateTest = latestTest?.DateCreate
                    });
                }
                // If no date filter is applied, include all students
                else if (!fDate.HasValue && !tDate.HasValue)
                {
                    enriched.Add(new StudentWithTestStatus
                    {
                        Id = s.id,
                        mahs = s.mahs,
                        ten = s.ten ?? string.Empty,
                        Email = s.email ?? string.Empty,
                        dienthoai = s.phhS_dienthoai ?? string.Empty,
                        namsinh = s.namsinh,
                        CourseName = courseName ?? "Chưa học",
                        Lop = lop,
                        HasTestResult = false,
                        NumberTest = 0,
                        DateTest = null
                    });
                }
            }

            return enriched;
        }
        
        public async Task<PrintExamPayload> GetPrintExamPayloadAsync(int studentId)
        {
            var user = await GetStudentProfileAsync(studentId) ?? throw new InvalidOperationException("Student not found.");
            int lop = user.lop;

            var questions = await _context.Questions
                .Where(q => q.Enable && q.OnPaper == true && q.Lop == lop)
                .OrderBy(q => q.CategoryId)
                .ThenBy(q => q.DisplayOrder)
                .Include(q => q.Category)
                .Select(q => new PrintExamQuestion
                {
                    Id = q.Id,
                    Name = q.Name,
                    CategoryId = q.CategoryId,
                    MaxPoint = q.MaxPoint,
                    MaxPointCategory = _context.Questions.Where(x => x.Enable && x.CategoryId == q.CategoryId && x.Lop == lop).Sum(x => x.MaxPoint),
                    AgeGroup = q.Lop,
                    CategoryName = q.Category != null ? q.Category.Name : "Unknown",
                    HasImage = q.Image != null,
                    Image = q.Image
                })
                .ToListAsync();

            return new PrintExamPayload
            {
                Student = user,
                Questions = questions
            };
        }
        // Nhận xét từ admin
        public async Task<ResultDetailPayload> GetResultDetailPayloadAsync(int studentId)
        {
            var user = await GetStudentProfileAsync(studentId) ?? throw new InvalidOperationException("Học viên không tồn tại.");
            
            // Lấy bài kiểm tra mới nhất đã hoàn thành (Khớp logic Controller)
            var userTest = await _context.UserTests
                .Where(x => x.UserId == studentId && x.IsComplete == true)
                .OrderByDescending(x => x.Id)
                .FirstOrDefaultAsync();

            if (userTest == null)
            {
                throw new InvalidOperationException("Không tìm thấy bài kiểm tra đã hoàn thành.");
            }

            // Tách riêng nhận xét cầm bút
            string handwritingComment = userTest.GeneralComment ?? "";

            var categories = await _context.QuestionCategories
                .Where(x => x.Enable == true)
                .OrderBy(x => x.DisplayOrder)
                .ToListAsync();

            var categoryNames = categories.Select(c => c.Name ?? string.Empty).ToArray();
            
            var allDetailsForSession = await _context.UserTestDetails
                .Where(d => d.ResultId == userTest.Id)
                .ToListAsync();

            int[] dataForChart = new int[categories.Count];
            List<string> individualDescriptions = new();
            HashSet<int> categoriesWithPaperResults = new();

            // 1. XỬ LÝ KẾT QUẢ TỪ BÀI THI GIẤY 
            var paperResults = await _context.questionResults
                .Where(qr => qr.SessionId == userTest.Id)
                .ToListAsync();

            var groupedPaperResults = paperResults.GroupBy(qr => qr.CategoryId)
                .Select(g => new {
                    CategoryId = g.Key,
                    TotalEarned = g.Sum(x => x.PointEarned ?? 0),
                    TotalMax = g.Sum(x => x.MaxPoint ?? 0)
                }).ToList();

            foreach (var paperResult in groupedPaperResults)
            {
                int categoryIndex = categories.FindIndex(c => c.Id == paperResult.CategoryId);
                if (categoryIndex != -1)
                {
                    double paperPercent = paperResult.TotalMax > 0 
                        ? (double)paperResult.TotalEarned / paperResult.TotalMax * 100 
                        : 0;
                    paperPercent = Math.Min(100, Math.Max(0, paperPercent));

                    dataForChart[categoryIndex] = (int)Math.Round(paperPercent);
                    categoriesWithPaperResults.Add(paperResult.CategoryId ?? 0);

                    var res = await _context.categoryResultSettings
                        .Where(x => x.FromPoint <= paperPercent && x.ToPoint >= paperPercent && x.CategoryId == paperResult.CategoryId)
                        .FirstOrDefaultAsync();

                    if (res != null && !string.IsNullOrWhiteSpace(res.Description))
                    {
                        var catName = categories.FirstOrDefault(c => c.Id == paperResult.CategoryId)?.Name ?? "Kỹ năng";
                        // Format: • <b>Tên:</b> Nội dung
                        individualDescriptions.Add($"• <b>{catName}:</b> {res.Description}.");
                    }
                }
            }

            // 2. XỬ LÝ KẾT QUẢ ONLINE CHO CÁC KỸ NĂNG CÒN LẠI
            foreach (var category in categories)
            {
                if (categoriesWithPaperResults.Contains(category.Id)) continue;

                int categoryIndex = categories.FindIndex(c => c.Id == category.Id);
                var catDetails = allDetailsForSession.Where(d => d.CategoryId == category.Id).ToList();
                
                int earned = catDetails.Sum(d => d.PointEarned);
                int total = catDetails.Sum(d => d.TotalPoint);
                double finalCategoryPercent = total > 0 ? (double)earned / total * 100 : 0;
                finalCategoryPercent = Math.Min(100, Math.Max(0, finalCategoryPercent));

                dataForChart[categoryIndex] = (int)Math.Round(finalCategoryPercent);

                var res = await _context.categoryResultSettings
                    .Where(x => x.FromPoint <= finalCategoryPercent && x.ToPoint >= finalCategoryPercent && x.CategoryId == category.Id)
                    .FirstOrDefaultAsync();

                if (res != null && !string.IsNullOrWhiteSpace(res.Description))
                {
                    individualDescriptions.Add($"• <b>{category.Name}:</b> {res.Description}.");
                }
            }

            // 3. TẠO CHUỖI DESCRIPTION 
            string finalDescription = "";
            if (individualDescriptions.Any())
            {
                finalDescription = $"<div style='font-size:16px; line-height:1.5;'>" + string.Join("<br>", individualDescriptions) + "</div>";
            }
            else
            {
                finalDescription = "<div style='font-size:16px;'>Hiện không có nhận xét chi tiết kết quả của học viên.</div>";
            }

            return new ResultDetailPayload
            {
                TestId = userTest.Id,
                Student = user,
                Categories = categoryNames,
                Data = dataForChart,
                Description = finalDescription,
                HandwritingComment = handwritingComment
            };
        }

        public async Task<ComparisonChartPayload> GetComparisonChartPayloadAsync(int studentId)
        {
            var user = await GetStudentProfileAsync(studentId) ?? throw new InvalidOperationException("Student not found.");
            var categories = await _context.QuestionCategories
                .Where(x => x.Enable == true)
                .OrderBy(x => x.DisplayOrder)
                .ToListAsync();
            var categoryNames = categories.Select(c => c.Name ?? string.Empty).ToArray();
            var validCategoryIds = categories.Select(c => c.Id).ToList();

            var currentUserTest = await _context.UserTests
                .Where(x => x.UserId == studentId && x.IsComplete == true)
                .OrderByDescending(x => x.Id)
                .FirstOrDefaultAsync();

            if (currentUserTest == null)
            {
                throw new InvalidOperationException("Không tìm thấy bài kiểm tra hoàn thành.");
            }

            int userLop = currentUserTest.Lop ?? currentUserTest.AgeGroup ?? user.lop;
            int[] currentUserData = new int[validCategoryIds.Count];
            for (int i = 0; i < validCategoryIds.Count; i++)
            {
                currentUserData[i] = await CalculateCategoryPercentage(currentUserTest.Id, validCategoryIds[i]);
            }

            int[] avgDataZero = await CalculateAverageSeries(validCategoryIds, userLop, studentId, courseIdIsZero: true);
            int[] avgDataOther = await CalculateAverageSeries(validCategoryIds, userLop, studentId, courseIdIsZero: false);

            return new ComparisonChartPayload
            {
                Categories = categoryNames,
                CurrentUserData = currentUserData,
                AvgDataZero = avgDataZero,
                AvgDataOther = avgDataOther,
                TestId = currentUserTest.Id
            };
        }

        public async Task<RadarChartPayload> GetRadarChartPayloadAsync(int studentId)
        {
            var user = await GetStudentProfileAsync(studentId) ?? throw new InvalidOperationException("Student not found.");

            var userTests = await _context.UserTests
                .Where(x => x.UserId == studentId && x.IsComplete == true)
                .OrderBy(x => x.DateCreate)
                .ToListAsync();

            var categories = await _context.QuestionCategories
                .Where(x => x.Enable == true)
                .OrderBy(x => x.DisplayOrder)
                .ToListAsync();

            var chartData = new List<RadarSeriesPayload>();
            foreach (var test in userTests)
            {
                int[] dataForCurrentTest = new int[categories.Count];
                for (int i = 0; i < categories.Count; i++)
                {
                    dataForCurrentTest[i] = await CalculateCategoryPercentage(test.Id, categories[i].Id);
                }

                chartData.Add(new RadarSeriesPayload
                {
                    Name = test.CourseId == 0 ? "Chưa học Superbrain" : "Đã học Khóa " + test.CourseName,
                    TestId = test.Id,
                    Date = test.DateCreate?.ToString("yyyy-MM-dd"),
                    Data = dataForCurrentTest
                });
            }

            return new RadarChartPayload
            {
                Categories = categories.Select(c => c.Name ?? string.Empty).ToArray(),
                ChartData = chartData
            };
        }

        private async Task<int[]> CalculateAverageSeries(List<int> validCategoryIds, int userLop, int studentId, bool courseIdIsZero)
        {
            var tests = await _context.UserTests
                .Where(ut => ut.UserId != studentId && ut.IsComplete == true && (ut.Lop ?? ut.AgeGroup) == userLop && (courseIdIsZero ? ut.CourseId == 0 : ut.CourseId != 0))
                .ToListAsync();

            int[] result = new int[validCategoryIds.Count];
            if (!tests.Any())
            {
                return result;
            }

            var categoryTotals = new Dictionary<int, (double Sum, int Count)>();
            foreach (var test in tests)
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
                    if (!categoryTotals.ContainsKey(categoryId))
                    {
                        categoryTotals[categoryId] = (0, 0);
                    }

                    var current = categoryTotals[categoryId];
                    categoryTotals[categoryId] = (current.Sum + percentage, current.Count + 1);
                }
            }

            for (int i = 0; i < validCategoryIds.Count; i++)
            {
                int categoryId = validCategoryIds[i];
                if (categoryTotals.TryGetValue(categoryId, out var totals) && totals.Count > 0)
                {
                    result[i] = (int)Math.Round(totals.Sum / totals.Count);
                }
            }

            return result;
        }

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

        public async Task<AttemptDetailsPayload> GetAttemptDetailsPayloadAsync(int testId)
        {
            var attempt = await _context.UserTests.FirstOrDefaultAsync(x => x.Id == testId);
            if (attempt == null)
            {
                throw new Exception("Không tìm thấy phiên làm bài.");
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

            var resultsToDisplay = results
                .OrderBy(r => r.Question?.OnPaper == true ? 1 : 0)
                .ThenBy(r => r.Question?.Category?.DisplayOrder ?? 0)
                .ThenBy(r => r.QuestionId)
                .ToList();

            var orderedResults = resultsToDisplay;

            var questionDetails = orderedResults.Select(r =>
            {
                var catId = r.CategoryId ?? r.Question?.CategoryId ?? 0;
                var cat = categories.FirstOrDefault(c => c.Id == catId);
                var maxPoint = r.MaxPoint ?? r.Question?.MaxPoint ?? 0;
                var earned = r.PointEarned ?? 0;
                var isCorrect = maxPoint > 0 && earned >= maxPoint;
                return new AttemptQuestionDetail
                {
                    QuestionId = r.QuestionId,
                    QuestionName = r.Question?.Name ?? "",
                    CategoryId = catId,
                    CategoryName = cat?.Name ?? r.Question?.Category?.Name ?? "Unknown",
                    CategoryColor = cat?.Color ?? r.Question?.Category?.Color ?? "",
                    EarnedPoints = earned,
                    MaxPoint = maxPoint,
                    IsCorrect = isCorrect
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
                    CategoryId = g.Key,
                    EarnedPoints = g.Sum(x => x.PointEarned ?? 0),
                    MaxPoint = g.Sum(x => x.MaxPoint ?? x.Question?.MaxPoint ?? 0)
                })
                .ToList();

            var userTestDetails = await _context.UserTestDetails
                .Where(d => d.ResultId == testId)
                .ToListAsync();

            foreach (var category in categories)
            {
                if (!rawTotals.Any(rt => rt.CategoryId == category.Id))
                {
                    var detailsForCategory = userTestDetails.Where(d => d.CategoryId == category.Id).ToList();
                    if (detailsForCategory.Any())
                    {
                        rawTotals.Add(new
                        {
                            CategoryId = category.Id,
                            EarnedPoints = detailsForCategory.Sum(d => d.PointEarned),
                            MaxPoint = detailsForCategory.Sum(d => d.TotalPoint)
                        });
                    }
                }
            }

            var totalsByCat = rawTotals.ToDictionary(x => x.CategoryId, x => x);

            var categoryTotals = categories.Select(c =>
            {
                totalsByCat.TryGetValue(c.Id, out var row);
                var earned = row?.EarnedPoints ?? 0;
                var max = row?.MaxPoint ?? 0;
                var percent = max > 0 ? (int)Math.Round((double)earned / max * 100) : 0;
                return new AttemptCategoryTotal
                {
                    CategoryId = c.Id,
                    CategoryName = c.Name ?? "",
                    CategoryColor = c.Color ?? "",
                    EarnedPoints = earned,
                    MaxPoint = max,
                    Percent = percent
                };
            }).ToList();

            return new AttemptDetailsPayload
            {
                Attempt = new AttemptInfo { GeneralComment = attempt.GeneralComment ?? "" },
                Questions = questionDetails,
                Categories = categories.Select(c => c.Name ?? string.Empty).ToArray(),
                CategoryTotals = categoryTotals
            };
        }

        public async Task<List<StudentWithTestDetailsForExport>> GetStudentTestDetailsForExportAsync(List<int> studentIds)
        {
            var result = new List<StudentWithTestDetailsForExport>();
            
            var categories = await _context.QuestionCategories
                .Where(x => x.Enable == true)
                .OrderBy(x => x.DisplayOrder)
                .ToListAsync();

            foreach (var studentId in studentIds)
            {
                var latestTest = await _context.UserTests
                    .Where(x => x.UserId == studentId && x.IsComplete == true)
                    .OrderByDescending(x => x.DateCreate)
                    .FirstOrDefaultAsync();

                if (latestTest == null) continue;

                var categoryScores = new Dictionary<int, int>();

                // Lấy điểm từ paper results
                var paperResults = await _context.questionResults
                    .Where(qr => qr.SessionId == latestTest.Id)
                    .GroupBy(qr => qr.CategoryId)
                    .Select(g => new { CategoryId = g.Key, Earned = g.Sum(x => x.PointEarned ?? 0), Max = g.Sum(x => x.MaxPoint ?? 0) })
                    .ToListAsync();

                foreach (var pr in paperResults)
                {
                    if (pr.Max > 0)
                    {
                        int percent = (int)Math.Round((double)pr.Earned / pr.Max * 100);
                        categoryScores[pr.CategoryId ?? 0] = Math.Min(100, Math.Max(0, percent));
                    }
                }

                // Lấy điểm từ online results cho các category chưa có
                var onlineDetails = await _context.UserTestDetails
                    .Where(d => d.ResultId == latestTest.Id)
                    .GroupBy(d => d.CategoryId)
                    .Select(g => new { CategoryId = g.Key, Earned = g.Sum(x => x.PointEarned), Max = g.Sum(x => x.TotalPoint) })
                    .ToListAsync();

                foreach (var od in onlineDetails)
                {
                    if (!categoryScores.ContainsKey(od.CategoryId))
                    {
                        if (od.Max > 0)
                        {
                            int percent = (int)Math.Round((double)od.Earned / od.Max * 100);
                            categoryScores[od.CategoryId] = Math.Min(100, Math.Max(0, percent));
                        }
                    }
                }

                // Tính tổng điểm
                var totalEarned = 0;
                var totalMax = 0;
                foreach (var cat in categories)
                {
                    if (categoryScores.TryGetValue(cat.Id, out var score))
                    {
                        totalEarned += score;
                        totalMax += 100;
                    }
                }

                int totalPercent = totalMax > 0 ? totalEarned / categories.Count : 0;
                int timeToComplete = latestTest.TimeToCompleted ?? 0;

                result.Add(new StudentWithTestDetailsForExport
                {
                    StudentId = studentId,
                    TestId = latestTest.Id,
                    TimeToComplete = timeToComplete,
                    TotalScore = totalPercent,
                    CategoryScores = categoryScores
                });
            }

            return result;
        }

        public async Task<byte[]> ExportStudentListToExcelAsync(List<StudentWithTestStatus> students)
        {
            // Set EPPlus license context
            ExcelPackage.LicenseContext = LicenseContext.NonCommercial;

            using (var package = new ExcelPackage())
            {
                var worksheet = package.Workbook.Worksheets.Add("Danh sách học viên");

                // Get all categories and questions
                var categories = await _context.QuestionCategories
                    .Where(x => x.Enable == true)
                    .OrderBy(x => x.DisplayOrder)
                    .ToListAsync();

                // Get all online questions only, ordered by ID
                var allQuestions = await _context.Questions
                    .Where(x => x.Enable && x.OnPaper == false) // Online questions only
                    .OrderBy(x => x.Id)
                    .ToListAsync();

                // Group questions by category
                var questionsByCategory = allQuestions.GroupBy(q => q.CategoryId).ToDictionary(g => g.Key, g => g.ToList());

                // Calculate total questions (max in any category)
                int totalQuestions = allQuestions.Count;

                // Setup headers
                int headerRow = 1;
                int currentCol = 1;

                // Column 1: STT (Số thứ tự)
                SetHeaderCell(worksheet, headerRow, currentCol++, "STT");

                // Column 2-9: Basic info
                var basicHeaders = new[] { "Mã học viên", "Tên", "Cơ sở", "Ngày làm test", "Khoá học", "Ngày sinh", "Lớp", "Time làm bài" };
                for (int i = 0; i < basicHeaders.Length; i++)
                {
                    SetHeaderCell(worksheet, headerRow, currentCol++, basicHeaders[i]);
                }

                // Column 10-12: Skill evaluation
                SetHeaderCell(worksheet, headerRow, currentCol++, "Kỳ năng");
                SetHeaderCell(worksheet, headerRow, currentCol++, "Tổng điểm");
                SetHeaderCell(worksheet, headerRow, currentCol++, "% Kết quả luyện tập");

                // Column 13+: Questions (Câu 1, Câu 2, ...)
                int questionStartCol = currentCol;
                for (int i = 1; i <= totalQuestions; i++)
                {
                    SetHeaderCell(worksheet, headerRow, currentCol++, $"Câu {i}");
                }

                // Set column widths
                worksheet.Column(1).Width = 8;   // STT
                worksheet.Column(2).Width = 15;  // Mã học viên
                worksheet.Column(3).Width = 20;  // Tên
                worksheet.Column(4).Width = 15;  // Cơ sở
                worksheet.Column(5).Width = 15;  // Ngày làm test
                worksheet.Column(6).Width = 15;  // Khoá học
                worksheet.Column(7).Width = 12;  // Ngày sinh
                worksheet.Column(8).Width = 10;  // Lớp
                worksheet.Column(9).Width = 15;  // Time làm bài
                worksheet.Column(10).Width = 15; // Kỳ năng
                worksheet.Column(11).Width = 12; // Tổng điểm
                worksheet.Column(12).Width = 18; // % Kết quả
                for (int i = questionStartCol; i < questionStartCol + totalQuestions; i++)
                {
                    worksheet.Column(i).Width = 10;
                }

                // Data rows
                int dataRow = 2;
                int sttCounter = 1;

                for (int studentIdx = 0; studentIdx < students.Count; studentIdx++)
                {
                    var student = students[studentIdx];

                    // Get student's latest test
                    var latestTest = await _context.UserTests
                        .Where(x => x.UserId == student.Id && x.IsComplete == true)
                        .OrderByDescending(x => x.DateCreate)
                        .FirstOrDefaultAsync();

                    if (latestTest == null) continue;

                    // Get question results for this test (online questions)
                    var questionResults = await _context.questionResults
                        .Where(qr => qr.SessionId == latestTest.Id)
                        .ToListAsync();

                    var resultsByQuestionId = questionResults.ToDictionary(qr => qr.QuestionId, qr => qr);

                    bool isFirstCategoryOfStudent = true;

                    // For each category, create a row
                    foreach (var category in categories)
                    {
                        // Only add row if this category has questions
                        if (!questionsByCategory.ContainsKey(category.Id) || questionsByCategory[category.Id].Count == 0)
                            continue;

                        currentCol = 1;

                        // Column 1: STT (only for first category of this student)
                        if (isFirstCategoryOfStudent)
                        {
                            worksheet.Cells[dataRow, currentCol++].Value = sttCounter++;
                        }
                        else
                        {
                            currentCol++;
                        }

                        // Column 2-9: Basic info (only for first category of this student)
                        if (isFirstCategoryOfStudent)
                        {
                            worksheet.Cells[dataRow, currentCol++].Value = student.mahs; // Mã học viên
                            worksheet.Cells[dataRow, currentCol++].Value = student.ten; // Tên
                            worksheet.Cells[dataRow, currentCol++].Value = "HQ"; // Cơ sở
                            worksheet.Cells[dataRow, currentCol++].Value = latestTest.DateCreate?.ToString("dd/MM/yyyy"); // Ngày làm test
                            worksheet.Cells[dataRow, currentCol++].Value = student.CourseName ?? "Chưa học"; // Khoá học
                            worksheet.Cells[dataRow, currentCol++].Value = student.namsinh.Year; // Ngày sinh (year)
                            worksheet.Cells[dataRow, currentCol++].Value = student.Lop?.ToString() ?? "-"; // Lớp
                            
                            // Time làm bài: convert seconds to hh:mm:ss format
                            int totalSeconds = latestTest.TimeToCompleted ?? 0;
                            int hours = totalSeconds / 3600;
                            int minutes = (totalSeconds % 3600) / 60;
                            int seconds = totalSeconds % 60;
                            worksheet.Cells[dataRow, currentCol++].Value = $"{hours:D2}:{minutes:D2}:{seconds:D2}";
                            
                            isFirstCategoryOfStudent = false;
                        }
                        else
                        {
                            currentCol += 8; // Skip basic info columns
                        }

                        // Column 10: Skill name
                        worksheet.Cells[dataRow, currentCol++].Value = category.Name;

                        // Get questions in this category
                        var categoryQuestions = questionsByCategory[category.Id];

                        // Calculate total score for this category
                        int totalEarned = 0;
                        int totalMax = 0;
                        foreach (var q in categoryQuestions)
                        {
                            if (resultsByQuestionId.TryGetValue(q.Id, out var result))
                            {
                                totalEarned += result.PointEarned ?? 0;
                                totalMax += result.MaxPoint ?? 0;
                            }
                        }

                        int categoryPercent = totalMax > 0 ? (int)Math.Round((double)totalEarned / totalMax * 100) : 0;

                        // Column 11: Total score for category
                        worksheet.Cells[dataRow, currentCol++].Value = totalEarned;

                        // Column 12: Percentage
                        worksheet.Cells[dataRow, currentCol++].Value = categoryPercent;

                        // Column 13+: Question scores
                        // Show ALL questions, but only those in this category have scores
                        for (int q = 0; q < totalQuestions; q++)
                        {
                            if (q < allQuestions.Count)
                            {
                                var question = allQuestions[q];
                                // Only show score if question is in this category
                                if (question.CategoryId == category.Id && resultsByQuestionId.TryGetValue(question.Id, out var result))
                                {
                                    worksheet.Cells[dataRow, currentCol].Value = result.PointEarned ?? 0;
                                }
                                else
                                {
                                    worksheet.Cells[dataRow, currentCol].Value = "";
                                }
                            }
                            currentCol++;
                        }

                        dataRow++;
                    }
                }

                // Auto-fit columns
                worksheet.Cells.AutoFitColumns();

                // Return as byte array
                return package.GetAsByteArray();
            }
        }

        private void SetHeaderCell(ExcelWorksheet worksheet, int row, int col, string value)
        {
            var cell = worksheet.Cells[row, col];
            cell.Value = value;
            cell.Style.Font.Bold = true;
            cell.Style.Fill.PatternType = OfficeOpenXml.Style.ExcelFillStyle.Solid;
            cell.Style.Fill.BackgroundColor.SetColor(System.Drawing.Color.FromArgb(25, 135, 84)); // Bootstrap success color
            cell.Style.Font.Color.SetColor(System.Drawing.Color.White);
            cell.Style.HorizontalAlignment = OfficeOpenXml.Style.ExcelHorizontalAlignment.Center;
            cell.Style.VerticalAlignment = OfficeOpenXml.Style.ExcelVerticalAlignment.Center;
        }
    }

    public class PrintExamPayload
    {
        public User Student { get; set; } = new();
        public List<PrintExamQuestion> Questions { get; set; } = new();
    }

    public class PrintExamQuestion
    {
        public int Id { get; set; }
        public string? Name { get; set; }
        public int? CategoryId { get; set; }
        public int? MaxPoint { get; set; }
        public int? MaxPointCategory { get; set; }
        public int? AgeGroup { get; set; }
        public string? CategoryName { get; set; }
        public bool HasImage { get; set; }
        public string? Image { get; set; }
    }

    public class ResultDetailPayload
    {
        public int TestId { get; set; }
        public User Student { get; set; } = new();
        public string[] Categories { get; set; } = Array.Empty<string>();
        public int[] Data { get; set; } = Array.Empty<int>();
        public string Description { get; set; } = string.Empty;
        public string HandwritingComment { get; set; } = string.Empty;
    }

    public class RadarChartPayload
    {
        public string[] Categories { get; set; } = Array.Empty<string>();
        public List<RadarSeriesPayload> ChartData { get; set; } = new();
    }

    public class RadarSeriesPayload
    {
        public string Name { get; set; } = string.Empty;
        public int TestId { get; set; }
        public string? Date { get; set; }
        public int[] Data { get; set; } = Array.Empty<int>();
    }

    public class ComparisonChartPayload
    {
        public string[] Categories { get; set; } = Array.Empty<string>();
        public int[] CurrentUserData { get; set; } = Array.Empty<int>();
        public int[] AvgDataZero { get; set; } = Array.Empty<int>();
        public int[] AvgDataOther { get; set; } = Array.Empty<int>();
        public int TestId { get; set; }
    }

    public class AttemptDetailsPayload
    {
        public AttemptInfo Attempt { get; set; } = new();
        public List<AttemptQuestionDetail> Questions { get; set; } = new();
        public string[] Categories { get; set; } = Array.Empty<string>();
        public List<AttemptCategoryTotal> CategoryTotals { get; set; } = new();
    }

    public class AttemptInfo
    {
        public string GeneralComment { get; set; } = string.Empty;
    }

    public class AttemptQuestionDetail
    {
        public int QuestionId { get; set; }
        public string QuestionName { get; set; } = string.Empty;
        public int CategoryId { get; set; }
        public string CategoryName { get; set; } = string.Empty;
        public string CategoryColor { get; set; } = string.Empty;
        public int EarnedPoints { get; set; }
        public int MaxPoint { get; set; }
        public bool IsCorrect { get; set; }
    }

    public class AttemptCategoryTotal
    {
        public int CategoryId { get; set; }
        public string CategoryName { get; set; } = string.Empty;
        public string CategoryColor { get; set; } = string.Empty;
        public int EarnedPoints { get; set; }
        public int MaxPoint { get; set; }
        public int Percent { get; set; }
    }

    public class StudentWithTestDetailsForExport
    {
        public int StudentId { get; set; }
        public int TestId { get; set; }
        public int TimeToComplete { get; set; }
        public int TotalScore { get; set; }
        public Dictionary<int, int> CategoryScores { get; set; } = new();
    }
}
