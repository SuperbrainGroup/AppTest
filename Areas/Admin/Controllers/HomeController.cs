using AppTest.Helper;
using AppTest.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Newtonsoft.Json.Linq;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;

namespace AppTest.Areas.Admin.Controllers
{
    [Area("Admin")]
    [Authorize(Policy = AppPolicies.AdminOnly)]
    public class HomeController : Controller
    {
        private readonly ModelDbContext _context;
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly MD5Hash md5 = new MD5Hash();

        public HomeController(ModelDbContext context, IHttpClientFactory httpClientFactory)
        {
            _context = context;
            _httpClientFactory = httpClientFactory;
        }

        public IActionResult Index()
        {
            return View("Dashboard");
        }

        [Route("/admin/student-overview")]
        public IActionResult StudentOverview()
        {
            return View("Index");
        }

        [Route("/admin/danh-sach-hoc-vien")]
        public IActionResult List()
        {
            return View();
        }

        // ===========================
        // Dashboard APIs
        // ===========================
        [HttpGet]
        [Route("/admin/api/dashboard/course-category")]
        public async Task<IActionResult> CourseCategory()
        {
            var categories = await _context.QuestionCategories
                .Where(c => c.Enable == true)
                .OrderBy(c => c.DisplayOrder)
                .Select(c => new { id = c.Id, name = c.Name, color = c.Color })
                .ToListAsync();

            if (!categories.Any()) return Ok(new { categories = new List<object>(), courses = new List<object>(), seriesByCategory = new List<object>() });

            var onlineResults = await (
                from d in _context.UserTestDetails
                join ut in _context.UserTests on d.ResultId equals ut.Id
                where ut.IsComplete == true
                group d by new { classKey = ut.Lop, catId = d.CategoryId } into g
                select new
                {
                    classKey = g.Key.classKey,
                    catId = g.Key.catId,
                    sumEarned = (double)g.Sum(x => x.PointEarned),
                    sumMax = (double)g.Sum(x => x.TotalPoint)
                }
            ).ToListAsync();

            var paperResults = await (
                from qr in _context.questionResults
                join ut in _context.UserTests on qr.SessionId equals ut.Id
                where ut.IsComplete == true && qr.CategoryId != null
                group qr by new { classKey = ut.Lop, catId = qr.CategoryId.Value } into g
                select new
                {
                    classKey = g.Key.classKey,
                    catId = g.Key.catId,
                    sumEarned = (double)g.Sum(x => x.PointEarned ?? 0),
                    sumMax = (double)g.Sum(x => x.MaxPoint ?? 0)
                }
            ).ToListAsync();

            var allMergedResults = onlineResults
                .Concat(paperResults)
                .GroupBy(x => new { x.classKey, x.catId })
                .Select(g => new
                {
                    classKey = g.Key.classKey,
                    catId = g.Key.catId,
                    sumEarned = g.Sum(x => x.sumEarned),
                    sumMax = g.Sum(x => x.sumMax)
                }).ToList();

            var classKeys = allMergedResults.Select(x => x.classKey).Distinct().OrderBy(l => l ?? 0).ToList();
            var courses = classKeys.Select(l => new {
                key = l?.ToString() ?? "0",
                label = (l == null || l == 0) ? "Chưa lớp" : $"Lớp {l}"
            }).ToList();

            var percentMap = new Dictionary<string, int>();
            foreach (var row in allMergedResults)
            {
                string key = (row.classKey?.ToString() ?? "0") + "|" + row.catId;
                double percent = row.sumMax > 0 ? (row.sumEarned / row.sumMax) * 100.0 : 0;
                percentMap[key] = (int)System.Math.Round(percent);
            }

            var seriesByCategory = categories.Select(cat => new
            {
                categoryId = cat.id,
                name = cat.name,
                color = string.IsNullOrWhiteSpace(cat.color) ? "#198754" : cat.color, 
                data = classKeys.Select(l => {
                    string key = (l?.ToString() ?? "0") + "|" + cat.id;
                    return percentMap.ContainsKey(key) ? percentMap[key] : 0;
                }).ToList()
            }).ToList();

            return Ok(new 
            { 
                categories = categories.Select(c => c.name).ToList(), 
                courses, 
                seriesByCategory 
            });
        }
        
