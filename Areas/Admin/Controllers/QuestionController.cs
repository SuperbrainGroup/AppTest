using AppTest.Helper;
using AppTest.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using Newtonsoft.Json.Linq;
using Newtonsoft.Json;
using System.Net.Http;
using System.Drawing;
using static System.Net.Mime.MediaTypeNames;
namespace AppTest.Areas.Admin.Controllers
{
    [Area("Admin")]
    [Authorize(Policy = AppPolicies.AdminOnly)]
    public class QuestionController : Controller
    {
        public ModelDbContext _context;
        private readonly IHttpClientFactory _httpClientFactory;
        public QuestionController(ModelDbContext context, IHttpClientFactory httpClientFactory) {
            _context = context;
            _httpClientFactory = httpClientFactory;
        }
        [Route("/admin/cai-dat-cau-hoi")]
        public IActionResult Index()
        {
            return View();
        }

        public async Task<IActionResult> GetQuestionById(int id) {
            var question = await _context.Questions.FindAsync(id);
            if (question == null)
            {
                return Json(new { success = false, message = "Không tìm thấy thông tin câu hỏi" });
            }
            return Json(new {success=true, question=question});
        }
      
        [HttpPost]
        public async Task<IActionResult> ToggleOnPaper(int id)
        {
            var user = _context.Questions.Find(id);
            if (user == null)
            {
                return Json(new { success = false, message = "Không tìm thấy thông tin câu hỏi!" });
            }
            user.OnPaper = !user.OnPaper;
            await _context.SaveChangesAsync();

            return Json(new { success = true, message = "Đã cập nhật loại câu hỏi thành công!" });
        }

        [HttpPost]
        [Route("SubmitDeleteQuestion")]
        public async Task<IActionResult> SubmitDeleteQuestion(int id)
        {
            try
            {
                var question = _context.Questions.Find(id);
                if (question == null)
                {
                    return Json(new { success = false, message = "Không tìm thấy câu hỏi!" });
                }
                _context.Questions.Remove(question);
                _context.SaveChanges();
                return Json(new { success = true, message = "Đã xóa câu hỏi thành công!" });
            }
            catch (Exception ex)
            {
                // Ghi log lỗi ngoại lệ// Ghi log lỗi ngoại lệ
                return Json(new { success = false, message = "An error occurred.", details = ex.Message });
            }
        }

        [HttpGet]
        [Route("LoadListQuestion")]
        public async Task<IActionResult> GetQuestions(int categoryId,string searchString)
        {
            var question = _context.Questions.AsQueryable();

            if (categoryId != 0)
            {
                question = question.Where(x => x.CategoryId == categoryId);
            }
            if (!string.IsNullOrEmpty(searchString))
            {
                question = question.Where(x => x.Name.Contains(searchString));
            }

            var questions = await question
                                .OrderBy(x => x.Lop)
                                .ThenBy(x => x.Id)
                                .Include(q => q.Answers)
                                .Include(q => q.Category)
                                .Select(q => new
                                {
                                    q.Id,
                                    q.Name,
                                    q.OnPaper,
                                    Image = q.Image,
                                    Audio = q.Audio,
                                    maxPoint = q.MaxPoint,
                                    ageGroup = q.AgeGroup,
                                    lop = q.Lop,
                                    lopLabel = q.Lop == -2 ? "Mầm" :
                                                q.Lop == -1 ? "Chồi" :
                                                q.Lop == 0 ? "Lá" :
                                                q.Lop == 6 ? "Lớp 5+" :
                                                q.Lop != null ? $"Lớp {q.Lop}" : "Chưa chọn lớp",
                                    ageText = q.AgeGroup != null ? AgeConvert.ageText((int)q.AgeGroup) : "-",
                                    ageColor = q.AgeGroup != null ? AgeConvert.ageColor((int)q.AgeGroup) : "#94a3b8",
                                    categoryName = q.Category != null ? q.Category.Name : "Unknow",
                                    categoryColor = q.Category != null ? q.Category.Color : "#198754",
                                    Answers = q.Answers.Where(x => x.QuestionId == q.Id).Select(a => new { a.Id, a.AnswerText, a.Point, a.Image })
                                }).ToListAsync();
            return Json(new { success = true, data = questions });
        }

        [HttpGet]
        [Route("GetCategoryQuestions")]
        public JsonResult GetCategoryQuestions()
        {
            var categories = _context.QuestionCategories.Where(x=>x.Enable==true)
                .Select(c => new { Id = c.Id, Name = c.Name })
                .ToList();

            return Json(new { categories });
        }

