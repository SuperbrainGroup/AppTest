using AppTest.Helper;
using AppTest.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using System.Linq;

namespace AppTest.Areas.Admin.Controllers
{
    [Area("Admin")]
    [Authorize(Policy = AppPolicies.AdminOnly)]
    public class CategoryController : Controller
    {
        private readonly ModelDbContext _context;
        private readonly CheckUser _checkUser;
        public CategoryController(ModelDbContext context, CheckUser checkUser)
        {
            _context = context;
            _checkUser = checkUser;
        }
        [Route("/admin/cai-dat-danh-muc")]
        public IActionResult Index()
        {
            return View();
        }
        [HttpGet]
        [Route("/GetListCategory")]
        public async Task<IActionResult> GetLists()
        {
            var cat = await _context.QuestionCategories.Where(x=>x.Enable==true).OrderBy(u => u.DisplayOrder).Select(c => new 
            {
                Id = c.Id,
                Name = c.Name,
                Description = c.Description,
                Count = _context.Questions.Count(x=>x.Enable && x.CategoryId == c.Id),
                Status = (c.Enable==true?"<span class='text-success'>Kích hoạt</span>": "Không kích hoạt"),
                Enable = c.Enable,
                c.DisplayOrder,
                color = c.Color,
                Settings = c.CategoryResultSettings.Where(x=>x.CategoryId==c.Id)
            }).ToListAsync();
            return Json(new{ cat });
        }
        [HttpPost]
        [Route("/SaveChangeCategory")]
        public async Task<IActionResult> Savechange(int id, string name, string description, bool enable, int displayOrder, string? color)
        {
            MD5Hash _md5 = new MD5Hash();
            if (id == 0)
            {
                var zenCourse = new QuestionCategory
                {
                    Name = name,
                    Description = description,
                    Enable = enable,
                    DisplayOrder = displayOrder,
                    Color = color
                };
                _context.QuestionCategories.Add(zenCourse);
            }
            else
            {
                var user = await _context.QuestionCategories.FindAsync(id);
                if (user == null)
                    return NotFound();

                user.DisplayOrder = displayOrder;
                user.Name = name;
                user.Description = description;
                user.Enable = enable;
                user.Color = color;
            }

            await _context.SaveChangesAsync();
            return Json(new { success = true, message = "Đã cập nhật danh mục thành công!" });
        }

        [HttpPost]
        [Route("/DeleteCategory")]
        public async Task<IActionResult> Delete(int id)
        {
            var category = await _context.QuestionCategories.FindAsync(id);
            if (category == null)
                return Json(new { success = false, message = "Không tìm thấy danh mục!" });

            // Chỉ cần xóa danh mục, các bảng liên quan sẽ tự động xóa
            _context.QuestionCategories.Remove(category);
            await _context.SaveChangesAsync();
            return Json(new { success = true, message = "Đã xóa danh mục thành công!" });
        }

        public async Task<IActionResult> GetSettingById(int id)
        {
            var setting = await _context.categoryResultSettings.FindAsync(id);
            if (setting == null)
            {
                return Json(new { success = false, message = "Không tìm thấy thông tin cài đặt" });
            }
            return Json(new { success = true, setting });
        }
        [HttpPost]
        public async Task<IActionResult> SavechangeSetting(int id,int categoryId, int fromPoint,int toPoint, string description)
        {
            MD5Hash _md5 = new MD5Hash();
            if (id == 0)
            {
                var setting = new CategoryResultSetting
                {
                    FromPoint = fromPoint,
                    ToPoint = toPoint,
                    CategoryId = categoryId,
                    Description = description
                };
                _context.categoryResultSettings.Add(setting);
                await _context.SaveChangesAsync();
                return Json(new { success = true,message="Đã thêm cài đặt cho danh mục!" });
            }
            else
            {
                var setting = await _context.categoryResultSettings.FindAsync(id);
                if (setting == null)
                    return NotFound();

                setting.FromPoint = fromPoint;
                setting.ToPoint = toPoint;
                setting.CategoryId = categoryId;
                setting.Description = description;
                await _context.SaveChangesAsync();
                return Json(new { success = true,message="Đã cập nhật cài đặt của danh mục!" });
            }
        }
        [HttpPost]
        public async Task<IActionResult> DeleteSetting(int id)
        {
            var setting = await _context.categoryResultSettings.FindAsync(id);
            if (setting == null)
                return Json(new { success = false, message = "Không tìm thấy cài đặt danh mục!" });
            _context.categoryResultSettings.Remove(setting);
            await _context.SaveChangesAsync();
            return Json(new { success = true, message = "Đã xóa danh mục thành công!" });
        }
    }
}
