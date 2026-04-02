using AppTest.Helper;
using AppTest.Models;
using Humanizer;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.CodeAnalysis.Operations;
using Microsoft.EntityFrameworkCore;
using Newtonsoft.Json.Linq;
using Newtonsoft.Json;
using System.Collections.Generic;
using System.Net.Http;
using System.Security.Cryptography;
using System.Text.Json;
using Microsoft.Data.SqlClient;

namespace AppTest.Areas.Admin.Controllers
{
    [Area("Admin")]
    [Authorize(Policy = AppPolicies.AdminOnly)]
    public class TestController : Controller
    {
        private readonly ModelDbContext _context;
        private readonly HttpClient _httpClient; 
        private readonly IHttpClientFactory _httpClientFactory;
        public TestController(ModelDbContext context, HttpClient httpClient,IHttpClientFactory httpClientFactory)
        {
            _context = context;
            _httpClient = httpClient;
            _httpClientFactory = httpClientFactory;
        }
        public IActionResult Index()
        {
            return View();
        }
        public IActionResult ResultDetail(int? userId)
        {
            TempData["userId"] = userId;
            return View();
        }
        [HttpGet]
        [Route("ListStudentTestResult")]
        public async Task<IActionResult> GetStudents(int limit,int offset,string search)
        {
            MD5Hash md5 = new MD5Hash();
            var idChiNhanhEncrypt = HttpContext.Request.Cookies["chinhanhId"];
            int branchId = Convert.ToInt32(md5.Decrypt(idChiNhanhEncrypt));
            string apiUrl = $"http://45.119.82.38:6969/api/Students/GetStudentByChiNhanh/{branchId}?limit={limit}&offset={offset}&search={search}";

            var response = await _httpClient.GetAsync(apiUrl);
            if (!response.IsSuccessStatusCode)
            {
                return BadRequest(new { success = false, message = "Không thể tải danh sách học viên!" });
            }

            var jsonString = await response.Content.ReadAsStringAsync();
            var students = System.Text.Json.JsonSerializer.Deserialize<List<StudentDto>>(jsonString, new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            });
            var listStudent = new List<StudentWithTestStatus>();
            foreach(var s in students)
            {
                    var stu = new StudentWithTestStatus()
                    {
                        Id = s.idhocvien,
                        ten = s.tenhocvien,
                        Email = s.email,
                        dienthoai = s.phhs_dienthoai,
                        CourseName = s.tenkhoahoc
                    };
                var result = _context.UserTests.Where(x => x.UserId == s.idhocvien && x.IsComplete ==true);
                if (result.Any())
                {
                    stu.HasTestResult = true;
                    stu.NumberTest = result.Count();
                }
                listStudent.Add(stu);
            }
            if (students == null) return Ok(new { success = true,message="không thấy danh sách", data = new List<StudentWithTestStatus>() });

            return Ok(new { success = true,message="đã lấy danh sách thành công", data = listStudent });
        }
        [HttpGet("GetTestResults")]
        public IActionResult GetTestResults(int userId)
        {
            var testResults = _context.UserTests
                .Where(tr => tr.UserId == userId && tr.IsComplete==true)
                .ToList();

            if (!testResults.Any())
            {
                return NotFound(new { success = false, message = "Không có dữ liệu."+userId });
            }

            var resultsData = new List<object>();

            foreach (var test in testResults)
            {
            }

            return Ok(new { success = true, data = resultsData });
        }
    }
   
}