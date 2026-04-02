namespace AppTest.Models
{
    public class CategoryResultDto
    {
        public int CategoryId { get; set; }
        public int EarnedPoints { get; set; }
        public int MaxPoints { get; set; }
        public int AgeGroup { get; set; }
    }

    public class SaveCategoryResultRequest
    {
        public int SessionId { get; set; }
        public List<CategoryResultDto> CategoryResults { get; set; }
    }
    public class QuestionResultInput
    {
        public int SessionId { get; set; }
        public int QuestionId { get; set; }
        public int? PointEarned { get; set; }
        public int? MaxPoint { get; set; }
    }

    public class SubmitPaperQuestionResultsRequest
    {
        public int SessionId { get; set; }
        public List<QuestionResultInput> Results { get; set; }
        public string? GeneralComment { get; set; }
    }
}
