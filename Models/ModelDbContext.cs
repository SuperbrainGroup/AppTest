using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;
using System.Reflection.Emit;

namespace AppTest.Models
{
    public class ModelDbContext : DbContext
    {
        public ModelDbContext(DbContextOptions<ModelDbContext> options) : base(options) { }

        public DbSet<QuestionCategory> QuestionCategories { get; set; }
        public DbSet<Question> Questions { get; set; }
        public DbSet<Answer> Answers { get; set; }
        public DbSet<ResultDescriptionSetting> ResultDescriptionSettings { get; set; }
        public DbSet<UserTest> UserTests { get; set; }
        public DbSet<UserTestDetail> UserTestDetails { get; set; }
        public DbSet<CategoryResultSetting> categoryResultSettings { get; set; }
        public DbSet<QuestionResult> questionResults { get; set; }
        public DbSet<AppSetting> AppSettings { get; set; }
        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);
            modelBuilder.Entity<UserTestDetail>()
               .HasKey(hj => new { hj.CategoryId, hj.ResultId,hj.AgeGroup });

            modelBuilder.Entity<QuestionResult>()
                .HasKey(hj => new { hj.SessionId, hj.QuestionId });

            modelBuilder.Entity<QuestionResult>()
                .HasOne(qr => qr.Question)
                .WithMany(q => q.QuestionResults)
                .HasForeignKey(qr => qr.QuestionId)
                .OnDelete(DeleteBehavior.Cascade);  // Xóa QuestionResult khi Question bị xóa

