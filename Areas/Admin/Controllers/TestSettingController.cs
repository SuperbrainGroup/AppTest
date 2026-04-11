using AppTest.Helper;
using AppTest.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;

namespace AppTest.Areas.Admin.Controllers
{
    [Area("Admin")]
    [Authorize(Policy = AppPolicies.AdminOnly)]
    public class TestSettingController : Controller
    {
        public ModelDbContext _context;
        private readonly string _bgFolder = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot/uploads/settings/backgrounds");

        public TestSettingController(ModelDbContext context)
        {
            _context = context;
            if (!Directory.Exists(_bgFolder)) Directory.CreateDirectory(_bgFolder);
        }

        [Route("/admin/cai-dat-he-thong")] // MODIFIED ROUTE
        public async Task<IActionResult> Index()
        {
            var currentBg = await _context.AppSettings
                .FirstOrDefaultAsync(x => x.SettingKey == "StudentBackground");
            
            ViewBag.CurrentBackground = currentBg?.SettingValue ?? "";
            return View();
        }

        [HttpPost]
        public async Task<IActionResult> UploadBackground(IFormFile file)
        {
            if (file == null || file.Length == 0)
                return Json(new { success = false, message = "Vui lòng chọn file ảnh." });

            var ext = Path.GetExtension(file.FileName).ToLower();
            if (ext != ".jpg" && ext != ".jpeg" && ext != ".png")
                return Json(new { success = false, message = "Chỉ hỗ trợ định dạng JPG hoặc PNG." });

            try
            {
                var fileName = Guid.NewGuid().ToString() + ext;
                var filePath = Path.Combine(_bgFolder, fileName);

                using (var stream = new FileStream(filePath, FileMode.Create))
                {
                    await file.CopyToAsync(stream);
                }

                return Json(new { success = true, message = "Tải ảnh lên thành công!" });
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = "Lỗi: " + ex.Message });
            }
        }

        [HttpGet]
        public IActionResult GetGallery()
        {
            try
            {
                var files = Directory.GetFiles(_bgFolder)
                    .Select(Path.GetFileName)
                    .Select(name => "/uploads/settings/backgrounds/" + name)
                    .ToList();

                return Json(new { success = true, data = files });
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = ex.Message });
            }
        }

        [HttpPost]
        public async Task<IActionResult> SetActiveBackground(string url)
        {
            if (string.IsNullOrEmpty(url)) return Json(new { success = false });

            var setting = await _context.AppSettings
                .FirstOrDefaultAsync(x => x.SettingKey == "StudentBackground");

            if (setting == null)
            {
                _context.AppSettings.Add(new AppSetting { SettingKey = "StudentBackground", SettingValue = url });
            }
            else
            {
                setting.SettingValue = url;
            }

            await _context.SaveChangesAsync();
            return Json(new { success = true, message = "Đã thay đổi ảnh nền giao diện học viên!" });
        }
    }
}