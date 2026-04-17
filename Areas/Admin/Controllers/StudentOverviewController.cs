using AppTest.Helper;
using AppTest.Models;
using AppTest.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AppTest.Areas.Admin.Controllers
{
    [Area("Admin")]
    [Authorize(Policy = AppPolicies.AdminOnly)]
    public class StudentOverviewController : Controller
    {
        private readonly IStudentOverviewService _studentOverviewService;

        private readonly CheckUser _checkUser;

        public StudentOverviewController(IStudentOverviewService studentOverviewService, CheckUser checkUser)
        {
            _studentOverviewService = studentOverviewService;
            _checkUser = checkUser;
        }

        [HttpGet]
        [Route("/admin/api/student-overview/list")]
        public async Task<IActionResult> List(int limit = 50, int offset = 0, string? search = null)
        {
            try
            {
                int userId = _checkUser.GetUserId(); 
                var adminProfile = await _studentOverviewService.GetStaffProfileAsync(userId); // MODIFIED: Đổi từ Student sang Staff
                int idChiNhanh = adminProfile?.idChiNhanh ?? 0;

                var students = await _studentOverviewService.GetAllTestedStudentsAsync(idChiNhanh, search, offset, limit);
                return Ok(new { success = true, message = "Đã lấy danh sách thành công", data = students });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        [HttpGet]
        [Route("/admin/api/student-overview/print-exam")]
        public async Task<IActionResult> PrintExam(int studentId)
        {
            try
            {
                var payload = await _studentOverviewService.GetPrintExamPayloadAsync(studentId);
                return Json(new { success = true, data = payload.Questions, student = payload.Student });
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = ex.Message });
            }
        }

        [HttpGet]
        [Route("/admin/api/student-overview/result-detail")]
        public async Task<IActionResult> ResultDetail(int studentId)
        {
            try
            {
                var payload = await _studentOverviewService.GetResultDetailPayloadAsync(studentId);
                return Json(new
                {
                    success = true,
                    testId = payload.TestId,
                    student = payload.Student,
                    data = payload.Data,
                    categories = payload.Categories,
                    description = payload.Description,
                    handwritingComment = payload.HandwritingComment
                });
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = ex.Message });
            }
        }

        [HttpGet]
        [Route("/admin/api/student-overview/radar-chart")]
        public async Task<IActionResult> RadarChart(int studentId)
        {
            try
            {
                var payload = await _studentOverviewService.GetRadarChartPayloadAsync(studentId);
                return Ok(new { categories = payload.Categories, chartData = payload.ChartData });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { status = 500, message = ex.Message });
            }
        }

        [HttpGet]
        [Route("/admin/api/student-overview/comparison-chart")]
        public async Task<IActionResult> ComparisonChart(int studentId)
        {
            try
            {
                var payload = await _studentOverviewService.GetComparisonChartPayloadAsync(studentId);
                return Ok(new
                {
                    categories = payload.Categories,
                    currentUserData = payload.CurrentUserData,
                    avgDataZero = payload.AvgDataZero,
                    avgDataOther = payload.AvgDataOther,
                    testId = payload.TestId
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { status = 500, message = ex.Message });
            }
        }

        [HttpGet]
        [Route("/admin/student-overview/result-detail")]
        public async Task<IActionResult> ResultDetailView(int? studentId)
        {
            if (!studentId.HasValue)
            {
                return RedirectToAction("Index", "Home");
            }

            int userId = _checkUser.GetUserId();
            var user = await _studentOverviewService.GetStaffProfileAsync(userId);
            TempData["name"] = user?.ten ?? "Admin";
            TempData["studentId"] = studentId;
            return View("ResultDetail");
        }

        [HttpGet]
        [Route("/admin/api/student-overview/attempt-details")]
        public async Task<IActionResult> AttemptDetails(int testId)
        {
            try
            {
                var payload = await _studentOverviewService.GetAttemptDetailsPayloadAsync(testId);
                return Json(new
                {
                    success = true,
                    attempt = payload.Attempt,
                    questions = payload.Questions,
                    categories = payload.Categories,
                    categoryTotals = payload.CategoryTotals
                });
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = ex.Message });
            }
        }
    }
}