            modelBuilder.Entity<CategoryResultSetting>()
                .HasOne(q => q.QuestionCategory)
                .WithMany(c => c.CategoryResultSettings)
                .HasForeignKey(q => q.CategoryId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Question>()
                .HasOne(q => q.Category)
                .WithMany(c => c.Questions)
                .HasForeignKey(q => q.CategoryId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Answer>()
                .HasOne(a => a.Question)
                .WithMany(q => q.Answers)
                .HasForeignKey(a => a.QuestionId)
                .OnDelete(DeleteBehavior.Cascade);  // Cho phép xóa cascade
        }
    }
    [Table("AppSetting")]
    public class AppSetting
    {
        [Key]
        public string SettingKey { get; set; }
        public string? SettingValue { get; set; }
    }
    [Table("QuestionCategory")]
    public class QuestionCategory
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]  // Ensures that the Id is auto-generated
        public int Id { get; set; }
        public string? Name { get; set; }
        public string? Description { get; set; }
        public bool? Enable { get; set; }
        public int? DisplayOrder { get; set; }
        public string? Color { get; set; }

        public ICollection<Question> Questions { get; set; }
        public ICollection<CategoryResultSetting>? CategoryResultSettings { get; set; }
    }

    [Table("CategoryResultSetting")]
    public class CategoryResultSetting
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)] 
        public int Id { get; set; }
        public int? CategoryId { get; set; }
        public int? FromPoint { get; set; }
        public int? ToPoint { get; set; }
        public string? Description { get; set; }
        public QuestionCategory QuestionCategory { get; set; }
    }

    [Table("Question")]
    public class Question
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        public string? Name { get; set; }

        public int DisplayOrder { get; set; }

        public int? CategoryId { get; set; }

        public int? AgeGroup { get; set; }

        /// <summary>Lớp 1–12; dùng để lọc câu hỏi online/in giấy (thay cho nhóm tuổi khi làm bài).</summary>
        public int? Lop { get; set; }

        public int? MaxPoint { get; set; }

        public int? Iduser { get; set; }
        public bool? OnPaper { get; set; }

        public DateTime? DateCreate { get; set; }
        public string? Image { get; set; }
        public string? Audio { get; set; }
        
        /// <summary>Trạng thái câu hỏi: true = hiển thị, false = ẩn (xóa mềm).</summary>
        public bool Enable { get; set; } = true;

        [ForeignKey("CategoryId")]
        public QuestionCategory Category { get; set; }

        public ICollection<Answer> Answers { get; set; }
        public ICollection<QuestionResult> QuestionResults { get; set; }
    }

    [Table("QuestionResult")]
    public class QuestionResult
    {
        public int SessionId { get; set; }
        public int QuestionId { get; set; }
        public int? PointEarned { get; set; }
        public int? MaxPoint { get; set; }
        public DateTime? CreateAt { get; set; }
        public int? CategoryId { get; set; }
        [ForeignKey("QuestionId")]
        public Question Question { get; set; }

        [ForeignKey("SessionId")]
        public UserTest UserTest { get; set; }
    }

    [Table("Answer")]
    public class Answer
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]  // Ensures that the Id is auto-generated
        public int Id { get; set; }

        [ForeignKey("Question")]
        public int? QuestionId { get; set; }

        public string? AnswerText { get; set; }
        public int? Point { get; set; } // 0 for incorrect, lower points for close, max points for correct
        public string? Image { get; set; }
        public Question? Question { get; set; }
    }


    [Table("ResultDescriptionSetting")]
    public class ResultDescriptionSetting
    {
        public int Id { get; set; }
        public int? CategoryId { get; set; }
        public int? AgeGroup { get; set; }
        public decimal? FromPoint { get; set; }
        public decimal? ToPoint { get; set; }
        public string? Description { get; set; }

    }

    [Table("UserTest")]
    public class UserTest
    {
        public int Id { get; set; }
        public int? UserId { get; set; }
        public int? idChiNhanh { get; set; }
        public string? tenChiNhanh { get; set; }
        public int? AgeGroup { get; set; }
        /// <summary>Lớp 1–12 của học viên tại thời điểm làm bài.</summary>
        public int? Lop { get; set; }
        public int? CourseId { get; set; }
        public DateTime? DateCreate { get; set; }
        public bool? IsComplete { get; set; }
        public string? CourseName { get; set; }
        public int? TimeToCompleted { get; set; }
        public string? GeneralComment { get; set; }
    }

    [Table("UserTestDetail")]
    public class UserTestDetail
    {
        public int ResultId { get; set; }
        public int CategoryId { get; set; }
        public int PointEarned { get; set; } = 0;
        public int TotalPoint { get; set; } = 0;
        public int AgeGroup { get; set; }
    }

    public class User
    {
        public int Id { get; set; }
        public string? ten { get; set; }
        public string Email { get; set; }
        public string phhs_dienthoai { get; set; }
        public string ngaysinh { get; set; }
        public string mahs { get; set; }
        public string sex { get; set; }
        public string UserLog { get; set; }
        public string matkhau { get; set; }
        public int idChiNhanh { get; set; }
        public string? tenChiNhanh { get; set; }
        public int lop { get; set; }
        public int ageGroup { get; set; }
        public int courseId { get; set; }
        public string courseName { get; set; }
    }
    // DTO nhận dữ liệu từ API
    public class StudentDto
    {
        public int idhocvien { get; set; }
        public string mahocvien { get; set; }
        public string tenhocvien { get; set; }
        public string namsinh { get; set; }
        public string sex { get; set; }
        public string email { get; set; }
        public string phhs_dienthoai { get; set; }
        public string userLog { get; set; }
        public string matkhau { get; set; }
        public int idkhoahoc { get; set; }
        public int lop { get; set; }
        public string tenkhoahoc { get; set; }
        public int? idChiNhanh { get; set; }
        public string? tenChiNhanh { get; set; }
    }
    public class UserDto
    {
        public int id { get; set; }
        public string hoten { get; set; }
        public int idChiNhanh { get; set; }
    }
    public class StudentByTeacherDto
    {
        public int id { get; set; }
        public int idChiNhanh { get; set; }
        public string mahs { get; set; }
        public string ten { get; set; }
        public string sex { get; set; }
        public DateTime namsinh { get; set; }
        public string email { get; set; }
        public string phhS_dienthoai { get; set; }
        public string userLog { get; set; }
    }

    // DTO trả về danh sách học viên kèm trạng thái bài test
    public class StudentWithTestStatus
    {
        public int Id { get; set; }
        public string mahs { get; set; }
        public string ten { get; set; }
        public string Email { get; set; }
        public string dienthoai { get; set; }
        public DateTime namsinh { get; set; }
        public string CourseName { get; set; }
        public int? Lop { get; set; }
        public bool HasTestResult { get; set; }
        public int NumberTest { get; set; }
        public DateTime? DateTest { get; set; }
    }


    public class TestResultModel
    {
        public int CategoryId { get; set; }
        public int TotalQuestions { get; set; }
        public int AnsweredQuestions { get; set; }
        public int CorrectAnswers { get; set; }
        public decimal CorrectPercentage { get; set; }
    }
}