        [HttpPost]
        public async Task<IActionResult> SaveChange(int id, int categoryId, string name, int lop, int maxPoint, IFormFile image, IFormFile audio, bool onPaper) 
        {
            try
            {
                if (lop < -2 || lop > 6)
                {
                    return Json(new { success = false, message = "Danh mục lớp không hợp lệ (Mầm đến 5+)." });
                }

                string imageUrl = null;
                string audioUrl = null;

                if (image != null && image.Length > 0)
                {
                    var uploadsFolder = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot/uploads/answers");
                    if (!Directory.Exists(uploadsFolder))
                    {
                        Directory.CreateDirectory(uploadsFolder);
                    }

                    var uniqueFileName = Guid.NewGuid().ToString() + Path.GetExtension(image.FileName);
                    var filePath = Path.Combine(uploadsFolder, uniqueFileName);

                    using (var stream = new FileStream(filePath, FileMode.Create))
                    {
                        await image.CopyToAsync(stream);
                    }

                    imageUrl = "/uploads/answers/" + uniqueFileName;
                }

                if (audio != null && audio.Length > 0)
                {
                    var uploadsFolder = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot/uploads/audio/questions");
                    if (!Directory.Exists(uploadsFolder))
                    {
                        Directory.CreateDirectory(uploadsFolder);
                    }

                    var uniqueFileName = Guid.NewGuid().ToString() + Path.GetExtension(audio.FileName);
                    var filePath = Path.Combine(uploadsFolder, uniqueFileName);

                    using (var stream = new FileStream(filePath, FileMode.Create))
                    {
                        await audio.CopyToAsync(stream);
                    }

                    audioUrl = "/uploads/audio/questions/" + uniqueFileName;
                }

                if (id == 0)
                {
                    var question = new Question()
                    {
                        Lop = lop,
                        AgeGroup = null,
                        CategoryId = categoryId,
                        Name = name,
                        MaxPoint = maxPoint,
                        Iduser = 1,
                        DateCreate = DateTime.Now,
                        Image = imageUrl,
                        Audio = audioUrl,
                        OnPaper = onPaper 
                    };
                    _context.Questions.Add(question);
                    await _context.SaveChangesAsync();

                    return Json(new { success = true, message = "Đã thêm mới câu hỏi thành công!" });
                }
                else
                {
                    var question = await _context.Questions.FindAsync(id);
                    if (question == null)
                        return Json(new { success = false, message = "Không tìm thấy thông tin câu hỏi!" });

                    question.Name = name;
                    question.Lop = lop;
                    question.AgeGroup = null;
                    question.CategoryId = categoryId;
                    question.MaxPoint = maxPoint;
                    question.OnPaper = onPaper; 

                    if (imageUrl != null)
                    {
                        question.Image = imageUrl;
                    }
                    if (audioUrl != null)
                    {
                        question.Audio = audioUrl;
                    }
                    await _context.SaveChangesAsync();
                    return Json(new { success = true, message = "Đã cập nhật câu hỏi thành công!" });
                }
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = $"Lỗi: {ex.Message}" });
            }
        }
        public async Task<IActionResult> GetAnswerById(int id)
        {
            var answer = await _context.Answers.FindAsync(id);
            if (answer == null)
            {
                return Json(new { success = false, message = "Không tìm thấy thông tin đáp án" });
            }
            return Json(new { success = true, answer  });
        }

        [HttpPost]
        public async Task<IActionResult> SaveChangeAnswer(int id, int questionId, string answerText, int point, IFormFile image)
        {
            try
            {
                string imageUrl = null;

                // Kiểm tra nếu có ảnh được tải lên
                if (image != null && image.Length > 0)
                {
                    var uploadsFolder = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot/uploads/answers");
                    if (!Directory.Exists(uploadsFolder))
                    {
                        Directory.CreateDirectory(uploadsFolder);
                    }

                    var uniqueFileName = Guid.NewGuid().ToString() + Path.GetExtension(image.FileName);
                    var filePath = Path.Combine(uploadsFolder, uniqueFileName);

                    using (var stream = new FileStream(filePath, FileMode.Create))
                    {
                        await image.CopyToAsync(stream);
                    }

                    imageUrl = "/uploads/answers/" + uniqueFileName;
                }
                if (id == 0)
                {
                    var answer = new Answer()
                    {
                        AnswerText = answerText,
                        QuestionId = questionId,
                        Point = point,
                        Image = imageUrl
                    };
                    _context.Answers.Add(answer);
                    await _context.SaveChangesAsync();

                    return Json(new { success = true, message = "Đã thêm mới đáp án thành công!" });
                }
                else
                {
                    var answer = await _context.Answers.FindAsync(id);
                    if (answer == null)
                        return Json(new { success = false, message = "Không tìm thấy thông tin đáp án!" });

                    answer.AnswerText = answerText;
                    answer.Point = point;
                    answer.QuestionId = questionId;
                    if (imageUrl != null)
                    {
                        answer.Image = imageUrl;
                    }
                    await _context.SaveChangesAsync();
                    return Json(new { success = true, message = "Đã cập nhật đáp án thành công!" });
                }
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = $"Lỗi: {ex.Message}" });
            }
        }

        [HttpPost]
        [Route("SubmitDeleteAnswer")]
        public async Task<IActionResult> SubmitDeleteAnswer(int id)
        {
            try
            {
                var answer = _context.Answers.Find(id);
                if (answer == null)
                {
                    return Json(new { success = false, message = "Không tìm thấy đáp án!" });
                }
                _context.Answers.Remove(answer);
                _context.SaveChanges();
                return Json(new { success = true, message = "Đã xóa đáp án thành công!" });
            }
            catch (Exception ex)
            {
                // Ghi log lỗi ngoại lệ// Ghi log lỗi ngoại lệ
                return Json(new { success = false, message = "An error occurred.", details = ex.Message });
            }
        }
    }
}
