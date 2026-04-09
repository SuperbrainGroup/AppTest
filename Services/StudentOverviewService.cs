using AppTest.Models;
using Microsoft.EntityFrameworkCore;
using Newtonsoft.Json;

namespace AppTest.Services
{
    public interface IStudentOverviewService
    {
        Task<User?> GetStudentProfileAsync(int userId);
        Task<List<StudentWithTestStatus>> GetAllTestedStudentsAsync(string? search, int offset, int limit);
        Task<PrintExamPayload> GetPrintExamPayloadAsync(int studentId);
        Task<ResultDetailPayload> GetResultDetailPayloadAsync(int studentId);
        Task<RadarChartPayload> GetRadarChartPayloadAsync(int studentId);
        Task<ComparisonChartPayload> GetComparisonChartPayloadAsync(int studentId);
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

                int lop = Math.Clamp(student.lop, 1, 12);
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

        public async Task<List<StudentWithTestStatus>> GetAllTestedStudentsAsync(string? search, int offset, int limit)
        {
            var latestTests = await _context.UserTests
                .Where(x => x.IsComplete == true && x.UserId != null)
                .GroupBy(x => x.UserId!.Value)
                .Select(g => new
                {
                    UserId = g.Key,
                    NumberTest = g.Count(),
                    DateTest = g.Max(x => x.DateCreate)
                })
                .OrderByDescending(x => x.DateTest)
                .ToListAsync();

            var enriched = new List<StudentWithTestStatus>();
            foreach (var item in latestTests)
            {
                var student = await GetStudentProfileAsync(item.UserId);
                if (student == null)
                {
                    continue;
                }

                DateTime.TryParse(student.ngaysinh, out var birthDate);
                enriched.Add(new StudentWithTestStatus
                {
                    Id = student.Id,
                    mahs = student.mahs,
                    ten = student.ten ?? string.Empty,
                    Email = student.Email ?? string.Empty,
                    dienthoai = student.phhs_dienthoai ?? string.Empty,
                    namsinh = birthDate,
                    CourseName = student.courseName ?? string.Empty,
                    HasTestResult = true,
                    NumberTest = item.NumberTest,
                    DateTest = item.DateTest
                });
            }

            if (!string.IsNullOrWhiteSpace(search))
            {
                string normalized = search.Trim().ToLowerInvariant();
                enriched = enriched
                    .Where(x =>
                        (x.mahs ?? string.Empty).ToLowerInvariant().Contains(normalized) ||
                        (x.ten ?? string.Empty).ToLowerInvariant().Contains(normalized) ||
                        (x.Email ?? string.Empty).ToLowerInvariant().Contains(normalized) ||
                        (x.dienthoai ?? string.Empty).ToLowerInvariant().Contains(normalized) ||
                        (x.CourseName ?? string.Empty).ToLowerInvariant().Contains(normalized))
                    .ToList();
            }

            return enriched
                .Skip(Math.Max(offset, 0))
                .Take(limit <= 0 ? 50 : limit)
                .ToList();
        }

        public async Task<PrintExamPayload> GetPrintExamPayloadAsync(int studentId)
        {
            var user = await GetStudentProfileAsync(studentId) ?? throw new InvalidOperationException("Student not found.");
            int lop = user.lop;

            var questions = await _context.Questions
                .Where(q => q.OnPaper == true && q.Lop == lop)
                .OrderBy(q => q.CategoryId)
                .Include(q => q.Category)
                .Select(q => new PrintExamQuestion
                {
                    Id = q.Id,
                    Name = q.Name,
                    CategoryId = q.CategoryId,
                    MaxPoint = q.MaxPoint,
                    MaxPointCategory = _context.Questions.Where(x => x.CategoryId == q.CategoryId && x.Lop == lop).Sum(x => x.MaxPoint),
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
}
