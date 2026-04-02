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
        public TestSettingController(ModelDbContext context)
        {
            _context = context;
        }
        [Route("/admin/test-setting")]
        public IActionResult Index()
        {
            return View();
        }
      
    }
}