        [HttpGet]
        [Route("/admin/api/dashboard/top-branches")]
        public async Task<IActionResult> TopBranches(int top = 10)
        {
            int take = top > 0 ? top : 10;

            bool hasStoredBranch = await _context.UserTests.AnyAsync(ut =>
                ut.IsComplete == true &&
                ut.UserId != null &&
                ut.idChiNhanh != null &&
                ut.idChiNhanh != 0);

            if (hasStoredBranch)
            {
                var topRows = await _context.UserTests
                    .Where(ut => ut.IsComplete == true && ut.UserId != null && ut.idChiNhanh != null && ut.idChiNhanh != 0)
                    .GroupBy(ut => new { ut.idChiNhanh, ut.tenChiNhanh })
                    .Select(g => new
                    {
                        idChiNhanh = g.Key.idChiNhanh,
                        tenChiNhanh = g.Key.tenChiNhanh ?? string.Empty,
                        testedStudentCount = g.Select(x => x.UserId!.Value).Distinct().Count()
                    })
                    .OrderByDescending(x => x.testedStudentCount)
                    .Take(take)
                    .ToListAsync();

                return Ok(new { topBranches = topRows });
            }

            // Fallback (DB chưa có dữ liệu idChiNhanh): dùng logic cũ theo external API.
            using var client = _httpClientFactory.CreateClient();
            client.DefaultRequestHeaders.Add("accept", "application/json");

            var testedUserIds = await _context.UserTests
                .Where(ut => ut.IsComplete == true && ut.UserId != null)
                .Select(ut => ut.UserId!.Value)
                .Distinct()
                .ToListAsync();

            var testedSet = new HashSet<int>(testedUserIds);

            string chiNhanhUrl = "http://45.119.82.38:6969/api/ChiNhanh";
            var branchesJson = await client.GetStringAsync(chiNhanhUrl);
            var branchesToken = JToken.Parse(branchesJson);
            var branchesArray = branchesToken as JArray ?? (branchesToken["data"] as JArray);
            branchesArray ??= new JArray();

            int GetIntField(JToken t, params string[] names)
            {
                foreach (var n in names)
                {
                    var v = t[n];
                    if (v == null) continue;
                    if (int.TryParse(v.ToString(), out var id)) return id;
                }
                return 0;
            }

            string GetStringField(JToken t, params string[] names)
            {
                foreach (var n in names)
                {
                    var v = t[n];
                    if (v == null) continue;
                    var s = v.ToString();
                    if (!string.IsNullOrWhiteSpace(s)) return s;
                }
                return string.Empty;
            }

            var branches = branchesArray
                .Select(b => new
                {
                    idChiNhanh = GetIntField(b, "idChiNhanh", "id", "Id"),
                    tenChiNhanh = GetStringField(b, "tenChiNhanh", "ten", "name", "Ten")
                })
                .Where(x => x.idChiNhanh != 0)
                .ToList();

            var results = new List<TopBranchRow>();
            const int pageLimit = 250;

            foreach (var branch in branches)
            {
                var branchStudentIds = new HashSet<int>();
                int offset = 0;

                while (true)
                {
                    string studentsUrl =
                        $"http://45.119.82.38:6969/api/Students/GetStudentByChiNhanh/{branch.idChiNhanh}?limit={pageLimit}&offset={offset}&search=";

                    var studentsJson = await client.GetStringAsync(studentsUrl);
                    var studentsToken = JToken.Parse(studentsJson);
                    var studentsArray = studentsToken as JArray ?? (studentsToken["data"] as JArray);
                    if (studentsArray == null || studentsArray.Count == 0)
                        break;

                    foreach (var s in studentsArray)
                    {
                        int userId = GetIntField(s, "id", "Id", "userId", "UserId", "USERID");
                        if (userId != 0) branchStudentIds.Add(userId);
                    }

                    if (studentsArray.Count < pageLimit)
                        break;

                    offset += pageLimit;
                }

                int testedCount = branchStudentIds.Count(uid => testedSet.Contains(uid));
                results.Add(new TopBranchRow
                {
                    idChiNhanh = branch.idChiNhanh,
                    tenChiNhanh = branch.tenChiNhanh,
                    testedStudentCount = testedCount
                });
            }

            var ordered = results
                .OrderByDescending(x => x.testedStudentCount)
                .Take(take)
                .ToList();

            return Ok(new { topBranches = ordered });
        }

        private class TopBranchRow
        {
            public int idChiNhanh { get; set; }
            public string? tenChiNhanh { get; set; }
            public int testedStudentCount { get; set; }
        }
    }
}
