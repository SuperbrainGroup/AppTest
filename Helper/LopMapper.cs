using System;

namespace AppTest.Helper
{
    public static class LopMapper
    {
        public static bool TryConvertManagementLopToAppLop(int managementLop, out int appLop)
        {
            if (managementLop >= -2 && managementLop <= 6)
            {
                appLop = managementLop;
                return true;
            }

            appLop = 0;
            return false;
        }

        public static bool IsValidAppLop(int appLop)
        {
            return appLop >= -2 && appLop <= 6;
        }

        public static string ToDisplayText(int appLop)
        {
            return appLop == -2 ? "Mầm"
                : appLop == -1 ? "Chồi"
                : appLop == 0 ? "Lá"
                : $"Lớp {appLop}";
        }
    }
}
