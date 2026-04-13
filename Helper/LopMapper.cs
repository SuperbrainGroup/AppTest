using System;

namespace AppTest.Helper
{
    public static class LopMapper
    {
        public static bool TryNormalizeLopCode(int rawLop, out int normalizedLop)
        {
            if (rawLop >= 1 && rawLop <= 9)
            {
                normalizedLop = rawLop;
                return true;
            }

            if (rawLop >= -2 && rawLop <= 6)
            {
                normalizedLop = rawLop + 3;
                return true;
            }

            normalizedLop = 0;
            return false;
        }

        public static bool IsValidLop(int lop)
        {
            return lop >= 1 && lop <= 9;
        }

        public static bool TryConvertManagementLopToAppLop(int managementLop, out int appLop)
        {
            return TryNormalizeLopCode(managementLop, out appLop);
        }

        public static bool IsValidAppLop(int appLop)
        {
            return IsValidLop(appLop);
        }

        public static int NormalizeLegacyLopCode(int rawLop)
        {
            return rawLop >= -2 && rawLop <= 6 ? rawLop + 3 : rawLop;
        }

        public static string ToDisplayText(int lop)
        {
            return lop == 1 ? "Mầm"
                : lop == 2 ? "Chồi"
                : lop == 3 ? "Lá"
                : lop == 9 ? "Lớp 5+"
                : lop >= 4 && lop <= 8 ? $"Lớp {lop - 3}"
                : "Chưa chọn lớp";
        }
    }
}
