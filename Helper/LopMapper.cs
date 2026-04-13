using System;

namespace AppTest.Helper
{
    public static class LopMapper
    {
        /// <summary>
        /// Convert management system class codes into the current test app internal codes.
        /// Management system uses: 1 = Mầm, 2 = Chồi, 3 = Lá, 4 = Lớp 1, ..., 9 = Lớp 5+.
        /// Internal test app uses: -2 = Mầm, -1 = Chồi, 0 = Lá, 1 = Lớp 1, ..., 6 = Lớp 5+.
        /// </summary>
        public static bool TryConvertManagementLopToAppLop(int managementLop, out int appLop)
        {
            if (managementLop >= 1 && managementLop <= 9)
            {
                appLop = managementLop - 3;
                return true;
            }

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
