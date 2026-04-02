namespace AppTest.Helper
{
    public class AgeConvert
    {
        public static string ageText(int age)
        {
            switch(age)
            {
                case 1:
                    return "Từ 3 đến 4 tuổi";
                case 2:
                    return "Từ 4 đến 5 tuổi";
                case 3:
                    return "Từ 5 đến 6 tuổi";
                case 4:
                    return "Từ 6 đến  7 tuổi";
                case 5:
                    return "Từ 7 đến  8 tuổi";
                case 6:
                    return "Từ 8 đến 9 tuổi";
                case 7:
                    return "Từ 9 đến 10 tuổi";
                case 8:
                    return "Từ 10 tuổi";
                default:
                    return "Dưới 3  tuổi";
            }
        }
        public static string ageColor(int age) 
        {

            switch (age)
            {
                case 1:
                    return "bg-secondary";
                case 2:
                    return "bg-warning";
                case 3:
                    return "bg-success";
                case 4:
                    return "bg-info";
                case 5:
                    return "bg-primary";
                default:
                    return "bg-secondary";
            }
        }
        public static int CalculateAge(DateTime birthDate)
        {
            DateTime today = DateTime.Today;
            // Tính tuổi CHỈ theo năm sinh: trẻ cùng năm sinh sẽ cùng một nhóm tuổi,
            // không phụ thuộc ngày/tháng sinh cụ thể.
            int age = today.Year - birthDate.Year;
            return age < 0 ? 0 : age;
        }
        public static int CalculateAgeGroup(DateTime birthDate)
        {
            int age = CalculateAge(birthDate);

            if (age >= 3 && age < 4)
                return 1; // Từ 3 đến 4 tuổi
            if (age >= 4 && age < 5)
                return 2; // Từ 4 đến 6 tuổi
            if (age >= 5 && age < 6)
                return 3; // Từ 4 đến 6 tuổi
            if (age >= 6 && age < 7)
                return 4; // Từ 6 đến 8 tuổi
            if (age >= 7 && age < 8)
                return 5; // Từ 6 đến 8 tuổi
            if (age >= 8 && age < 9)
                return 6; // Từ 8 đến 10 tuổi
            if (age >= 9 && age < 10)
                return 7; // Từ 8 đến 10 tuổi
            if (age >= 10)
                return 8; // Từ 10 tuổi
            return 0; // Dưới 3 tuổi
        }
    }
}
